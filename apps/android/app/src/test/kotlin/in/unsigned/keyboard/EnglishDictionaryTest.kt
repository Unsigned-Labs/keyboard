package `in`.unsigned.keyboard

import org.junit.Assert.*
import org.junit.Test

class EnglishDictionaryTest {
    private val dictionary = EnglishDictionary(mapOf("hello" to 10, "help" to 20, "don't" to 9, "the" to 30))

    @Test fun completionsRespectRankingAndKeepTypedSpelling() {
        assertEquals(listOf("he", "help", "hello"), dictionary.compose("he", 4))
        assertEquals(listOf("He", "Help", "Hello"), dictionary.compose("He", 4))
        assertEquals(listOf("HE", "HELP", "HELLO"), dictionary.compose("HE", 4))
        assertEquals(listOf("Don’", "Don’t"), dictionary.compose("Don’", 4))
    }

    @Test fun spellingIsCaseInsensitiveAndAcceptsCurlyApostrophes() {
        assertEquals(Spelling.IN_DICTIONARY, dictionary.spell("HELLO", "en-US", 4).status)
        assertEquals(Spelling.IN_DICTIONARY, dictionary.spell("don’t", "en_US", 4).status)
    }

    @Test fun transpositionIsAnEnglishTypoWhenACorrectionExists() {
        val result = dictionary.spell("Teh", "en", 4)
        assertEquals(Spelling.TYPO, result.status)
        assertEquals(listOf("The"), result.suggestions)
        assertEquals(Spelling.TYPO, dictionary.spell("teh", "en", 0).status)
        assertTrue(dictionary.spell("teh", "en", 0).suggestions.isEmpty())
    }

    @Test fun assameseAndMixedScriptAreNeutralEvenInAnEnglishSession() {
        for (word in listOf("অসমীয়া", "ৰhello", "a\u09BC", "hello123")) {
            assertEquals(word, Spelling.NEUTRAL, dictionary.spell(word, "en-US", 4).status)
        }
    }

    @Test fun unknownLocaleAndUncorrectableTokensAreNeutral() {
        assertEquals(Spelling.NEUTRAL, dictionary.spell("teh", "as-IN", 4).status)
        assertEquals(Spelling.NEUTRAL, dictionary.spell("teh", "", 4).status)
        assertEquals(Spelling.NEUTRAL, dictionary.spell("somerarelongname", "en", 4).status)
    }

    @Test fun acceptsAnApostropheOnlyAfterTheWordHasStarted() {
        assertTrue(acceptsEnglishComposition("'", hasComposition = true))
        assertFalse(acceptsEnglishComposition("'", hasComposition = false))
        assertFalse(acceptsEnglishComposition("3", hasComposition = true))
    }
}
