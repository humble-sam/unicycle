#!/bin/bash
# Deploy script for Unicycle on Hostinger
# This script sets up the necessary symlinks and files after git pull

set -e

echo "ðŸš€ Running deploy script at $(date)..." >> deploy.log

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Redirect all output to log file (simple append, no tee to avoid /dev/fd issues)
exec >> deploy.log 2>&1

# 0. Ensure git hooks are configured (Self-healing)
git config core.hooksPath .githooks
chmod +x .githooks/post-merge
echo "✅ Enforced git hooks configuration"


# 1. Create/update static assets symlink
# Remove any existing assets (whether it's a file, directory, or broken symlink)
rm -rf assets 2>/dev/null || true
if [ -d "dist/assets" ]; then
    ln -s dist/assets assets
    echo "✅ Created symlink: assets -> dist/assets"
else
    echo "⚠️  Warning: dist/assets not found. Run build first."
fi

# 2. Copy index.html from dist to root
if [ -f "dist/index.html" ]; then
    rm -f index.html
    cp dist/index.html index.html
    echo "✅ Copied dist/index.html to index.html"
else
    echo "⚠️  Warning: dist/index.html not found. Run build first."
fi

# 3. Handle Persistent Storage (Prevents data loss on re-deploy)
# We store uploads OUTSIDE the repo directory so git clean/reset won't delete them.
STORAGE_DIR="../storage/uploads"

# Create storage directory if it doesn't exist
if [ ! -d "$STORAGE_DIR" ]; then
    mkdir -p "$STORAGE_DIR/products" "$STORAGE_DIR/avatars"
    echo "✅ Created persistent storage at $STORAGE_DIR"
fi

# If 'uploads' exists as a real directory (not symlink), migrate data
if [ -d "uploads" ] && [ ! -L "uploads" ]; then
    echo "📦 Migrating existing uploads to persistent storage..."
    cp -r uploads/* "$STORAGE_DIR/" 2>/dev/null || true
    rm -rf uploads
    echo "✅ Migrated and removed local uploads folder"
fi

# Create symlink: uploads -> ../storage/uploads
if [ ! -L "uploads" ]; then
    ln -s "$STORAGE_DIR" uploads
    echo "✅ Created symlink: uploads -> $STORAGE_DIR"
else
    echo "✅ Uploads symlink already exists"
fi

# 4. Restart Passenger (touch restart file)
if [ -d "tmp" ]; then
    touch tmp/restart.txt
    echo "✅ Triggered Passenger restart"
else
    mkdir -p tmp
    touch tmp/restart.txt
    echo "✅ Created tmp directory and triggered Passenger restart"
fi

echo "🎉 Deploy complete!"
