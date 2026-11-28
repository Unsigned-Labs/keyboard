package `in`.unsigned.keyboard.packs

import `in`.unsigned.keyboard.layout.Key
import `in`.unsigned.keyboard.layout.KeyAction
import `in`.unsigned.keyboard.layout.KeyRow
import `in`.unsigned.keyboard.layout.KeyboardLayout
import `in`.unsigned.keyboard.layout.LayoutInput
import `in`.unsigned.keyboard.layout.LayoutPage

internal fun hasTypingResources(method: InputMethodInfo, kinds: Map<String, String>): Boolean =
    kinds[method.layoutId] == "keyboard_layout" &&
        (method.transliterationId == null || kinds[method.transliterationId] == "transliteration")

internal fun withTypingFallback(methods: List<InputMethodInfo>): List<InputMethodInfo> =
    methods.ifEmpty { listOf(BasicEnglish.method) }

/** No factory pack (or native engine resources) is needed to type with this keyboard. */
internal object BasicEnglish {
    // A colon is intentionally outside the pack identifier alphabet.
    const val LAYOUT_ID = "fallback:layout"
    val method = InputMethodInfo("fallback:english", "English", "EN", LAYOUT_ID, null, "en", fallback = true)
    val layout by lazy {
        fun letters(row: String) = row.map { Key(label = it.toString(), output = it.toString()) }
        KeyboardLayout(
            id = LAYOUT_ID,
            name = "Basic English",
            input = LayoutInput.LATIN,
            consonants = emptySet(),
            pages = listOf(LayoutPage("letters", listOf(
                KeyRow(letters("qwertyuiop")),
                KeyRow(letters("asdfghjkl"), offset = 0.5f),
                KeyRow(listOf(Key("⇧", action = KeyAction.SHIFT, width = 1.5f)) +
                    letters("zxcvbnm") + Key("⌫", action = KeyAction.DELETE, width = 1.5f)),
                KeyRow(listOf(
                    Key("?123", action = KeyAction.SYMBOLS, width = 1.5f),
                    Key(",", output = ","),
                    Key("", action = KeyAction.SPACE, width = 5f),
                    Key(".", output = "."),
                    Key("↵", action = KeyAction.ENTER, width = 1.5f)
                ))
            )))
        )
    }
}
