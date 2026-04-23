#!/bin/bash
set -e

APP_DIR="/home/glow/seenlio/seenlio-fe"
SECRET_ROOT="/home/glow/seenlio"
cd "$APP_DIR"

# Symlink env + optional GCP key from central location (never commit these; repo stays clean)
ln -sf "$SECRET_ROOT/.env.fe" "$APP_DIR/.env"
# BigQuery: put the service account JSON on the server as $SECRET_ROOT/seenlio-259d77d92204.json (chmod 600).
# In .env.fe use: GOOGLE_APPLICATION_CREDENTIALS=./seenlio-259d77d92204.json
if [ -f "$SECRET_ROOT/seenlio-259d77d92204.json" ]; then
  ln -sf "$SECRET_ROOT/seenlio-259d77d92204.json" "$APP_DIR/seenlio-259d77d92204.json"
fi

echo "=== Seenlio Frontend (Next.js) Deploy ==="
echo "$(date '+%Y-%m-%d %H:%M:%S')"

# Pull latest
PREV_HEAD=$(git rev-parse HEAD)
git pull origin main
CURR_HEAD=$(git rev-parse HEAD)

if [ "$PREV_HEAD" = "$CURR_HEAD" ]; then
  echo "No changes detected. Skipping deploy."
  exit 0
fi

echo "Changed files:"
git diff --name-only "$PREV_HEAD" "$CURR_HEAD"
echo "---"

# Create logs directory
mkdir -p logs

# Install dependencies and rebuild
echo "→ Installing dependencies..."
npm install --production

echo "→ Building Next.js..."
npm run build

echo "→ Reloading PM2..."
pm2 reload ecosystem.config.js --update-env

echo ""
echo "=== Frontend Deploy Complete ==="
echo "$(date '+%Y-%m-%d %H:%M:%S')"
pm2 status
