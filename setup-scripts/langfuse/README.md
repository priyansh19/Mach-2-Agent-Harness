# Langfuse setup for Mach2

Self-hosted Langfuse via Docker Compose. Generates credentials and writes **`mach2-config.env`** at the repo root.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- Git
- PowerShell 5.1+ (Windows) or Bash (Linux/macOS)

## Run (Windows)

```powershell
cd setup-scripts\langfuse
.\setup.ps1
```

## Run (macOS / Linux)

```bash
cd setup-scripts/langfuse
chmod +x setup.sh
./setup.sh
```

## What it does

1. Clones [langfuse/langfuse](https://github.com/langfuse/langfuse) into `setup-scripts/langfuse/runtime/` (once)
2. Generates secrets (NEXTAUTH, SALT, ENCRYPTION_KEY, MinIO, Redis, Postgres, ClickHouse)
3. Headless-init: org `mach2`, project `mach2-dev`, admin user, API keys
4. Starts `docker compose up -d`
5. Waits for `http://localhost:3000/api/public/health`
6. Writes **`../../mach2-config.env`** with every value Mach2 needs

## After setup

- UI: http://localhost:3000
- Login: see `LANGFUSE_INIT_USER_EMAIL` / `LANGFUSE_INIT_USER_PASSWORD` in `mach2-config.env`
- Copy observability vars into `.env` or symlink:

```powershell
Copy-Item ..\..\mach2-config.env .env -Force   # from repo root, merge manually if .env exists
```

## Stop / reset

```powershell
cd setup-scripts\langfuse\runtime
docker compose down
```

Full reset (deletes trace data):

```powershell
docker compose down -v
Remove-Item ..\..\mach2-config.env
.\setup.ps1
```
