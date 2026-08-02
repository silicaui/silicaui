# Deploying silicaui.com

The site is a Next.js static export served by nginx, running as the `site`
Deployment in the `silicaui` namespace of the **AKS** cluster that hosts the
platform (`aks-sparx-prod-cus`, resource group `rg-sparx-prod-cus`, centralus).
It sits behind the shared **Caddy** ingress in `sparx-prod` — the same model
kanNINJA uses — so it reuses the existing load balancer and gets an automatic
Let's Encrypt cert. No load balancer of its own.

```
Internet ──▶ Caddy (20.12.217.0, TLS) ──▶ site.silicaui.svc.cluster.local:80 ──▶ nginx pods
```

## It used to be GKE

silicaui.com was a co-tenant of the sparx **GKE Autopilot** cluster. sparx moved
to Azure, so silicaui followed it — a co-tenant does not get to stay behind.
Exactly three things changed:

| | before | after |
|---|---|---|
| cluster | GKE Autopilot `sparx-prod-autopilot` | AKS `aks-sparx-prod-cus` |
| registry | Artifact Registry `us-central1-docker.pkg.dev/sparxworks/silicaui` | GHCR `ghcr.io/silicaui/silicaui/site` |
| CI credential | GCP Workload Identity Federation | Entra federated credential (OIDC) |

The Deployment, the Service, and the nginx image are byte-for-byte the same idea
in both clouds, because a Deployment plus a ClusterIP Service names no vendor.
The one provider-specific object in the whole path — the `type: LoadBalancer`
Service — belongs to Caddy in the sparx repo, and even that is portable.

**During the move the site 502'd.** DNS and the Caddy host block were cut over
to Azure with the rest of the platform, but the workload itself was never
recreated on AKS, so everything in front of it was healthy and pointing at an
empty namespace. That is why the `deploy` job ends by curling the public URL: a
green rollout would not have caught it.

## Files here

| File | What it is |
|---|---|
| `../Dockerfile`, `../nginx.conf` | Runtime image: unprivileged nginx serving the prebuilt `out/` on :8080 |
| `namespace.yaml` / `deployment.yaml` / `service.yaml` | The workload (own namespace, 2 replicas, ClusterIP) |
| `kustomization.yaml` | Ties them together; CI rewrites `newTag` to pin the image |
| `caddy-silicaui.caddyfile` | **Mirror** of the host block that already ships in the sparx Caddyfile |
| `setup-azure.sh` | One-time identity setup for CI |
| `setup-gcp.sh` | Parked. The GKE workflow it paired with is gone; see its header |

## One-time setup

1. **Azure** — `bash apps/site/deploy/setup-azure.sh` (needs app-registration
   rights plus role assignment on the cluster). Creates the `gha-silicaui` app
   registration, a federated credential trusting `silicaui/silicaui` on `main`,
   and one role assignment scoped to the cluster. It prints three IDs.
2. **GitHub** — set those three as repo **Variables** (not secrets):
   `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.
3. **Caddy** — nothing to do. The `silicaui.com` host block already ships in the
   sparx repo's `k8s/ingress/Caddyfile`.
4. **DNS** — `silicaui.com` and `www.silicaui.com` A records point at
   `20.12.217.0`, grey-cloud / DNS-only in Cloudflare so ACME challenges reach
   the origin. Caddy issues the cert on the first HTTPS request.

## Ongoing

Every push to `main` runs the `deploy` job in `.github/workflows/ci.yml`: take the
`out/` the `site` job already built and CI already verified → image → GHCR → pin →
`kubectl apply -k` → wait for the rollout → **curl the public URL**. Nothing manual.

Two things changed when this folded into `ci.yml`. It `needs:` the build and check
jobs, so a red build can no longer reach silicaui.com — deploy used to race CI rather
than follow it. And there is no `paths:` filter any more: the old one listed
`apps/site/**` and `packages/**` but not `pnpm-lock.yaml` or the root `package.json`,
so a dependency bump silently skipped the deploy entirely.

## Deploying by hand

Only useful for a break-glass fix; CI is the normal path. Pushing to GHCR needs
a token with `write:packages`, which a default `gh auth login` does **not**
have — `gh auth refresh -s write:packages` first, or just dispatch the workflow.

```bash
pnpm build && pnpm site:build
TAG="sha-$(git rev-parse --short HEAD)"
IMAGE=ghcr.io/silicaui/silicaui/site
gh auth token | docker login ghcr.io -u "$(gh api user -q .login)" --password-stdin
docker build -t "$IMAGE:$TAG" apps/site
docker push "$IMAGE:$TAG"

az aks get-credentials -g rg-sparx-prod-cus -n aks-sparx-prod-cus --overwrite-existing
kubectl apply -k apps/site/deploy
kubectl set image deployment/site "site=$IMAGE:$TAG" -n silicaui
kubectl rollout status deployment/site -n silicaui
curl -sSo /dev/null -w '%{http_code}\n' https://silicaui.com/
```
