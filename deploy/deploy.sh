#!/usr/bin/env bash
# Faqat toza origin/main deploy qilinadi: v1/ -> /opt/halvet-site/site -> health.
set -euo pipefail

HOST="${1:-dtwin}"
REMOTE_DIR="${REMOTE_DIR:-/opt/halvet-site}"
URL="${URL:-https://halvet.dtwin.uz}"

fail() { echo "deploy to'xtatildi: $*" >&2; exit 1; }
cd "$(dirname "$0")/.."

git fetch --quiet origin main
[ -z "$(git status --porcelain)" ] || fail "commit qilinmagan o'zgarish bor"
SHA="$(git rev-parse HEAD)"
[ "$SHA" = "$(git rev-parse origin/main)" ] || fail "faqat origin/main (HEAD $(git rev-parse --short HEAD))"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/site/img"
cp v1/index.html v1/styles.css v1/app.js v1/blueprints.js "$STAGE/site/"
cp v1/img/*.jpg "$STAGE/site/img/"
printf '%s\n' "$SHA" > "$STAGE/site/version.txt"
cp deploy/docker-compose.yml deploy/Caddyfile "$STAGE/"

tar -czf - -C "$STAGE" site docker-compose.yml Caddyfile \
  | ssh "$HOST" "set -e; mkdir -p '$REMOTE_DIR'; cd '$REMOTE_DIR'
rm -rf new; mkdir new
tar --no-same-owner -xzf - -C new
mv new/docker-compose.yml new/Caddyfile .
rm -rf site.prev; [ -d site ] && mv site site.prev
mv new/site site; rm -rf new
docker compose up -d --force-recreate --remove-orphans
echo '$SHA' > REVISION"

for _ in $(seq 1 20); do
  if curl -fsS "$URL/version.txt" 2>/dev/null | grep -q "$SHA"; then echo "deploy tayyor: $SHA -> $URL"; exit 0; fi
  sleep 3
done
fail "$URL/version.txt $SHA ni qaytarmadi (rollback: ssh $HOST 'cd $REMOTE_DIR && rm -rf site && mv site.prev site')"
