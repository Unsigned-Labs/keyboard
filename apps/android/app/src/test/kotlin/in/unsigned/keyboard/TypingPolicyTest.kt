package `in`.unsigned.keyboard

import android.text.InputType
import android.view.inputmethod.EditorInfo
import org.junit.Assert.*
import org.junit.Test

class TypingPolicyTest {
    @Test fun manualIncognitoDoesNotNeedEditorFlags() {
        assertTrue(isIncognito(true, false))
        assertFalse(isIncognito(false, false))
    }

    @Test fun passwordsAndNoLearningForceIncognito() {
        val passwords = listOf(
            InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD,
            InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD,
            InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD,
            InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
        )
        passwords.forEach { assertTrue(editorRequiresIncognito(it, 0)) }
        assertTrue(editorRequiresIncognito(InputType.TYPE_CLASS_TEXT, EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING))
        assertFalse(editorRequiresIncognito(InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI, 0))
    }

    @Test fun respectsEditorNoSuggestionsWithoutCallingItIncognito() {
        val inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
        assertFalse(editorRequiresIncognito(inputType, 0))
        assertFalse(editorAllowsSuggestions(inputType))
        assertTrue(editorAllowsSuggestions(InputType.TYPE_CLASS_TEXT))
    }

    @Test fun apostropheIsInternalOnlyWhenTransliterationSupportsIt() {
        assertTrue(acceptsTransliteration("'", "abc'", hasComposition = true))
        assertFalse(acceptsTransliteration("'", "abc'", hasComposition = false))
        assertFalse(acceptsTransliteration("'", "abc", hasComposition = true))
        assertTrue(acceptsTransliteration("a'b", "abc'", hasComposition = false))
        assertFalse(acceptsTransliteration("'ab", "abc'", hasComposition = false))
    }
}
