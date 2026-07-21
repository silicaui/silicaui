#!/usr/bin/env bash
# One-time GCP setup for the SilicaUI site's CI/CD. Run once, by someone with
# owner/IAM-admin on the `sparxworks` project. Every step mirrors the working
# kanNINJA precedent (kanninja-deployer + kanninja-pool). Safe to re-run: each
# command is create-or-noop except the IAM bindings, which are idempotent.
set -euo pipefail

PROJECT=sparxworks
PROJNUM=631794111842
REGION=us-central1
REPO=silicaui
SA=silicaui-deployer
GH_REPO=silicaui/silicaui          # the GitHub repo allowed to deploy
POOL=silicaui-pool
PROVIDER=silicaui-provider
SA_EMAIL="$SA@$PROJECT.iam.gserviceaccount.com"

echo "==> 1/6  Artifact Registry repo ($REPO, $REGION)"
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker --location="$REGION" --project="$PROJECT" \
  --description="SilicaUI marketing site images" || echo "  (exists, skipping)"

echo "==> 2/6  Deployer service account ($SA)"
gcloud iam service-accounts create "$SA" \
  --display-name="SilicaUI CD deployer" --project="$PROJECT" || echo "  (exists, skipping)"

echo "==> 3/6  Project roles (mirror kanninja-deployer)"
for role in roles/container.developer roles/gkehub.gatewayEditor roles/gkehub.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:$SA_EMAIL" --role="$role" --condition=None >/dev/null
  echo "  granted $role"
done

echo "==> 4/6  Artifact Registry access on the $REPO repo"
# Deployer pushes; the GKE node/compute SA pulls. Without the reader grant the
# cluster can't pull the image (ImagePullBackOff) — same members kanNINJA's repo
# grants.
gcloud artifacts repositories add-iam-policy-binding "$REPO" \
  --location="$REGION" --project="$PROJECT" \
  --member="serviceAccount:$SA_EMAIL" --role=roles/artifactregistry.writer >/dev/null
gcloud artifacts repositories add-iam-policy-binding "$REPO" \
  --location="$REGION" --project="$PROJECT" \
  --member="serviceAccount:${PROJNUM}-compute@developer.gserviceaccount.com" \
  --role=roles/artifactregistry.reader >/dev/null

echo "==> 5/6  Workload Identity pool + provider trusting $GH_REPO"
gcloud iam workload-identity-pools create "$POOL" \
  --location=global --project="$PROJECT" \
  --display-name="SilicaUI GitHub Actions" || echo "  (pool exists, skipping)"
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
  --location=global --project="$PROJECT" --workload-identity-pool="$POOL" \
  --display-name="SilicaUI GitHub provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository == '$GH_REPO'" || echo "  (provider exists, skipping)"

echo "==> 6/6  Let $GH_REPO impersonate the deployer SA"
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" --project="$PROJECT" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJNUM/locations/global/workloadIdentityPools/$POOL/attribute.repository/$GH_REPO" >/dev/null

cat <<EOF

Done. Now set these two GitHub → Settings → Secrets and variables → Actions → Variables
on the ${GH_REPO} repo (they are not secrets — WIF uses no long-lived key):

  GCP_WIF_PROVIDER = projects/${PROJNUM}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}
  GCP_DEPLOYER_SA  = ${SA_EMAIL}
EOF
