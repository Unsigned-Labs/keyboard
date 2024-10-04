package `in`.unsigned.keyboard

import android.inputmethodservice.InputMethodService
import android.inputmethodservice.Keyboard
import android.inputmethodservice.KeyboardView
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection

class Keyboard : InputMethodService(), KeyboardView.OnKeyboardActionListener {

    private lateinit var keyboardView: KeyboardView
    private lateinit var keyboard: Keyboard
    private val transliterator = Transliterator(AssameseSchema())

    override fun onCreateInputView(): View {
        keyboardView = layoutInflater.inflate(R.layout.keyboard_view, null) as KeyboardView
        keyboard = Keyboard(this, R.xml.keyboard_layout)
        keyboardView.keyboard = keyboard
        keyboardView.setOnKeyboardActionListener(this)
        return keyboardView
    }

    override fun onKey(primaryCode: Int, keyCodes: IntArray?) {
        val inputConnection = currentInputConnection ?: return
        when (primaryCode) {
            Keyboard.KEYCODE_DELETE -> inputConnection.deleteSurroundingText(1, 0)
            Keyboard.KEYCODE_DONE -> inputConnection.performEditorAction(EditorInfo.IME_ACTION_DONE)
            else -> {
                val code = primaryCode.toChar().toString()
                val text = transliterator.transliterate(code)
                inputConnection.commitText(text, 1)
            }
        }
    }

    // Implement other required methods from OnKeyboardActionListener
    override fun onPress(primaryCode: Int) {}
    override fun onRelease(primaryCode: Int) {}
    override fun onText(text: CharSequence?) {}
    override fun swipeLeft() {}
    override fun swipeRight() {}
    override fun swipeDown() {}
    override fun swipeUp() {}
}