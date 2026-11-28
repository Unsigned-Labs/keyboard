package `in`.unsigned.keyboard

import android.os.Build
import android.service.textservice.SpellCheckerService
import android.view.textservice.SuggestionsInfo
import android.view.textservice.TextInfo
import androidx.preference.PreferenceManager
import `in`.unsigned.keyboard.packs.PackRepository

/** Optional Android system checker. It never learns; unsupported text is not marked as a typo. */
class UnsignedSpellCheckerService : SpellCheckerService() {
    private val prefs by lazy { PreferenceManager.getDefaultSharedPreferences(this) }

    override fun createSession(): Session = object : Session() {
        override fun onCreate() = Unit

        override fun onGetSuggestions(textInfo: TextInfo?, suggestionsLimit: Int): SuggestionsInfo {
            val text = textInfo?.text ?: return neutral()
            val sessionLocale = locale.orEmpty()
            if (!isEnglishSpellLocale(sessionLocale) || prefs.getBoolean(PREF_INCOGNITO, false)
            ) return neutral()

            val dictionary = PackRepository.englishDictionary(this@UnsignedSpellCheckerService, "in.unsigned.dictionary.en")
                ?: return neutral()
            val result = dictionary.spell(text, sessionLocale, suggestionsLimit)
            val attribute = when (result.status) {
                Spelling.NEUTRAL -> return neutral()
                Spelling.IN_DICTIONARY -> SuggestionsInfo.RESULT_ATTR_IN_THE_DICTIONARY
                Spelling.TYPO -> SuggestionsInfo.RESULT_ATTR_LOOKS_LIKE_TYPO
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && supportedAttributes and attribute == 0) return neutral()
            return SuggestionsInfo(attribute, result.suggestions.toTypedArray())
        }
    }

    private fun neutral() = SuggestionsInfo(0, null)
}
