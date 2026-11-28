#!/bin/bash

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo ./uninstall.sh"
    exit 1
fi

echo "Uninstalling Unsigned Keyboard Input Method..."

# Remove files
rm -f /usr/local/bin/ibus-engine-unsigned
rm -f /usr/libexec/ibus-engine-unsigned.py
rm -f /usr/share/ibus/component/unsigned.xml

# Restart IBus
echo ""
echo "Restarting IBus daemon..."
if pgrep -x "ibus-daemon" > /dev/null; then
    pkill -f ibus-daemon || true
    sleep 1
fi

REAL_USER="${SUDO_USER:-$USER}"
if [ "$REAL_USER" != "root" ]; then
    su - "$REAL_USER" -c "export DISPLAY=:0 && ibus-daemon -drx" 2>/dev/null || true
fi

echo ""
echo "Uninstallation completed successfully!"
echo "You may need to remove the input source from your system settings."
