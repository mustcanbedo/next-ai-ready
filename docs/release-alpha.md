# Alpha release runbook

Use the manual **Release Alpha** GitHub Actions workflow for npm prereleases.
It never runs on push or pull requests.

## One-time setup

1. Create an npm granular access token with read/write access to
   `next-ai-ready`, `create-next-ai-ready`, and `@next-ai-ready/*`.
2. Add it to the GitHub repository as the Actions secret `NPM_TOKEN`.
3. Keep package publishing set to public access.

Never commit or paste the token into an issue, pull request, log, or chat.

## Prepare the release

```bash
pnpm changeset
pnpm version:packages
pnpm verify:release
```

Commit and push the version, changelog, and `pre.json` updates. Wait for CI to
pass on `main` before publishing.

## Publish

1. Open **Actions > Release Alpha > Run workflow**.
2. Select `main` and enter the confirmation text `publish-alpha`.
3. Wait for the release gate and every package publish step to finish.
4. Confirm the workflow's npm verification step reports the expected tags.

The underlying script checks whether each exact package version already exists
and skips it. This makes rerunning a partially completed release safe.

## Local fallback

With npm authentication already configured locally:

```bash
pnpm verify:release
pnpm publish:alpha:interactive
```

The interactive command supports npm authentication that requires a security
key or Touch ID.
