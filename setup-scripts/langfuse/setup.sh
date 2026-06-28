#!/usr/bin/env bash
# Self-host Langfuse for Mach2 and write mach2-config.env at repo root.
set -euo pipefail

LANGFUSE_HOST="${LANGFUSE_HOST:-http://localhost:3000}"
ORG_ID="${ORG_ID:-mach2}"
ORG_NAME="${ORG_NAME:-Mach2}"
PROJECT_ID="${PROJECT_ID:-mach2-dev}"
PROJECT_NAME="${PROJECT_NAME:-mach2-dev}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@mach2.local}"
ADMIN_NAME="${ADMIN_NAME:-Mach2 Admin}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RUNTIME_DIR="$SCRIPT_DIR/runtime"
CONFIG_OUT="$REPO_ROOT/mach2-config.env"
ENV_FILE="$SCRIPT_DIR/.env.langfuse"

hex() { openssl rand -hex "${1:-32}"; }
lf_key() { echo "pk-lf-$(openssl rand -hex 16)"; }
sk_key() { echo "sk-lf-$(openssl rand -hex 16)"; }

echo "==> Mach2 Langfuse setup"
echo "    Repo root: $REPO_ROOT"

command -v docker >/dev/null || { echo "Docker required"; exit 1; }
docker info >/dev/null || { echo "Docker daemon not running"; exit 1; }

if [[ -f "$ENV_FILE" ]]; then
  echo "==> Reusing existing $ENV_FILE"
  set -a; source "$ENV_FILE"; set +a
else
  echo "==> Generating secrets..."
  NEXTAUTH_SECRET="$(hex 32)"
  SALT="$(hex 16)"
  ENCRYPTION_KEY="$(hex 32)"
  POSTGRES_PASSWORD="$(hex 16)"
  CLICKHOUSE_PASSWORD="$(hex 16)"
  REDIS_AUTH="$(hex 16)"
  MINIO_ROOT_PASSWORD="$(hex 16)"
  MINIO_SECRET="$MINIO_ROOT_PASSWORD"
  LANGFUSE_INIT_USER_PASSWORD="$(hex 12)"
  LANGFUSE_INIT_PROJECT_PUBLIC_KEY="$(lf_key)"
  LANGFUSE_INIT_PROJECT_SECRET_KEY="$(sk_key)"

  cat > "$ENV_FILE" <<EOF
NEXTAUTH_URL=$LANGFUSE_HOST
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
SALT=$SALT
ENCRYPTION_KEY=$ENCRYPTION_KEY
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
CLICKHOUSE_PASSWORD=$CLICKHOUSE_PASSWORD
REDIS_AUTH=$REDIS_AUTH
MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD
LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY=$MINIO_SECRET
LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY=$MINIO_SECRET
LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY=$MINIO_SECRET
TELEMETRY_ENABLED=false
LANGFUSE_INIT_ORG_ID=$ORG_ID
LANGFUSE_INIT_ORG_NAME=$ORG_NAME
LANGFUSE_INIT_PROJECT_ID=$PROJECT_ID
LANGFUSE_INIT_PROJECT_NAME=$PROJECT_NAME
LANGFUSE_INIT_PROJECT_PUBLIC_KEY=$LANGFUSE_INIT_PROJECT_PUBLIC_KEY
LANGFUSE_INIT_PROJECT_SECRET_KEY=$LANGFUSE_INIT_PROJECT_SECRET_KEY
LANGFUSE_INIT_USER_EMAIL=$ADMIN_EMAIL
LANGFUSE_INIT_USER_NAME=$ADMIN_NAME
LANGFUSE_INIT_USER_PASSWORD=$LANGFUSE_INIT_USER_PASSWORD
EOF
  echo "==> Wrote $ENV_FILE"
fi

if [[ ! -f "$RUNTIME_DIR/docker-compose.yml" ]]; then
  echo "==> Cloning langfuse/langfuse..."
  git clone --depth 1 https://github.com/langfuse/langfuse.git "$RUNTIME_DIR"
else
  echo "==> Using existing runtime/"
fi

echo "==> Starting Langfuse..."
docker compose --env-file "$ENV_FILE" -f "$RUNTIME_DIR/docker-compose.yml" up -d

echo "==> Waiting for health..."
for i in $(seq 1 60); do
  if curl -sf "$LANGFUSE_HOST/api/public/health" >/dev/null 2>&1; then
    echo "    Ready."
    break
  fi
  sleep 5
  echo "    ... still starting ($i/60)"
done

set -a; source "$ENV_FILE"; set +a
GENERATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

cat > "$CONFIG_OUT" <<EOF
# Mach2 — generated configuration (DO NOT COMMIT)
# Generated: $GENERATED_AT
# Generator: setup-scripts/langfuse/setup.sh

LANGFUSE_HOST=$LANGFUSE_HOST
LANGFUSE_PUBLIC_KEY=$LANGFUSE_INIT_PROJECT_PUBLIC_KEY
LANGFUSE_SECRET_KEY=$LANGFUSE_INIT_PROJECT_SECRET_KEY
LANGFUSE_PROJECT=$PROJECT_NAME
LANGFUSE_ORG_ID=$ORG_ID
LANGFUSE_PROJECT_ID=$PROJECT_ID
OBSERVABILITY=langfuse

LANGFUSE_UI_URL=$LANGFUSE_HOST
LANGFUSE_UI_EMAIL=$LANGFUSE_INIT_USER_EMAIL
LANGFUSE_UI_PASSWORD=$LANGFUSE_INIT_USER_PASSWORD

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:latest
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_PERSIST_DIR=./data/chroma
CHROMA_COLLECTION=mach2_shared

MACH2_HOST=0.0.0.0
MACH2_PORT=8000
MACH2_RELOAD=true
MACH2_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MACH2_DEBUG=false

MACH2_MAX_REACT_STEPS=10
MACH2_SCOUT_MAX_CONCURRENT=3
MACH2_CRITIQUE_MAX_ROUNDS=3

ENV=development
LOG_LEVEL=INFO
EOF

echo ""
echo "==> Done!"
echo "    Config: $CONFIG_OUT"
echo "    UI:     $LANGFUSE_HOST"
echo "    Email:  $LANGFUSE_INIT_USER_EMAIL"
echo "    Pass:   $LANGFUSE_INIT_USER_PASSWORD"
