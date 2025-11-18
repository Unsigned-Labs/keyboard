package `in`.unsigned.keyboard

import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import androidx.preference.PreferenceManager
import `in`.unsigned.keyboard.theme.KeyboardTheme

class UnsignedKeyboardService : InputMethodService() {

    private lateinit var keyboardView: UnsignedKeyboardView
    private var currentLanguage = "assamese"
    private var composingText = StringBuilder()
    private var isComposing = false

    override fun onCreateInputView(): View {
        keyboardView = UnsignedKeyboardView(this)
        keyboardView.setOnKeyboardActionListener(object : UnsignedKeyboardView.OnKeyboardActionListener {
            override fun onKey(primaryCode: Int) {
                handleKey(primaryCode)
            }

            override fun onText(text: String) {
                currentInputConnection?.commitText(text, 1)
            }

            override fun onLanguageChanged(language: String) {
                currentLanguage = language
                val prefs = PreferenceManager.getDefaultSharedPreferences(this@UnsignedKeyboardService)
                prefs.edit().putString("language", currentLanguage).apply()
                keyboardView.updateLanguage(currentLanguage)

                composingText.clear()
                isComposing = false
                currentInputConnection?.finishComposingText()
            }
        })

        applyTheme()

        return keyboardView
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)

        // Load saved language preference
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        currentLanguage = prefs.getString("language", "assamese") ?: "assamese"

        // Apply theme (in case it changed in settings)
        applyTheme()

        // Apply feedback settings
        val vibration = prefs.getBoolean("vibration", true)
        val sound = prefs.getBoolean("sound", true)
        keyboardView.setFeedbackPreferences(vibration, sound)

        // Reset composing state
        composingText.clear()
        isComposing = false

        keyboardView.updateLanguage(currentLanguage)
    }

    /**
     * Applies the saved theme from preferences
     */
    private fun applyTheme() {
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val themeCode = prefs.getString("theme", "DEFAULT_LIGHT") ?: "DEFAULT_LIGHT"

        try {
            val theme = KeyboardTheme.valueOf(themeCode)
            keyboardView.setTheme(theme)
        } catch (e: IllegalArgumentException) {
            // Fallback to default light if invalid theme code
            keyboardView.setTheme(KeyboardTheme.DEFAULT_LIGHT)
        }
    }

    private fun handleKey(code: Int) {
        val ic: InputConnection = currentInputConnection ?: return

        when (code) {
            -5 -> handleDelete(ic)
            32 -> handleSpace(ic)
            10 -> handleEnter(ic)
            else -> handleCharacter(code, ic)
        }
    }

    private fun handleCharacter(code: Int, ic: InputConnection) {
        val char = code.toChar().toString()

        if (currentLanguage == "english") {
            ic.commitText(char, 1)
        } else {
            composingText.append(char)
            isComposing = true

            try {
                val transliterated = Transliterator.transliterate(composingText.toString(), currentLanguage)
                ic.setComposingText(transliterated, 1)
            } catch (e: Exception) {
                ic.setComposingText(composingText.toString(), 1)
            }
        }
    }

    private fun handleSpace(ic: InputConnection) {
        if (isComposing) {
            // Commit the composing text
            ic.finishComposingText()
            composingText.clear()
            isComposing = false
        }
        ic.commitText(" ", 1)
    }

    private fun handleEnter(ic: InputConnection) {
        if (isComposing) {
            ic.finishComposingText()
            composingText.clear()
            isComposing = false
        }
        ic.commitText("\n", 1)
    }

    private fun handleDelete(ic: InputConnection) {
        if (isComposing && composingText.isNotEmpty()) {
            // Remove last character from composing text
            composingText.deleteCharAt(composingText.length - 1)

            if (composingText.isEmpty()) {
                ic.setComposingText("", 0)
                isComposing = false
            } else {
                // Re-transliterate
                try {
                    val transliterated = Transliterator.transliterate(composingText.toString(), currentLanguage)
                    ic.setComposingText(transliterated, 1)
                } catch (e: Exception) {
                    ic.setComposingText(composingText.toString(), 1)
                }
            }
        } else {
            // Delete committed text
            ic.deleteSurroundingText(1, 0)
        }
    }
}
