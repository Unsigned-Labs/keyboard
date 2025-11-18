# Add project specific ProGuard rules here.

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Transliterator class
-keep class in.unsigned.keyboard.Transliterator {
    public static <methods>;
    native <methods>;
}

# Keep InputMethodService
-keep class * extends android.inputmethodservice.InputMethodService {
    <init>(...);
}
