package `in`.unsigned.keyboard.theme

/**
 * Visual style types for different categories of keys
 */
enum class KeyVisualStyle {
    /** Regular letter and number keys */
    NORMAL,

    /** Functional keys like shift, delete, language switch */
    FUNCTIONAL,

    /** Action keys like enter, search, go */
    ACTION,

    /** Spacebar with special styling */
    SPACEBAR
}

/**
 * Visual attributes that can be applied to a key
 */
data class KeyVisualAttributes(
    val style: KeyVisualStyle,
    val cornerRadius: Float = 12f,
    val showShadow: Boolean = true,
    val showBorder: Boolean = false
)
