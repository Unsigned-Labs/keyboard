package `in`.unsigned.keyboard.layout

import `in`.unsigned.keyboard.packs.str
import `in`.unsigned.keyboard.theme.KeyVisualStyle
import org.json.JSONArray
import org.json.JSONObject

enum class KeyAction { SHIFT, DELETE, ENTER, SPACE, PAGE, SYMBOLS, NEXT_INPUT_METHOD }

enum class LayoutInput { LATIN, DIRECT }

data class Key(
    val label: String,
    val output: String? = null,
    val shiftLabel: String? = null,
    val shiftOutput: String? = null,
    /** Typed instead of [output] right after a consonant (a vowel sign instead of a vowel). */
    val afterConsonant: String? = null,
    val longPress: List<String> = emptyList(),
    val width: Float = 1f,
    val action: KeyAction? = null,
    val target: String? = null
) {
    val style: KeyVisualStyle
        get() = when (action) {
            null -> KeyVisualStyle.NORMAL
            KeyAction.SPACE -> KeyVisualStyle.SPACEBAR
            KeyAction.ENTER -> KeyVisualStyle.ACTION
            else -> KeyVisualStyle.FUNCTIONAL
        }

    /** Text typed for this key, or null for action keys. */
    fun outputFor(shifted: Boolean): String? = when {
        output == null -> null
        shifted -> shiftOutput ?: output.uppercase()
        else -> output
    }

    fun labelFor(shifted: Boolean): String = when {
        action != null -> label
        shifted -> shiftLabel ?: label.uppercase()
        else -> label
    }
}

data class KeyRow(val keys: List<Key>, val offset: Float = 0f) {
    val units: Float get() = offset + keys.sumOf { it.width.toDouble() }.toFloat()
}

data class LayoutPage(val id: String, val rows: List<KeyRow>)

data class KeyboardLayout(
    val id: String,
    val name: String,
    val input: LayoutInput,
    val consonants: Set<String>,
    val pages: List<LayoutPage>
) {
    fun page(id: String?): LayoutPage = pages.firstOrNull { it.id == id } ?: pages.first()

    val maxRows: Int get() = pages.maxOf { it.rows.size }

    companion object {
        /** Builds a layout from a keyboard_layout pack already validated by the engine. */
        fun fromPackJson(id: String, pack: JSONObject): KeyboardLayout {
            val layout = pack.getJSONObject("layout")
            val consonants = layout.optJSONObject("composition")?.optJSONArray("consonants")
            return KeyboardLayout(
                id = id,
                name = layout.getString("name"),
                input = if (layout.getString("input") == "direct") LayoutInput.DIRECT else LayoutInput.LATIN,
                consonants = consonants.strings().toSet(),
                pages = layout.getJSONArray("pages").objects().map { page ->
                    LayoutPage(
                        id = page.getString("id"),
                        rows = page.getJSONArray("rows").objects().map { row ->
                            KeyRow(
                                offset = row.optDouble("offset", 0.0).toFloat(),
                                keys = row.getJSONArray("keys").objects().map(::parseKey)
                            )
                        }
                    )
                }
            )
        }

        private fun parseKey(k: JSONObject): Key {
            val output = k.str("output")
            val shift = k.optJSONObject("shift")
            return Key(
                label = k.str("label") ?: output ?: "",
                output = output,
                shiftLabel = shift?.str("label"),
                shiftOutput = shift?.str("output"),
                afterConsonant = k.str("after_consonant"),
                longPress = k.optJSONArray("long_press").strings(),
                width = k.optDouble("width", 1.0).toFloat(),
                action = k.str("action")?.let { KeyAction.valueOf(it.uppercase()) },
                target = k.str("target")
            )
        }

        private fun JSONArray.objects() = (0 until length()).map { getJSONObject(it) }
        private fun JSONArray?.strings() = if (this == null) emptyList() else (0 until length()).map { getString(it) }
    }
}

/** Numbers and symbols pages shared by every layout. */
object SymbolPages {
    private fun chars(s: String) = s.map { Key(label = it.toString(), output = it.toString()) }

    private fun bottomRow(toggleLabel: String) = KeyRow(
        listOf(
            Key(label = toggleLabel, action = KeyAction.SYMBOLS, width = 1.5f),
            Key(label = "🌐", action = KeyAction.NEXT_INPUT_METHOD),
            Key(label = ",", output = ","),
            Key(label = "", action = KeyAction.SPACE, width = 4f),
            Key(label = ".", output = "."),
            Key(label = "↵", action = KeyAction.ENTER, width = 1.5f)
        )
    )

    val layout = KeyboardLayout(
        id = "symbols",
        name = "Symbols",
        input = LayoutInput.LATIN,
        consonants = emptySet(),
        pages = listOf(
            LayoutPage(
                "numbers",
                listOf(
                    KeyRow(chars("1234567890")),
                    KeyRow(chars("@#\$%&-+()")),
                    KeyRow(
                        listOf(Key(label = "=\\<", action = KeyAction.PAGE, target = "symbols", width = 1.5f)) +
                            chars("*\"':;!?") +
                            listOf(Key(label = "⌫", action = KeyAction.DELETE, width = 1.5f))
                    ),
                    bottomRow("ABC")
                )
            ),
            LayoutPage(
                "symbols",
                listOf(
                    KeyRow(chars("[]{}#%^*+=")),
                    KeyRow(chars("_\\|~<>€£¥₹")),
                    KeyRow(
                        listOf(Key(label = "?123", action = KeyAction.PAGE, target = "numbers", width = 1.5f)) +
                            chars(".,?!'\"`") +
                            listOf(Key(label = "⌫", action = KeyAction.DELETE, width = 1.5f))
                    ),
                    bottomRow("ABC")
                )
            )
        )
    )
}
