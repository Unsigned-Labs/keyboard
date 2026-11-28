package `in`.unsigned.keyboard.settings

import `in`.unsigned.keyboard.packs.InputMethodInfo
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class LanguageSettingsTest {
    private val english = InputMethodInfo("in.unsigned.input.en", "English", "EN", "layout", null)
    private val assamese = InputMethodInfo("in.unsigned.input.as.phonetic", "Assamese", "AS", "layout", "scheme")
    private val methods = listOf(assamese, english)

    @Test fun aNewInstallDoesNotFreezeTheEnabledList() {
        assertEquals(methods, LanguageSettings.enabled(methods, null))
    }

    @Test fun staleEnabledListFallsBackToUsableStyles() {
        assertEquals(methods, LanguageSettings.enabled(methods, setOf("removed")))
    }

    @Test fun removingAStyleFromTheGlobePreservesSavedIdsForUnavailableStyles() {
        assertEquals(setOf(english.id, "removed"), LanguageSettings.updateEnabled(
            saved = setOf(assamese.id, english.id, "removed"), shownIds = methods.map { it.id }.toSet(),
            selected = setOf(english.id)
        ))
    }

    @Test fun refusingToDisableEveryUsableStyleDoesNotOverwriteThePreference() {
        assertNull(LanguageSettings.updateEnabled(setOf("removed"), methods.map { it.id }.toSet(), emptySet()))
    }

    @Test fun existingLanguagePreferenceIsUsedWhenNoStyleHasBeenChosen() {
        assertEquals(english, LanguageSettings.current(methods, null, "english"))
    }

    @Test fun removedCurrentStyleUsesAnotherEnabledStyle() {
        assertEquals(assamese, LanguageSettings.current(methods, "removed", "english"))
    }
}
