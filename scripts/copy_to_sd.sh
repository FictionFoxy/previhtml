#!/bin/bash
# Copy project to Android SD card Downloads folder

# Default SD card Downloads path (adjust if needed)
SD_PATH="${SD_PATH:-/sdcard/Download/previhtml-app}"

echo "=== Copy to SD Card ==="
echo "Source: $(pwd)"
echo "Destination: $SD_PATH"
echo ""

# Create destination if it doesn't exist
mkdir -p "$SD_PATH"

# Copy all files except node_modules, .git, and build artifacts
rsync -av --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.yarn/cache' \
  --exclude '.yarn/install-state.gz' \
  ./ "$SD_PATH/"

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Project copied successfully to $SD_PATH"
else
  echo ""
  echo "✗ Copy failed. Check permissions and path."
  exit 1
fi
