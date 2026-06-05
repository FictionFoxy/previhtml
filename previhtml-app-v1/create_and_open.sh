#!/usr/bin/env bash
# create_and_open.sh
# Creates ~/code/previhtml/index.html from Termux clipboard (if available) or pasted stdin,
# then opens it with termux-open if available.

set -euo pipefail

DIR="$HOME/code/previhtml"
FILE="$DIR/index.html"

mkdir -p "$DIR"

if command -v termux-clipboard-get >/dev/null 2>&1; then
  echo "Reading clipboard into $FILE..."
  termux-clipboard-get > "$FILE"
else
  echo "termux-clipboard-get not found. Please paste HTML now, then press Ctrl-D when done."
  cat > "$FILE"
fi

if command -v termux-open >/dev/null 2>&1; then
  echo "Opening $FILE with termux-open..."
  termux-open "$FILE" || echo "termux-open failed to open the file"
else
  # Fallback: try xdg-open, then am (Android), otherwise print path
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$FILE" || echo "xdg-open failed"
  elif command -v am >/dev/null 2>&1; then
    # Try to open with Android activity manager
    am start -a android.intent.action.VIEW -d "file://$FILE" || echo "am failed to open"
  else
    echo "No known opener (termux-open/xdg-open/am) found. File created at: $FILE"
  fi
fi

echo "Done."
