package `in`.unsigned.keyboard

import android.inputmethodservice.InputMethodService
import android.inputmethodservice.Keyboard
import android.inputmethodservice.KeyboardView
import android.view.View
import android.view.inputmethod.EditorInfo

class KeyboardService : InputMethodService(), KeyboardView.OnKeyboardActionListener {

    private var keyboardView: KeyboardView? = null
    private var keyboard: Keyboard? = null
    private var isShiftPressed = false
    private var inputBuffer = StringBuilder()
    private val transliterator = Transliterator()

    override fun onCreateInputView(): View {
        keyboardView = layoutInflater.inflate(R.layout.keyboard, null) as KeyboardView
        keyboard = Keyboard(this, R.xml.qwerty)
        keyboardView?.keyboard = keyboard
        keyboardView?.setOnKeyboardActionListener(this)
        return keyboardView!!
    }

    override fun onKey(primaryCode: Int, keyCodes: IntArray?) {
        when (primaryCode) {
            Keyboard.KEYCODE_DELETE -> handleBackspace()
            Keyboard.KEYCODE_SHIFT -> handleShift()
            Keyboard.KEYCODE_DONE -> currentInputConnection?.performEditorAction(EditorInfo.IME_ACTION_DONE)
            32 -> handleSpace() // Space key
            46 -> handlePeriod() // Period key
            44 -> handleComma() // Comma key
            else -> handleCharacter(primaryCode)
        }
    }

    private fun handleCharacter(primaryCode: Int) {
        val char = primaryCode.toChar()
        val charToAdd = if (isShiftPressed) char.uppercaseChar() else char.lowercaseChar()
        
        // Add to buffer but don't transliterate immediately
        inputBuffer.append(charToAdd)
        
        // Transliterate the entire buffer
        val transliterated = transliterator.transliterate(inputBuffer.toString())
        
        // Replace the current buffer content with transliterated result
        if (transliterated.isNotEmpty()) {
            // Delete previous buffer content and insert new transliterated text
            currentInputConnection?.deleteSurroundingText(inputBuffer.length - 1, 0)
            currentInputConnection?.commitText(transliterated, 1)
        }
        
        if (isShiftPressed) {
            isShiftPressed = false
            keyboardView?.isShifted = false
        }
    }

    private fun handleSpace() {
        flushBuffer()
        currentInputConnection?.commitText(" ", 1)
    }

    private fun handlePeriod() {
        inputBuffer.append(".")

        val result = transliterator.transliterateBuffer(inputBuffer.toString())

        if (result.transliterated.isNotEmpty()) {
            val charsToDelete = result.consumed
            if (charsToDelete > 1) {
                currentInputConnection?.deleteSurroundingText(charsToDelete - 1, 0)
            }
            currentInputConnection?.commitText(result.transliterated, 1)
            inputBuffer.clear()
            inputBuffer.append(result.remaining)
        } else {
            currentInputConnection?.commitText(".", 1)
        }
    }

    private fun handleComma() {
        flushBuffer()
        currentInputConnection?.commitText(",", 1)
    }

    private fun handleBackspace() {
        if (inputBuffer.isNotEmpty()) {
            inputBuffer.deleteCharAt(inputBuffer.length - 1)
        }
        currentInputConnection?.deleteSurroundingText(1, 0)
    }

    private fun handleShift() {
        isShiftPressed = !isShiftPressed
        keyboardView?.isShifted = isShiftPressed
    }

    private fun flushBuffer() {
        if (inputBuffer.isNotEmpty()) {
            val transliterated = transliterator.transliterate(inputBuffer.toString())
            if (transliterated.isNotEmpty()) {
                currentInputConnection?.deleteSurroundingText(inputBuffer.length, 0)
                currentInputConnection?.commitText(transliterated, 1)
            }
            inputBuffer.clear()
        }
    }

    override fun onPress(primaryCode: Int) {}
    override fun onRelease(primaryCode: Int) {}
    override fun onText(text: CharSequence?) {}
    override fun swipeDown() {}
    override fun swipeLeft() {}
    override fun swipeRight() {}
    override fun swipeUp() {}
}