#!/bin/bash

set -e

echo "Building Unsigned Keyboard Input Method..."
echo ""

# Build Rust core first
echo "Building Rust core..."
cd ../../core
cargo build --release
cd -

# Build IBus engine
echo "Building IBus engine..."
cargo build --release

echo ""
echo "Build completed successfully!"
echo ""
echo "Binary location: target/release/ibus-engine-unsigned"
echo "Python wrapper: ibus-engine-unsigned.py"
echo ""
echo "To install system-wide, run:"
echo "  sudo ./install.sh"
echo ""
