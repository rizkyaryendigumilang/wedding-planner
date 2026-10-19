# Wedding Planner CI/CD

## Pipelines

### Web: `deploy-web-vps.yml`

- Pull requests run ESLint, build the web bundle with base path `/wedding/`, validate referenced assets, and publish a 14-day GitHub Actions artifact.
- Pushes to `main` run the same checks when app/build files change.
- Production deployment is deliberately gated. It only runs automatically when the repository variable `ENABLE_WEDDING_WEB_AUTO_DEPLOY` is set to `true`, or from `workflow_dispatch` on `main` with **Publish the build to the production VPS** checked.
- The deployment uploads a build archive to the SSH user's home directory, stages it under `/srv/www`, validates the entry point and hashed assets, then moves the previous site to a rollback directory before publishing. It does not run database migrations or restart PocketBase/Caddy.
- The workflow fails safely if the SSH user cannot write to `/srv/www`, if the expected live directory is missing, or if staged assets do not validate.

**Important:** Do not manually deploy until the intended local Wedding Planner changes (including the `/wedding/` PWA paths and service-worker changes) have been reviewed and committed to GitHub. The VPS currently contains local changes that are not automatically included in a GitHub Actions checkout.

### Mobile: `build-and-sync-vps.yml`

- Builds Android debug APK and an **unsigned** iOS IPA as separate artifacts (14-day retention).
- Builds mobile web assets with base path `/`, independently from the web build's `/wedding/` base path.
- Runs on relevant application/mobile changes to `main`, or manually through `workflow_dispatch`.
- Upload to the VPS is optional and uses the separate `VPS_TARGET_DIR`. It requires a verified SSH host key. An unsigned IPA is not ready for normal installation on an iPhone; signing and distribution are separate work.

## GitHub Actions configuration

Open **Repository → Settings → Secrets and variables → Actions**.

### Required secrets

| Name | Purpose |
|---|---|
| `VITE_PB_URL` | PocketBase API URL embedded during the frontend build |
| `VPS_HOST` | VPS hostname or IP address |
| `VPS_USERNAME` | SSH deployment account (currently expected to be `ubuntu`) |
| `VPS_SSH_KEY` | Private SSH key for that account |
| `VPS_SSH_KNOWN_HOSTS` | Verified SSH host-key line(s), not a private key |

### Optional secrets

| Name | Purpose |
|---|---|
| `VPS_PORT` | SSH port; defaults to `22` |
| `VPS_TARGET_DIR` | Absolute destination directory for optional APK/IPA copies only |

### Verified SSH host key

Do not trust a newly scanned host key without checking it. From a trusted VPS console/session, obtain the server's public host-key fingerprint (for example, `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`). Compare it with the fingerprint of the candidate host key, then save the verified known-hosts line(s) in `VPS_SSH_KNOWN_HOSTS`. For port 22 the known-hosts entry normally names the IP/host; for a nonstandard port it normally uses `[host]:port`.

### Enabling automatic production deployment

Keep `ENABLE_WEDDING_WEB_AUTO_DEPLOY` unset or set to `false` until the desired app/PWA changes are committed to `main` and a deliberate production deployment has been tested. After verification, create this repository **variable** with value `true` to enable automatic deployment on matching pushes to `main`.

## Rollback

Each successful web deployment keeps the previous frontend in a directory named like `/srv/www/.wedding-planner-backup-<commit>-<run-id>`. The deployment log and workflow summary identify the exact backup directory. If a release needs to be reverted, use a VPS shell to move the current `/srv/www/wedding-planner` directory aside and move the selected backup back into its place. Do not delete backups until the release is confirmed healthy.

Neither workflow reads or uploads `.env.production`; keep local environment files and PocketBase runtime data out of Git.
