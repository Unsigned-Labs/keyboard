package `in`.unsigned.keyboard.layout

import `in`.unsigned.keyboard.theme.KeyVisualStyle

data class KeyboardLayout(
    val rows: List<KeyRow>
)

data class KeyRow(
    val keys: List<KeySpec>,
    val heightMultiplier: Float = 1.0f,
    val horizontalPadding: Float = 0.0f
)

sealed class KeySpec {
    abstract val width: KeyWidth
    abstract val style: KeyVisualStyle

    data class Character(
        val char: String,
        val shiftedChar: String = char.uppercase(),
        override val width: KeyWidth = KeyWidth.Regular,
        override val style: KeyVisualStyle = KeyVisualStyle.NORMAL
    ) : KeySpec()

    data class Functional(
        val keyCode: Int,
        val label: String,
        val icon: String? = null,
        override val width: KeyWidth = KeyWidth.Functional,
        override val style: KeyVisualStyle = KeyVisualStyle.FUNCTIONAL
    ) : KeySpec()

    data class Action(
        val keyCode: Int,
        val label: String,
        override val width: KeyWidth = KeyWidth.FunctionalWide,
        override val style: KeyVisualStyle = KeyVisualStyle.ACTION
    ) : KeySpec()

    data class Space(
        val keyCode: Int = 32,
        val label: String = "",
        override val width: KeyWidth = KeyWidth.Grow,
        override val style: KeyVisualStyle = KeyVisualStyle.SPACEBAR
    ) : KeySpec()
}

enum class KeyWidth {
    Regular,
    Functional,
    FunctionalWide,
    Grow
}

object KeyCode {
    const val DELETE = -5
    const val SHIFT = -1
    const val SPACE = 32
    const val ENTER = 10
    const val MODE_CHANGE = -2
    const val LANG_SWITCH = -10
}

object KeyboardLayouts {

    fun getLettersLayout(): KeyboardLayout {
        return KeyboardLayout(
            rows = listOf(
                KeyRow(
                    keys = "qwertyuiop".map {
                        KeySpec.Character(it.toString())
                    }
                ),
                KeyRow(
                    horizontalPadding = 0.05f,
                    keys = "asdfghjkl".map {
                        KeySpec.Character(it.toString())
                    }
                ),
                KeyRow(
                    horizontalPadding = 0.15f, // Standard offset for Z row
                    keys = listOf(
                        KeySpec.Functional(
                            keyCode = KeyCode.SHIFT,
                            label = "⇧",
                            width = KeyWidth.Functional
                        )
                    ) + "zxcvbnm".map {
                        KeySpec.Character(it.toString())
                    } + listOf(
                        KeySpec.Functional(
                            keyCode = KeyCode.DELETE,
                            label = "⌫",
                            width = KeyWidth.Functional
                        )
                    )
                ),
                KeyRow(
                    keys = listOf(
                        KeySpec.Functional(
                            keyCode = KeyCode.MODE_CHANGE,
                            label = "123",
                            width = KeyWidth.Functional
                        ),
                        KeySpec.Functional(
                            keyCode = KeyCode.LANG_SWITCH,
                            label = "🌐",
                            width = KeyWidth.Functional
                        ),
                        KeySpec.Character(","),
                        KeySpec.Space(),
                        KeySpec.Character("."),
                        KeySpec.Action(
                            keyCode = KeyCode.ENTER,
                            label = "↵"
                        )
                    )
                )
            )
        )
    }

    fun getNumbersLayout(): KeyboardLayout {
        return KeyboardLayout(
            rows = listOf(
                KeyRow(
                    keys = "1234567890".map {
                        KeySpec.Character(it.toString())
                    }
                ),
                KeyRow(
                    keys = "@#$%&-+()".map {
                        KeySpec.Character(it.toString())
                    } + listOf(
                        KeySpec.Functional(
                            keyCode = KeyCode.DELETE,
                            label = "⌫"
                        )
                    )
                ),
                KeyRow(
                    keys = listOf(
                        KeySpec.Functional(
                            keyCode = KeyCode.MODE_CHANGE,
                            label = "=\\<",
                            width = KeyWidth.Functional
                        )
                    ) + "*/\"':;!?".map {
                        KeySpec.Character(it.toString())
                    }
                ),
                KeyRow(
                    keys = listOf(
                        KeySpec.Functional(
                            keyCode = KeyCode.MODE_CHANGE,
                            label = "ABC",
                            width = KeyWidth.Functional
                        ),
                        KeySpec.Functional(
                            keyCode = KeyCode.LANG_SWITCH,
                            label = "🌐",
                            width = KeyWidth.Functional
                        ),
                        KeySpec.Character(","),
                        KeySpec.Space(),
                        KeySpec.Character("."),
                        KeySpec.Action(
                            keyCode = KeyCode.ENTER,
                            label = "↵"
                        )
                    )
                )
            )
        )
    }

    fun getSymbolsLayout(): KeyboardLayout {
        return KeyboardLayout(
            rows = listOf(
                KeyRow(
                    keys = "[]{}#%^*+=".map {
                        KeySpec.Character(it.toString())
                    }
                ),
                KeyRow(
                    keys = "_\\|~<>€£¥".map {
                        KeySpec.Character(it.toString())
                    } + listOf(
                        KeySpec.Functional(
                            keyCode = KeyCode.DELETE,
                            label = "⌫"
                        )
                    )
                ),
                KeyRow(
                    keys = listOf(
                        KeySpec.Functional(
                            keyCode = KeyCode.MODE_CHANGE,
                            label = "123",
                            width = KeyWidth.Functional
                        )
                    ) + ".,?!'\"`.•".map {
                        KeySpec.Character(it.toString())
                    }
                ),
                KeyRow(
                    keys = listOf(
                        KeySpec.Functional(
                            keyCode = KeyCode.MODE_CHANGE,
                            label = "ABC",
                            width = KeyWidth.Functional
                        ),
                        KeySpec.Functional(
                            keyCode = KeyCode.LANG_SWITCH,
                            label = "🌐",
                            width = KeyWidth.Functional
                        ),
                        KeySpec.Character(","),
                        KeySpec.Space(),
                        KeySpec.Character("."),
                        KeySpec.Action(
                            keyCode = KeyCode.ENTER,
                            label = "↵"
                        )
                    )
                )
            )
        )
    }
}
