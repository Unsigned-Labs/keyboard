package `in`.unsigned.keyboard

import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import androidx.preference.PreferenceManager
import `in`.unsigned.keyboard.layout.KeyboardLayout
import `in`.unsigned.keyboard.layout.LayoutInput
import `in`.unsigned.keyboard.packs.InputMethodInfo
import `in`.unsigned.keyboard.packs.PackRepository
import `in`.unsigned.keyboard.theme.KeyboardTheme
import org.json.JSONArray

class UnsignedKeyboardService : InputMethodService() {

    private lateinit var keyboardView: UnsignedKeyboardView

    private var inputMethod: InputMethodInfo? = null
    private var layout: KeyboardLayout? = null
    /** Characters the active transliteration takes; other keys are typed as they are. */
    private var alphabet: String = ""
    private val composing = StringBuilder()
    /** Candidates for [composing]; the first is shown in the text field and committed by space. */
    private var candidates: List<String> = emptyList()

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
        })
        applyPreferences()
        return keyboardView
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        PackRepository.ensureLoaded(this)
        applyPreferences()
        composing.clear()
        activate(prefs.getString(PREF_INPUT_METHOD, null) ?: legacyInputMethod())
    }

    override fun onFinishInput() {
        super.onFinishInput()
        composing.clear()
        setCandidates(emptyList())
    }

    private fun applyPreferences() {
        val theme = runCatching { KeyboardTheme.valueOf(prefs.getString("theme", "DEFAULT_LIGHT")!!) }
            .getOrDefault(KeyboardTheme.DEFAULT_LIGHT)
        keyboardView.setTheme(theme)
        keyboardView.setFeedbackPreferences(prefs.getBoolean("vibration", true), prefs.getBoolean("sound", true))
    }

    private val suggestionsEnabled get() = prefs.getBoolean(PREF_SUGGESTIONS, true)

    private fun enabledInputMethods(): List<InputMethodInfo> {
        val all = PackRepository.inputMethods()
        val enabled = prefs.getStringSet(PREF_ENABLED, null) ?: return all
        return all.filter { it.id in enabled }.ifEmpty { all }
    }

    /** Switch to an input method, falling back to the first enabled one. */
    private fun activate(id: String?) {
        finishComposing()
        val enabled = enabledInputMethods()
        val im = enabled.firstOrNull { it.id == id } ?: enabled.firstOrNull() ?: return
        val imLayout = PackRepository.layout(im.layoutId) ?: return

        inputMethod = im
        layout = imLayout
        alphabet = im.transliterationId
            ?.takeIf { imLayout.input == LayoutInput.LATIN }
            ?.let { Engine.inputAlphabet(it) }
            .orEmpty()
        prefs.edit().putString(PREF_INPUT_METHOD, im.id).apply()

        keyboardView.setInputMethods(enabled, im.id)
        keyboardView.setLayout(imLayout, im.shortLabel)
        keyboardView.setSuggestionStripVisible(suggestionsEnabled && im.transliterationId != null && alphabet.isNotEmpty())
        keyboardView.setCandidates(emptyList())
    }

    /** Maps the language setting of versions before packs to the matching input method. */
    private fun legacyInputMethod(): String = when (prefs.getString("language", null)) {
        "hindi" -> "org.unsigned.input.hi.phonetic"
        "bangla", "bengali" -> "org.unsigned.input.bn.phonetic"
        "english" -> "org.unsigned.input.en"
        else -> "org.unsigned.input.as.phonetic"
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

        if (transliteration != null && alphabet.isNotEmpty() && text.all { it in alphabet }) {
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

    /** Shows the best candidate for the composing text in the field, and the rest in the strip. */
    private fun showComposing(ic: InputConnection) {
        val im = inputMethod ?: return
        val typed = composing.toString()
        val list = if (suggestionsEnabled) {
            val json = JSONArray(Engine.candidates(im.id, typed, CANDIDATE_LIMIT))
            (0 until json.length()).map { json.getJSONObject(it).getString("text") }
        } else {
            emptyList()
        }
        val shown = list.firstOrNull()
            ?: im.transliterationId?.let { Engine.transliterate(it, typed) }
            ?: typed
        setCandidates(list)
        ic.setComposingText(shown, 1)
    }

    private fun setCandidates(list: List<String>) {
        candidates = list
        if (::keyboardView.isInitialized) keyboardView.setCandidates(list)
    }

    /** Commits a candidate from the strip, followed by a space. */
    private fun pickCandidate(index: Int) {
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
        private const val CANDIDATE_LIMIT = 8
    }
}
