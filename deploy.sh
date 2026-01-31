#!/bin/bash
# Deploy script for Unicycle on Hostinger
# This script sets up the necessary symlinks and files after git pull

set -e

echo "🚀 Running deploy script..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Create/update static assets symlink
if [ -L "assets" ]; then
    rm assets
fi
if [ -d "dist/assets" ]; then
    ln -s dist/assets assets
    echo "✅ Created symlink: assets -> dist/assets"
else
    echo "⚠️  Warning: dist/assets not found. Run build first."
fi

# 2. Copy index.html from dist to root
if [ -f "dist/index.html" ]; then
    cp dist/index.html index.html
    echo "✅ Copied dist/index.html to index.html"
else
    echo "⚠️  Warning: dist/index.html not found. Run build first."
fi

# 3. Ensure uploads directories exist (CRITICAL: never delete these!)
# User-uploaded images are stored here and must persist across deployments
if [ ! -d "uploads" ]; then
    mkdir -p uploads/products uploads/avatars
    echo "✅ Created uploads directories"
else
    # Just ensure subdirectories exist, don't touch existing files
    mkdir -p uploads/products uploads/avatars
    echo "✅ Verified uploads directories exist ($(ls uploads/products 2>/dev/null | wc -l) product images)"
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
