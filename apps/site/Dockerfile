# Runtime-only image: it serves a static export that CI has already built.
#
# The `out/` directory is produced by `pnpm build && pnpm site:build` (the whole
# workspace must be built first so Next can resolve `@wizeworks/silicaui-*`
# entry points). We deliberately DON'T rebuild the monorepo inside Docker — the
# CI job that runs the real build simply copies its `out/` in here, which keeps
# this image tiny and the build fast. Build context is `apps/site/`.
#
# nginx-unprivileged listens on 8080 and runs as a non-root user (uid 101) out
# of the box, which is what GKE Autopilot wants — no securityContext gymnastics.
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY out /usr/share/nginx/html

# Pre-compress text assets once so nginx `gzip_static` serves them with no CPU per request.
USER root
RUN find /usr/share/nginx/html -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.json' -o -name '*.svg' -o -name '*.txt' -o -name '*.xml' \) -size +1k -exec gzip -9 -k -f {} +
USER 101

EXPOSE 8080
