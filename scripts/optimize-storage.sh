#!/bin/bash

# VVU Platform: Node Modules Storage Optimizer
# Description: Moves node_modules to ephemeral /tmp storage to reclaim persistent disk space.

PROJECT_ROOT="/home/divhanimajokweni/proofbridge-liner"
TEMP_STORAGE="/tmp/pb-liner-node-modules"

echo "🔍 Checking node_modules status..."

if [ -L "$PROJECT_ROOT/node_modules" ]; then
    echo "✅ node_modules is already a symbolic link. No action needed."
    exit 0
fi

mkdir -p "$TEMP_STORAGE"

if [ -d "$PROJECT_ROOT/node_modules" ]; then
    echo "📦 Moving existing node_modules to ephemeral storage ($TEMP_STORAGE)..."
    # Move contents to preserve existing dependencies
    cp -r "$PROJECT_ROOT/node_modules/." "$TEMP_STORAGE/"
    rm -rf "$PROJECT_ROOT/node_modules"
else
    echo "ℹ️ No node_modules found. Creating link to ephemeral storage..."
fi

# Create the symbolic link
ln -s "$TEMP_STORAGE" "$PROJECT_ROOT/node_modules"

echo "🚀 Success! Persistent disk space reclaimed. node_modules now lives in /tmp."