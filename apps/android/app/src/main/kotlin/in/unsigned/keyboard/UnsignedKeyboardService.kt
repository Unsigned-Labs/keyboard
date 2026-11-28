package `in`.unsigned.keyboard

import android.content.res.Configuration
import android.inputmethodservice.InputMethodService
import android.text.InputType
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import androidx.preference.PreferenceManager
import `in`.unsigned.keyboard.layout.KeyboardLayout
import `in`.unsigned.keyboard.layout.LayoutInput
import `in`.unsigned.keyboard.packs.InputMethodInfo
import `in`.unsigned.keyboard.packs.PackRepository
import `in`.unsigned.keyboard.theme.AppTheme
import `in`.unsigned.keyboard.theme.KeyboardTheme
import org.json.JSONArray

class UnsignedKeyboardService : InputMethodService() {

    private lateinit var keyboardView: UnsignedKeyboardView

    private var inputMethod: InputMethodInfo? = null
    private var layout: KeyboardLayout? = null
    /** Characters the active transliteration takes; other keys are typed as they are. */
    private var alphabet: String = ""
    private val composing = StringBuilder()
    /** Candidates for [composing]; English never replaces the raw text unless tapped. */
    private var candidates: List<String> = emptyList()
    private var incognitoRequired = false
    private var fieldAllowsSuggestions = false

    private val prefs get() = PreferenceManager.getDefaultSharedPreferences(this)

    override fun onCreateInputView(): View {
        PackRepository.ensureLoaded(this)
        keyboardView = UnsignedKeyboardView(this)
        keyboardView.setOnKeyboardActionListener(object : UnsignedKeyboardView.Listener {
            override fun onText(text: String, afterConsonant: String?) = typeText(text, afterConsonant)
            override fun onDelete() = delete()
            override fun onSpace() = commitWithSeparator(" ")
            override fun onEnter() = enter()
            override fun onNextInputMethod() = switchToNext()
            override fun onInputMethodSelected(id: String) = activate(id)
            override fun onCandidateSelected(index: Int) = pickCandidate(index)
            override fun onToggleIncognito() = toggleIncognito()
        })
        applyPreferences()
        return keyboardView
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        PackRepository.ensureLoaded(this)
        applyPreferences()
        composing.clear()
        val inputType = info?.inputType ?: InputType.TYPE_NULL
        incognitoRequired = editorRequiresIncognito(inputType, info?.imeOptions ?: 0)
        fieldAllowsSuggestions = editorAllowsSuggestions(inputType)
        activate(prefs.getString(PREF_INPUT_METHOD, null) ?: legacyInputMethod(), remember = false)
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        finishComposing()
        super.onFinishInputView(finishingInput)
    }

    override fun onFinishInput() {
        super.onFinishInput()
        composing.clear()
        setCandidates(emptyList())
    }

