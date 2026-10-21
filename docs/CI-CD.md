# Wedding Planner CI/CD

## Pipelines

### Web: `deploy-web-vps.yml`

- **Target Workflow**:
  - `Local → GitHub Push → CI/Test/Build → Automatic Deploy VPS → Production Health Check`
- **Triggers**:
  - **Push to `main`**: Runs all CI validations (lint, build, asset verification) and automatically deploys to the VPS when application files change.
  - **Pull Request to `main`**: Runs CI validations (ESLint, build `--base=/wedding/`, asset verification) and uploads a 14-day artifact. Production deployment is cleanly skipped.
  - **Manual `workflow_dispatch`**: Runs CI validations with manual control. Deploys to VPS by default (`deploy_production: true`).
- **Secret Validation**:
  - Strictly requires `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`, and `VPS_SSH_KNOWN_HOSTS`.
  - If deployment was requested but any required secret is missing, the workflow fails with exit code `1` (red status) and logs an actionable error message. It never produces a false-positive success.
  - SSH port can be specified via `VPS_SSH_PORT` or `VPS_PORT` (defaults to `22`).
- **Staged VPS Deployment & Safe Swap**:
  - Uploads release archive to SSH home directory on VPS (`43.156.236.102`).
  - Staging area: `/srv/www/.wedding-planner-staging-<sha>-<run_id>`.
  - Validates staging integrity (`index.html`, `manifest.webmanifest`, `sw.js`, and hashed bundles in `/wedding/assets/`).
  - Staged swap: moves current live (`/srv/www/wedding-planner`) to backup (`/srv/www/.wedding-planner-backup-<sha>-<run_id>`) and moves staging to live. If stage activation fails, the backup is restored immediately.
  - Archive cleanup is non-fatal: archive removal issues never block the deployment or skip health checks.
  - Rollback backup is strictly preserved throughout the health check process.
- **Dual Health Check & Automatic Rollback**:
  - Strict TLS verification is enforced on all curl requests (no `-k` / `--insecure`). The VPS serves a valid public Let's Encrypt certificate for `43.156.236.102`.
  - Health check 1 (Frontend): Requests `https://<VPS_HOST>/wedding/` and verifies HTTP 200, valid `<title>`, and `<div id="root">`.
  - Health check 2 (PocketBase API): Requests `https://<VPS_HOST>/wedding-api/health` and verifies HTTP 200 with JSON payload `{"code":200,"message":"API is healthy."}`.
  - If either health check fails within 30 seconds, an automated rollback script restores the previous backup to `/srv/www/wedding-planner`, captures the faulty build snapshot to `.wedding-planner-failed-<sha>-<run_id>`, and halts the pipeline with an error (red status).
  - Only after all health checks succeed are older backups pruned (retaining the 5 most recent while always preserving the active release backup).

### Mobile: `build-and-sync-vps.yml`

- Builds Android debug APK and an **unsigned** iOS IPA as separate artifacts (14-day retention).
- Builds mobile web assets with base path `/`, independently from the web build's `/wedding/` base path.
- Runs on relevant application/mobile changes to `main`, or manually through `workflow_dispatch`.
- Upload to the VPS is optional and uses the separate `VPS_TARGET_DIR`. It requires a verified SSH host key. An unsigned IPA is not ready for normal installation on an iPhone; signing and distribution are separate work.

## GitHub Actions Configuration

Open **Repository → Settings → Secrets and variables → Actions**.

### Required Secrets

| Name | Purpose | Example / Notes |
|---|---|---|
| `VITE_PB_URL` | PocketBase API URL embedded in Vite frontend | `https://43.156.236.102` |
| `VPS_HOST` | VPS IP address or hostname | `43.156.236.102` |
| `VPS_USERNAME` | SSH user | `ubuntu` |
| `VPS_SSH_KEY` | Private SSH key | Contents of `~/.ssh/wedding_planner_deploy` |
| `VPS_SSH_KNOWN_HOSTS` | Strict host key line | `43.156.236.102 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPLV8FZsqrUwsNv4dydkY/O6XSpH5a/dMxCg0yHZHRkl` |

### Optional Secrets

| Type | Name | Purpose |
|---|---|---|
| Secret | `VPS_SSH_PORT` or `VPS_PORT` | SSH port (defaults to `22` if not set) |
| Secret | `VPS_TARGET_DIR` | Absolute destination path for optional mobile APK/IPA upload |

## Rollback Procedures

### 1. Automatic Rollback
If the live health check fails during the CI/CD pipeline, the runner immediately calls an SSH rollback script to restore `/srv/www/.wedding-planner-backup-<sha>-<run_id>` back to `/srv/www/wedding-planner`.

### 2. Manual Rollback
If an issue is noticed after a successful deployment, SSH into the VPS and swap the previous backup:
```bash
# List available backups
ls -ld /srv/www/.wedding-planner-backup-*

# Restore previous release
mv /srv/www/wedding-planner /srv/www/wedding-planner-corrupt
mv /srv/www/.wedding-planner-backup-<RELEASE_ID> /srv/www/wedding-planner
```
PocketBase data (`pb_data`), SQLite databases, uploaded user files, and Caddy configuration are completely untouched by the frontend deployment.
