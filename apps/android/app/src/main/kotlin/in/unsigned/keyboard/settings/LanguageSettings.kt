package `in`.unsigned.keyboard.settings

import `in`.unsigned.keyboard.packs.InputMethodInfo

object LanguageSettings {
    const val PREF_CURRENT = "input_method"
    const val PREF_ENABLED = "enabled_input_methods"
    const val PREF_LEGACY_LANGUAGE = "language"

    fun enabled(methods: List<InputMethodInfo>, saved: Set<String>?): List<InputMethodInfo> =
        if (saved == null) methods else methods.filter { it.id in saved }.ifEmpty { methods }

    /** Keep selections for absent or temporarily unusable resources. */
    fun updateEnabled(saved: Set<String>?, shownIds: Set<String>, selected: Set<String>): Set<String>? =
        selected.intersect(shownIds).takeIf { it.isNotEmpty() }?.let { (saved.orEmpty() - shownIds) + it }

    fun current(methods: List<InputMethodInfo>, preferred: String?, legacyLanguage: String?): InputMethodInfo? {
        val id = preferred ?: when (legacyLanguage) {
            "hindi" -> "in.unsigned.input.hi.phonetic"
            "bangla", "bengali" -> "in.unsigned.input.bn.phonetic"
            "english" -> "in.unsigned.input.en"
            else -> "in.unsigned.input.as.phonetic"
        }
        return methods.firstOrNull { it.id == id } ?: methods.firstOrNull()
    }
}