    override fun onUpdateSelection(
        oldSelStart: Int, oldSelEnd: Int, newSelStart: Int, newSelEnd: Int,
        candidatesStart: Int, candidatesEnd: Int
    ) {
        super.onUpdateSelection(oldSelStart, oldSelEnd, newSelStart, newSelEnd, candidatesStart, candidatesEnd)
        if (composing.isNotEmpty() && (newSelStart != candidatesEnd || newSelEnd != candidatesEnd)) {
            finishComposing()
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        if (::keyboardView.isInitialized) applyPreferences()
    }

    private fun applyPreferences() {
        keyboardView.setTheme(if (AppTheme.isDark(this)) KeyboardTheme.DEFAULT_DARK else KeyboardTheme.DEFAULT_LIGHT)
        keyboardView.setFeedbackPreferences(prefs.getBoolean("vibration", true), prefs.getBoolean("sound", true))
    }

    private val manualIncognito get() = prefs.getBoolean(PREF_INCOGNITO, false)
    private val incognito get() = isIncognito(manualIncognito, incognitoRequired)
    private val suggestionsEnabled
        get() = !incognito && fieldAllowsSuggestions && prefs.getBoolean(PREF_SUGGESTIONS, true)
    private val english get() = inputMethod?.let { it.language == "en" && it.transliterationId == null } == true
    private var englishDictionary: EnglishDictionary? = null

    private fun toggleIncognito() {
        if (incognitoRequired) return
        finishComposing()
        // Persist the user's switch, never their input or private-session language selection.
        prefs.edit().putBoolean(PREF_INCOGNITO, !manualIncognito).apply()
        updateSuggestionUi()
    }

    private fun updateSuggestionUi() {
        keyboardView.setPrivacyState(incognito, incognitoRequired)
        keyboardView.setSuggestionStripVisible(suggestionsEnabled && (englishDictionary != null || alphabet.isNotEmpty()))
    }

    private fun enabledInputMethods(): List<InputMethodInfo> {
        val all = PackRepository.typingMethods()
        val enabled = prefs.getStringSet(PREF_ENABLED, null) ?: return all
        return all.filter { it.id in enabled }.ifEmpty { all }
    }

    /** Switch to an input method, falling back to the first enabled one. */
    private fun activate(id: String?, remember: Boolean = true) {
        finishComposing()
        val enabled = enabledInputMethods()
        val im = enabled.firstOrNull { it.id == id } ?: enabled.firstOrNull() ?: return
        val imLayout = PackRepository.layout(im.layoutId) ?: return

        inputMethod = im
        layout = imLayout
        englishDictionary = im.dictionaryId?.takeIf { english }?.let { PackRepository.englishDictionary(this, it) }
        alphabet = im.transliterationId
            ?.takeIf { imLayout.input == LayoutInput.LATIN }
            ?.let { Engine.inputAlphabet(it) }
            .orEmpty()
        if (remember && !incognito && !im.fallback) prefs.edit().putString(PREF_INPUT_METHOD, im.id).apply()

        keyboardView.setInputMethods(enabled, im.id)
        keyboardView.setLayout(imLayout, im.shortLabel)
        updateSuggestionUi()
    }

    /** Maps the language setting of versions before packs to the matching input method. */
    private fun legacyInputMethod(): String = when (prefs.getString("language", null)) {
        "hindi" -> "in.unsigned.input.hi.phonetic"
        "bangla", "bengali" -> "in.unsigned.input.bn.phonetic"
        "english" -> ENGLISH_INPUT_METHOD
        else -> "in.unsigned.input.as.phonetic"
    }

    private fun switchToNext() {
        val enabled = enabledInputMethods()
        if (enabled.isEmpty()) return
        val index = enabled.indexOfFirst { it.id == inputMethod?.id }
        activate(enabled[(index + 1) % enabled.size].id)
    }

    private fun typeText(text: String, afterConsonant: String?) {
        val ic = currentInputConnection ?: return
        val transliteration = inputMethod?.transliterationId

        val hasComposition = composing.isNotEmpty()
        val canTransliterate = transliteration != null && acceptsTransliteration(text, alphabet, hasComposition)
        val startsOrContinuesEnglish = englishDictionary != null && suggestionsEnabled && acceptsEnglishComposition(text, hasComposition)
        if (canTransliterate || startsOrContinuesEnglish) {
            composing.append(text)
            showComposing(ic)
            return
        }

        finishComposing()
        val current = layout
        if (afterConsonant != null && current != null && current.input == LayoutInput.DIRECT) {
            val before = ic.getTextBeforeCursor(1, 0)?.toString().orEmpty()
            if (before.isNotEmpty() && before in current.consonants) {
                ic.commitText(afterConsonant, 1)
                return
            }
        }
        ic.commitText(text, 1)
    }

    private fun delete() {
        val ic = currentInputConnection ?: return
        if (composing.isNotEmpty()) {
            composing.deleteCharAt(composing.length - 1)
            if (composing.isEmpty()) {
                ic.setComposingText("", 1)
                ic.finishComposingText()
                setCandidates(emptyList())
            } else {
                showComposing(ic)
            }
            return
        }
        val selected = ic.getSelectedText(0)
        if (!selected.isNullOrEmpty()) {
            ic.commitText("", 1)
        } else {
            val before = ic.getTextBeforeCursor(2, 0)
            val count = if (before != null && before.length == 2 && Character.isSurrogatePair(before[0], before[1])) 2 else 1
            ic.deleteSurroundingText(count, 0)
        }
    }

    /** Phonetic input shows its best transliteration. English stays verbatim until a tap. */
    private fun showComposing(ic: InputConnection) {
        val im = inputMethod ?: return
        val typed = composing.toString()
        val list = when {
            !suggestionsEnabled -> emptyList()
            english -> englishDictionary?.compose(typed, CANDIDATE_LIMIT).orEmpty()
            else -> {
                val json = JSONArray(Engine.candidates(im.id, typed, CANDIDATE_LIMIT))
                (0 until json.length()).map { json.getJSONObject(it).getString("text") }
            }
        }
        val shown = if (english) typed else (list.firstOrNull()
            ?: im.transliterationId?.let { Engine.transliterate(it, typed) }
            ?: typed)
        setCandidates(list)
        ic.setComposingText(shown, 1)
    }

    private fun setCandidates(list: List<String>) {
        candidates = list
        if (::keyboardView.isInitialized) keyboardView.setCandidates(list)
    }

    /** Commits a candidate from the strip, followed by a space. */
    private fun pickCandidate(index: Int) {
        if (!suggestionsEnabled || composing.isEmpty()) return
        val ic = currentInputConnection ?: return
        val text = candidates.getOrNull(index) ?: return
        ic.setComposingText(text, 1)
        ic.finishComposingText()
        composing.clear()
        setCandidates(emptyList())
        ic.commitText(" ", 1)
    }

    private fun finishComposing() {
        if (composing.isNotEmpty()) {
            currentInputConnection?.finishComposingText()
            composing.clear()
        }
        setCandidates(emptyList())
    }

    private fun commitWithSeparator(separator: String) {
        finishComposing()
        currentInputConnection?.commitText(separator, 1)
    }

    private fun enter() {
        finishComposing()
        val ic: InputConnection = currentInputConnection ?: return
        val info = currentInputEditorInfo
        val action = info?.imeOptions?.and(EditorInfo.IME_MASK_ACTION) ?: EditorInfo.IME_ACTION_NONE
        val noEnterAction = info != null && (info.imeOptions and EditorInfo.IME_FLAG_NO_ENTER_ACTION) != 0
        if (!noEnterAction && action != EditorInfo.IME_ACTION_NONE && action != EditorInfo.IME_ACTION_UNSPECIFIED) {
            ic.performEditorAction(action)
        } else {
            ic.commitText("\n", 1)
        }
    }

    companion object {
        const val PREF_INPUT_METHOD = "input_method"
        const val PREF_ENABLED = "enabled_input_methods"
        const val PREF_SUGGESTIONS = "suggestions"
        private const val ENGLISH_INPUT_METHOD = "in.unsigned.input.en"
        private const val CANDIDATE_LIMIT = 8
    }
}
