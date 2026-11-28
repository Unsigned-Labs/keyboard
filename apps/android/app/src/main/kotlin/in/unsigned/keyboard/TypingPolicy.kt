package `in`.unsigned.keyboard

import android.text.InputType
import android.view.inputmethod.EditorInfo

internal const val PREF_INCOGNITO = "incognito_mode"

internal fun isIncognito(manual: Boolean, requiredByEditor: Boolean): Boolean = manual || requiredByEditor

internal fun editorRequiresIncognito(inputType: Int, imeOptions: Int): Boolean {
    if (imeOptions and EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING != 0) return true
    val variation = inputType and InputType.TYPE_MASK_VARIATION
    return when (inputType and InputType.TYPE_MASK_CLASS) {
        InputType.TYPE_CLASS_TEXT -> variation == InputType.TYPE_TEXT_VARIATION_PASSWORD ||
            variation == InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD ||
            variation == InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD
        InputType.TYPE_CLASS_NUMBER -> variation == InputType.TYPE_NUMBER_VARIATION_PASSWORD
        else -> false
    }
}

internal fun editorAllowsSuggestions(inputType: Int): Boolean {
    if (inputType and InputType.TYPE_MASK_CLASS != InputType.TYPE_CLASS_TEXT ||
        inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS != 0
    ) return false
    return when (inputType and InputType.TYPE_MASK_VARIATION) {
        InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS, InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS,
        InputType.TYPE_TEXT_VARIATION_URI, InputType.TYPE_TEXT_VARIATION_FILTER -> false
        else -> true
    }
}

internal fun acceptsTransliteration(text: String, alphabet: String, hasComposition: Boolean): Boolean =
    text.isNotEmpty() && text.all { it in alphabet } &&
        (hasComposition || (text.first() != '\'' && text.first() != '’'))
