# Add project specific ProGuard rules here.

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep the JNI engine class
-keep class in.unsigned.keyboard.Engine {
    public static <methods>;
    native <methods>;
}

# Keep InputMethodService
-keep class * extends android.inputmethodservice.InputMethodService {
    <init>(...);
}
