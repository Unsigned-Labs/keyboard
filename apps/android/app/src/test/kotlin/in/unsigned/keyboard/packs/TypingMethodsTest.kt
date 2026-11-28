package `in`.unsigned.keyboard.packs

import `in`.unsigned.keyboard.layout.KeyAction
import `in`.unsigned.keyboard.layout.LayoutInput
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class TypingMethodsTest {
    @Test fun noInstalledMethodStillHasPlainEnglishTyping() {
        val fallback = withTypingFallback(emptyList()).single()
        assertNull(fallback.transliterationId)
        val layout = PackRepository.layout(fallback.layoutId)!!
        assertEquals(LayoutInput.LATIN, layout.input)
        val keys = layout.pages.single().rows.flatMap { it.keys }
        assertEquals(('a'..'z').map { it.toString() }.toSet(), keys.mapNotNull { it.output }.filter { it.length == 1 && it[0] in 'a'..'z' }.toSet())
        assertTrue(keys.any { it.action == KeyAction.SPACE })
        assertTrue(keys.any { it.action == KeyAction.DELETE })
    }

    @Test fun fallbackNeverAppearsAlongsideInstalledMethods() {
        val english = InputMethodInfo("in.unsigned.input.en", "English", "EN", "layout", null)
        assertEquals(listOf(english), withTypingFallback(listOf(english)))
    }

    @Test fun missingDictionaryDoesNotDisablePhoneticTyping() {
        val method = InputMethodInfo("phonetic", "Phonetic", "P", "layout", "scheme")
        assertTrue(hasTypingResources(method, mapOf("layout" to "keyboard_layout", "scheme" to "transliteration")))
    }

    @Test fun missingOrWrongKindRequiredResourceDisablesTypingStyle() {
        val method = InputMethodInfo("phonetic", "Phonetic", "P", "layout", "scheme")
        assertTrue(!hasTypingResources(method, mapOf("layout" to "keyboard_layout")))
        assertTrue(!hasTypingResources(method, mapOf("layout" to "dictionary", "scheme" to "transliteration")))
    }
}
