#!/bin/bash

set -e

echo "Building Android JNI bindings..."
echo ""

# Check if cargo-ndk is installed
if ! command -v cargo-ndk &> /dev/null; then
    echo "cargo-ndk is not installed. Installing..."
    cargo install cargo-ndk
fi

# Check if Android NDK is set up
if [ -z "$ANDROID_NDK_HOME" ] && [ -z "$NDK_HOME" ]; then
    echo "Error: Android NDK not found."
    echo "Please set ANDROID_NDK_HOME or NDK_HOME environment variable"
    echo ""
    echo "Example:"
    echo "  export ANDROID_NDK_HOME=~/Android/Sdk/ndk/26.1.10909125"
    exit 1
fi

NDK_PATH="${ANDROID_NDK_HOME:-$NDK_HOME}"
echo "Using NDK: $NDK_PATH"
echo ""

# Add Android targets if not already added
echo "Adding Android targets..."
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android || true

# Build for all Android architectures
echo ""
echo "Building for ARM64..."
cargo ndk -t arm64-v8a -o ../../apps/android/app/src/main/jniLibs build --release

echo "Building for ARMv7..."
cargo ndk -t armeabi-v7a -o ../../apps/android/app/src/main/jniLibs build --release

echo "Building for x86_64..."
cargo ndk -t x86_64 -o ../../apps/android/app/src/main/jniLibs build --release

echo ""
echo "Build completed successfully!"
echo "Native libraries location: ../../apps/android/app/src/main/jniLibs/"
echo ""
ls -lh ../../apps/android/app/src/main/jniLibs/*/libtransliterator.so
echo ""
