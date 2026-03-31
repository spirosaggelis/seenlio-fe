#!/bin/bash
set -e

APP_DIR="/home/glow/seenlio/seenlio-fe"
cd "$APP_DIR"

# Symlink env file from central location
ln -sf /home/glow/seenlio/.env.fe "$APP_DIR/.env"

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
