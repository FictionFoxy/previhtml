#!/bin/bash
# Create a symlink from SD card to project directory

PROJECT_DIR="$(pwd)"
SYMLINK_PATH="/sdcard/Download/previhtml-app-link"

echo "=== Create Symlink ==="
echo "Target: $PROJECT_DIR"
echo "Symlink: $SYMLINK_PATH"
echo ""

# Remove existing symlink if it exists
if [ -L "$SYMLINK_PATH" ]; then
  echo "Removing existing symlink..."
  rm "$SYMLINK_PATH"
fi

# Create symlink
ln -s "$PROJECT_DIR" "$SYMLINK_PATH"

if [ $? -eq 0 ]; then
  echo "✓ Symlink created successfully"
  echo "Access via: $SYMLINK_PATH"
else
  echo "✗ Failed to create symlink"
  echo "Note: Symlinks may not work on all Android filesystems (FAT32/exFAT)"
  echo "Consider using the copy_to_sd.sh script instead"
  exit 1
fi
