---
"@wizeworks/silicaui": patch
---

**Releases now happen on merge, with nothing to click.**

No runtime change in any package — this is the release pipeline itself, and the first
version cut by it.

Merging a changeset to `main` used to open a "Version Packages" PR that had to be
opened and merged by hand before a second workflow run would publish. Half this repo's
commits and half its PRs were that ceremony, every one of them merged within seconds
and unreviewed, and ~40% of release runs failed outright creating the PR because the
org disables "Allow GitHub Actions to create and approve pull requests" — leaving a
pushed branch and no PR to clean up.

The Version PR is gone. `ci.yml` is now one graph — lint, build, verify, site, then
release and deploy — so publishing is a `needs:`-gated job that cannot start unless CI
is green. Previously release and deploy raced CI rather than following it, and a red
build could reach both npm and silicaui.com.

Two things are restored rather than added. Packages are tagged again, and a GitHub
Release is cut for each version: when the publish step was hand-rolled to work around
`changesets/action`, it silently dropped that action's `git push --tags` and release
creation, so roughly forty published versions have neither. And `guard-version` now
also rejects a `major` bump while the family is pre-1.0 at the moment the changeset is
authored — it previously could only fire after versions were already computed, on main.

The pipeline also stopped repeating itself: one `pnpm build` per push instead of four,
one Next export instead of two, and the deploy ships the exact `out/` CI verified
instead of rebuilding its own.
