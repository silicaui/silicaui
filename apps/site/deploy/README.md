# Deploying silicaui.com

The site is a Next.js static export served by nginx, running as the `site`
Deployment in the `silicaui` namespace of the **sparx-prod Autopilot** cluster
(`sparxworks` project). It sits behind the shared **Caddy** ingress — the same
model kanNINJA uses — so it reuses the existing load balancer and gets an
automatic Let's Encrypt cert. No Google Cloud Load Balancer of its own.

```
Internet ──▶ Caddy (35.254.145.54, TLS) ──▶ site.silicaui.svc.cluster.local:80 ──▶ nginx pods
```

## Files here

| File | What it is |
|---|---|
| `../Dockerfile`, `../nginx.conf` | Runtime image: unprivileged nginx serving the prebuilt `out/` on :8080 |
| `namespace.yaml` / `deployment.yaml` / `service.yaml` | The workload (own namespace, 2 replicas, ClusterIP) |
| `kustomization.yaml` | Ties them together; lets CI pin the image tag |
| `caddy-silicaui.caddyfile` | The host block to add to the **sparx** Caddyfile (not applied from here) |
| `setup-gcp.sh` | One-time IAM/registry/WIF setup, mirroring kanNINJA |

## One-time setup

1. **GCP** — run `bash apps/site/deploy/setup-gcp.sh` (needs project IAM admin).
   Creates the `silicaui` Artifact Registry repo, the `silicaui-deployer`
   service account with the same roles as `kanninja-deployer`, and a Workload
   Identity provider trusting the `silicaui/silicaui` GitHub repo. It prints two
   values.
2. **GitHub** — set those two as repo **Variables** (not secrets):
   `GCP_WIF_PROVIDER` and `GCP_DEPLOYER_SA`.
3. **Caddy** — add the block from `caddy-silicaui.caddyfile` to the sparx
   Caddyfile source (wherever the `kanninja.com` block lives) and redeploy Caddy.
4. **DNS** — point `silicaui.com` and `www.silicaui.com` A records at
   `35.254.145.54`. Caddy issues the cert on the first HTTPS request once DNS
   resolves.

## Ongoing

Every push to `main` that touches `apps/site/**` or `packages/**` runs
`.github/workflows/deploy-site.yml`: build → image → push → `kubectl apply -k` →
roll the deployment. Nothing manual.

## First deploy by hand (optional, before CI is wired)

```bash
pnpm build && pnpm site:build
TAG="sha-$(git rev-parse --short HEAD)"
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
docker build -t "us-central1-docker.pkg.dev/sparxworks/silicaui/site:$TAG" apps/site
docker push "us-central1-docker.pkg.dev/sparxworks/silicaui/site:$TAG"
kubectl apply -k apps/site/deploy
kubectl set image deployment/site "site=us-central1-docker.pkg.dev/sparxworks/silicaui/site:$TAG" -n silicaui
kubectl rollout status deployment/site -n silicaui
```
