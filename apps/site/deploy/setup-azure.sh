#!/usr/bin/env bash
# One-time Azure setup for the SilicaUI site's CI/CD. Run once, by someone who
# can create app registrations in the tenant AND assign roles on the AKS
# cluster. Safe to re-run: every step is create-or-noop.
#
# This replaces setup-gcp.sh. It creates the identity that
# .github/workflows/deploy-site-azure.yml assumes — nothing else. There is no
# registry to provision (GHCR comes with the GitHub repo) and no cluster to
# provision (silicaui is a co-tenant of the platform's AKS cluster, which the
# sparx repo's terraform owns).
#
# WHAT THIS GRANTS, stated honestly: the AKS cluster has no Entra integration
# (`aadProfile: null`) and local accounts are enabled, so `az aks
# get-credentials` hands back a client-certificate kubeconfig with full cluster
# rights. "Azure Kubernetes Service Cluster User Role" is therefore effectively
# cluster-admin INSIDE the cluster, and a namespace-scoped Kubernetes RBAC role
# would not constrain it. What the scope does buy is real: it is the only role
# this identity holds, on one resource, so it can manage nothing else in the
# subscription — no VMs, no networking, no storage, not even the cluster's own
# Azure configuration. Narrowing the in-cluster half means turning on Entra
# integration + Azure RBAC for Kubernetes authorization on the cluster, which is
# a platform-wide change owned by the sparx repo.
set -euo pipefail

SUBSCRIPTION=13b32167-3051-4e00-8bbd-0f7d578a06eb
RESOURCE_GROUP=rg-sparx-prod-cus
CLUSTER=aks-sparx-prod-cus
APP_NAME=gha-silicaui
GH_REPO=silicaui/silicaui # the GitHub repo allowed to deploy

az account set --subscription "$SUBSCRIPTION"
TENANT=$(az account show --query tenantId -o tsv)

echo "==> 1/4  App registration ($APP_NAME)"
APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)
if [ -z "$APP_ID" ]; then
  APP_ID=$(az ad app create --display-name "$APP_NAME" \
    --sign-in-audience AzureADMyOrg --query appId -o tsv)
  echo "  created $APP_ID"
else
  echo "  (exists, skipping) $APP_ID"
fi

echo "==> 2/4  Service principal"
az ad sp show --id "$APP_ID" >/dev/null 2>&1 ||
  az ad sp create --id "$APP_ID" >/dev/null
SP_OBJECT_ID=$(az ad sp show --id "$APP_ID" --query id -o tsv)

# The federated credential is the whole trust relationship — there is no secret
# anywhere. Entra matches `subject` EXACTLY against the token GitHub mints, so a
# fork, a branch, or a pull request runs under a different subject and cannot
# assume this identity. A typo here does not fail at setup time; it fails at
# deploy time with an opaque AADSTS700213.
#
# Only `ref:refs/heads/main` is trusted. If the workflow ever declares
# `environment: <name>`, the subject becomes `repo:${GH_REPO}:environment:<name>`
# and needs its own credential added here.
#
# The audience is `api://AzureADTokenExchange` and is not a free choice — it is
# the audience `azure/login` requests the OIDC token for. Registering the
# app's sign-in audience value (`api://AzureADMyOrg`) here instead looks
# plausible, applies cleanly, and then fails every deploy with AADSTS700212
# "No matching federated identity record found for presented assertion
# audience". Ask me how I know.
echo "==> 3/4  Federated credential trusting $GH_REPO on main"
if az ad app federated-credential list --id "$APP_ID" \
  --query "[?name=='github-main']" -o tsv | grep -q .; then
  echo "  (exists, skipping)"
else
  az ad app federated-credential create --id "$APP_ID" --parameters "{
    \"name\": \"github-main\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:${GH_REPO}:ref:refs/heads/main\",
    \"description\": \"GitHub Actions deploying silicaui.com from main\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" -o none
  echo "  created"
fi

echo "==> 4/4  Cluster access, scoped to the one cluster"
SCOPE="/subscriptions/${SUBSCRIPTION}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.ContainerService/managedClusters/${CLUSTER}"
az role assignment create \
  --assignee-object-id "$SP_OBJECT_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Azure Kubernetes Service Cluster User Role" \
  --scope "$SCOPE" -o none 2>/dev/null || echo "  (already assigned, skipping)"

cat <<EOF

Done. Set these three as GitHub → Settings → Secrets and variables → Actions →
Variables on ${GH_REPO}. They are IDs, not secrets — OIDC uses no stored
credential, and the federated credential above is what actually gates access:

  AZURE_CLIENT_ID       = ${APP_ID}
  AZURE_TENANT_ID       = ${TENANT}
  AZURE_SUBSCRIPTION_ID = ${SUBSCRIPTION}

  gh variable set AZURE_CLIENT_ID       -R ${GH_REPO} -b '${APP_ID}'
  gh variable set AZURE_TENANT_ID       -R ${GH_REPO} -b '${TENANT}'
  gh variable set AZURE_SUBSCRIPTION_ID -R ${GH_REPO} -b '${SUBSCRIPTION}'

Note for anyone running this from Git Bash on Windows: MSYS rewrites arguments
that start with '/' into Windows paths, which turns every --scope into garbage
and yields a baffling "MissingSubscription" from ARM. Export MSYS_NO_PATHCONV=1
before running.
EOF
