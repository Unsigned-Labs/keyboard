package `in`.unsigned.keyboard.theme

import android.graphics.Color

/**
 * Color scheme for the keyboard UI, inspired by Material Design 3.
 * Provides comprehensive theming support for all keyboard components.
 */
data class KeyboardColorScheme(
    // Background colors
    val keyboardBackground: Int,
    val keyboardSeparator: Int,

    // Key colors
    val keyNormal: Int,
    val keyFunctional: Int,
    val keyAction: Int,

    // Pressed states
    val keyNormalPressed: Int,
    val keyFunctionalPressed: Int,
    val keyActionPressed: Int,

    // Text colors
    val textPrimary: Int,
    val textSecondary: Int,
    val textHint: Int,
    val textOnPressed: Int,
    val textOnAction: Int,

    // Accent colors
    val accentPrimary: Int,
    val accentSecondary: Int,

    // Shadow and border
    val shadow: Int,
    val border: Int
) {
    companion object {
        /**
         * Default light theme with clean, modern aesthetics
         */
        val DefaultLight = KeyboardColorScheme(
            keyboardBackground = Color.parseColor("#F2F4F7"), // Softer gray background
            keyboardSeparator = Color.TRANSPARENT,

            keyNormal = Color.parseColor("#FFFFFF"),
            keyFunctional = Color.parseColor("#E4E7EB"), // Slightly darker for contrast
            keyAction = Color.parseColor("#2196F3"), // Material Blue

            keyNormalPressed = Color.parseColor("#F5F7FA"),
            keyFunctionalPressed = Color.parseColor("#D0D5DD"),
            keyActionPressed = Color.parseColor("#1976D2"),

            textPrimary = Color.parseColor("#101828"), // Darker text for readability
            textSecondary = applyAlpha("#101828", 0.7f),
            textHint = applyAlpha("#101828", 0.5f),
            textOnPressed = Color.parseColor("#101828"),
            textOnAction = Color.parseColor("#FFFFFF"),

            accentPrimary = Color.parseColor("#2196F3"),
            accentSecondary = Color.parseColor("#64B5F6"),

            shadow = Color.parseColor("#1A000000"), // Soft shadow
            border = Color.TRANSPARENT
        )

        /**
         * Default dark theme with comfortable low-light colors
         */
        val DefaultDark = KeyboardColorScheme(
            keyboardBackground = Color.parseColor("#121212"), // Deep dark background
            keyboardSeparator = Color.TRANSPARENT,

            keyNormal = Color.parseColor("#2C2C2C"), // Dark gray keys
            keyFunctional = Color.parseColor("#1E1E1E"), // Darker functional keys
            keyAction = Color.parseColor("#4CAF50"), // Material Green for action

            keyNormalPressed = Color.parseColor("#383838"),
            keyFunctionalPressed = Color.parseColor("#252525"),
            keyActionPressed = Color.parseColor("#388E3C"),

            textPrimary = applyAlpha("#FFFFFF", 0.95f),
            textSecondary = applyAlpha("#FFFFFF", 0.7f),
            textHint = applyAlpha("#FFFFFF", 0.5f),
            textOnPressed = applyAlpha("#FFFFFF", 0.95f),
            textOnAction = Color.parseColor("#000000"),

            accentPrimary = Color.parseColor("#4CAF50"),
            accentSecondary = Color.parseColor("#81C784"),

            shadow = Color.parseColor("#40000000"), // Darker shadow
            border = Color.TRANSPARENT
        )

        /**
         * Helper function to apply alpha transparency to hex colors
         */
        private fun applyAlpha(hexColor: String, alpha: Float): Int {
            val color = Color.parseColor(hexColor)
            val alphaInt = (alpha * 255).toInt().coerceIn(0, 255)
            return Color.argb(
                alphaInt,
                Color.red(color),
                Color.green(color),
                Color.blue(color)
            )
        }
    }
}

/**
 * Available theme options
 */
enum class KeyboardTheme {
    DEFAULT_LIGHT,
    DEFAULT_DARK;

    fun getColorScheme(): KeyboardColorScheme {
        return when (this) {
            DEFAULT_LIGHT -> KeyboardColorScheme.DefaultLight
            DEFAULT_DARK -> KeyboardColorScheme.DefaultDark
        }
    }

    fun getDisplayName(): String {
        return when (this) {
            DEFAULT_LIGHT -> "Light"
            DEFAULT_DARK -> "Dark"
        }
    }
}
