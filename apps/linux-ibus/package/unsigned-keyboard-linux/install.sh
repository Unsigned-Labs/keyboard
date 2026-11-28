#!/bin/bash

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo ./install.sh"
    exit 1
fi

echo "Installing Unsigned Keyboard Input Method..."
echo ""

# Detect IBus directories
IBUS_COMPONENT_DIR="/usr/share/ibus/component"
IBUS_ENGINE_DIR="/usr/libexec"

# Check if directories exist, create if needed
mkdir -p "$IBUS_COMPONENT_DIR"
mkdir -p "$IBUS_ENGINE_DIR"

# Install Rust backend
echo "Installing engine backend..."
install -Dm755 target/release/ibus-engine-unsigned /usr/local/bin/ibus-engine-unsigned

# Install Python wrapper
echo "Installing IBus engine wrapper..."
install -Dm755 ibus-engine-unsigned.py "$IBUS_ENGINE_DIR/ibus-engine-unsigned.py"

# Install component XML
echo "Installing IBus component..."
sed "s|\${libexecdir}|$IBUS_ENGINE_DIR|g" unsigned.xml > /tmp/unsigned.xml
install -Dm644 /tmp/unsigned.xml "$IBUS_COMPONENT_DIR/unsigned.xml"
rm /tmp/unsigned.xml

# Restart IBus daemon
echo ""
echo "Restarting IBus daemon..."
if pgrep -x "ibus-daemon" > /dev/null; then
    pkill -f ibus-daemon || true
    sleep 1
fi

# Start IBus for the current user if not running
REAL_USER="${SUDO_USER:-$USER}"
if [ "$REAL_USER" != "root" ]; then
    su - "$REAL_USER" -c "export DISPLAY=:0 && ibus-daemon -drx" 2>/dev/null || true
fi

echo ""
echo "Installation completed successfully!"
echo ""
echo "To activate the input method:"
echo "  1. Open 'Settings' → 'Keyboard' → 'Input Sources'"
echo "  2. Click '+' to add input source"
echo "  3. Search for 'Assamese (Unsigned)' or 'Bangla (Unsigned)' or 'Hindi (Unsigned)'"
echo "  4. Add your preferred language(s)"
echo "  5. Use Super+Space (Windows+Space) to switch between input methods"
echo ""
echo "Or run: ibus-setup"
echo ""
echo "To uninstall, run: sudo ./uninstall.sh"
