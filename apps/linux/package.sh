#!/bin/bash

set -e

echo "Packaging Unsigned Keyboard for Linux..."
echo ""

# Package name and version
PACKAGE_NAME="unsigned-keyboard-linux"
VERSION="1.0.0"
PACKAGE_DIR="package/${PACKAGE_NAME}"

# Clean previous package
rm -rf package
mkdir -p "$PACKAGE_DIR"

# Copy binary
echo "Copying binary..."
cp target/release/ibus-engine-unsigned "$PACKAGE_DIR/"

# Copy Python wrapper
echo "Copying IBus engine wrapper..."
cp ibus-engine-unsigned.py "$PACKAGE_DIR/"

# Copy XML component
echo "Copying IBus component..."
cp unsigned.xml "$PACKAGE_DIR/"

# Copy installation scripts
echo "Copying installation scripts..."
cp install.sh "$PACKAGE_DIR/"
cp uninstall.sh "$PACKAGE_DIR/"

# Create README
echo "Creating README..."
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# Unsigned Keyboard - Linux Desktop IME

IBus-based input method engine for typing in Indian languages (Hindi, Assamese, Bengali).

## System Requirements

- **Supported Distributions**: Ubuntu 20.04+, Debian 11+, Fedora 35+, Pop!_OS 20.04+, Linux Mint 20+, and other Linux distributions with IBus support
- **Desktop Environments**: GNOME, KDE Plasma, XFCE, MATE, Cinnamon
- **Dependencies**:
  - IBus (usually pre-installed)
  - Python 3.6+
  - python3-gi (GObject introspection)

## Installation

### Install Dependencies

**Ubuntu/Debian/Pop!_OS/Linux Mint:**
```bash
sudo apt install -y ibus python3-gi
```

**Fedora:**
```bash
sudo dnf install -y ibus python3-gobject
```

**Arch Linux:**
```bash
sudo pacman -S ibus python-gobject
```

### Install Unsigned Keyboard

```bash
chmod +x install.sh
sudo ./install.sh
```

### Activate Input Method

After installation:

1. Open **Settings** → **Keyboard** → **Input Sources** (or **Region & Language**)
2. Click the **+** button to add an input source
3. Search for **"Assamese (Unsigned)"**, **"Bangla (Unsigned)"**, or **"Hindi (Unsigned)"**
4. Add your preferred language(s)
5. Use **Super+Space** (Windows+Space) to switch between input methods

**Alternative**: Run `ibus-setup` from terminal to configure.

### Usage

1. Switch to Unsigned Keyboard using **Super+Space**
2. Type in English - text will be transliterated in real-time
3. Press **Space** to confirm and insert the transliterated text
4. Use backticks (\`) around English words to keep them in English

## Uninstallation

```bash
sudo ./uninstall.sh
```

## Supported Languages

- **Hindi (हिंदी)**
- **Assamese (অসমীয়া)**
- **Bangla (বাংলা)**

## License

MIT License - Copyright (c) Unsigned Labs
EOF

# Make scripts executable
chmod +x "$PACKAGE_DIR/install.sh"
chmod +x "$PACKAGE_DIR/uninstall.sh"
chmod +x "$PACKAGE_DIR/ibus-engine-unsigned.py"

# Create tarball
echo ""
echo "Creating archive..."
cd package
tar -czf "${PACKAGE_NAME}-${VERSION}.tar.gz" "$PACKAGE_NAME"
cd ..

echo ""
echo "Package created successfully!"
echo "Location: package/${PACKAGE_NAME}-${VERSION}.tar.gz"
echo "Size: $(du -h package/${PACKAGE_NAME}-${VERSION}.tar.gz | cut -f1)"
echo ""
