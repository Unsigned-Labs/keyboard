#!/bin/bash

set -e

echo "Building Unsigned Keyboard for Android..."
echo ""

# Build native libraries first
echo "Step 1: Building native libraries..."
cd ../../bindings/android
chmod +x build.sh
./build.sh
cd -

# Build APK
echo ""
echo "Step 2: Building Android APK..."
if [ ! -f "gradlew" ]; then
    echo "Gradle wrapper not found. Please run from Android Studio or install Gradle."
    exit 1
fi

chmod +x gradlew
./gradlew assembleRelease

echo ""
echo "Build completed successfully!"
echo "APK location: app/build/outputs/apk/release/app-release-unsigned.apk"
echo ""
echo "To sign the APK, run:"
echo "  ./gradlew assembleRelease"
echo "  # Then sign with your keystore"
echo ""
