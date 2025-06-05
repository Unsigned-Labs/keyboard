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
    private var lastCommittedLength = 0  // Track how many characters we've committed
    private val transliterator = Transliterator()
    private var isAssameseMode = true
    private var isSymbolsMode = false

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
            -100 -> handleSymbolsToggle() // ?123 key
            -101 -> handleLanguageSwitch() // Globe key
            -102 -> handleAssameseToggle() // Assamese toggle key
            in 48..57 -> handleNumber(primaryCode) // Number keys 0-9
            else -> handleCharacter(primaryCode)
        }
    }

    private fun handleNumber(primaryCode: Int) {
        if (isAssameseMode) {
            // Flush any pending transliteration first
            flushBuffer()
            
            // Convert to Assamese digits
            val assameseDigit = when (primaryCode) {
                48 -> "০" // 0
                49 -> "১" // 1
                50 -> "২" // 2
                51 -> "৩" // 3
                52 -> "৪" // 4
                53 -> "৫" // 5
                54 -> "৬" // 6
                55 -> "৭" // 7
                56 -> "৮" // 8
                57 -> "৯" // 9
                else -> primaryCode.toChar().toString()
            }
            currentInputConnection?.commitText(assameseDigit, 1)
        } else {
            // English mode - just output the number
            currentInputConnection?.commitText(primaryCode.toChar().toString(), 1)
        }
    }

    private fun handleCharacter(primaryCode: Int) {
        val char = primaryCode.toChar()
        val charToAdd = if (isShiftPressed) char.uppercaseChar() else char.lowercaseChar()
        
        if (isAssameseMode) {
            // Add to buffer for transliteration
            inputBuffer.append(charToAdd)
            
            // Transliterate the current buffer
            val transliterated = transliterator.transliterate(inputBuffer.toString())
            
            // Calculate how much we need to update
            val newLength = transliterated.length
            val toDelete = lastCommittedLength
            val toAdd = transliterated
            
            // Delete previous committed text and commit new transliterated text
            if (toDelete > 0) {
                currentInputConnection?.deleteSurroundingText(toDelete, 0)
            }
            currentInputConnection?.commitText(toAdd, 1)
            
            // Update our tracking
            lastCommittedLength = newLength
        } else {
            // English mode - direct character input
            currentInputConnection?.commitText(charToAdd.toString(), 1)
        }
        
        if (isShiftPressed) {
            isShiftPressed = false
            keyboardView?.isShifted = false
        }
    }

    private fun handleSpace() {
        if (isAssameseMode) {
            flushBuffer()
        }
        currentInputConnection?.commitText(" ", 1)
    }

    private fun handlePeriod() {
        if (isAssameseMode) {
            // Add period to buffer and try to transliterate
            inputBuffer.append(".")
            
            val transliterated = transliterator.transliterate(inputBuffer.toString())
            
            // Replace previous committed text with new transliterated text
            val toDelete = lastCommittedLength
            if (toDelete > 0) {
                currentInputConnection?.deleteSurroundingText(toDelete, 0)
            }
            currentInputConnection?.commitText(transliterated, 1)
            
            // Update tracking
            lastCommittedLength = transliterated.length
            
            // If the period was consumed in transliteration, we're done
            // If not, we need to clear buffer and add period separately
            if (!transliterated.endsWith(".")) {
                // Period was consumed in transliteration, clear buffer
                inputBuffer.clear()
                lastCommittedLength = transliterated.length
            }
        } else {
            currentInputConnection?.commitText(".", 1)
        }
    }

    private fun handleComma() {
        if (isAssameseMode) {
            flushBuffer()
        }
        currentInputConnection?.commitText(",", 1)
    }

    private fun handleBackspace() {
        if (isAssameseMode && inputBuffer.isNotEmpty()) {
            // Remove last character from buffer
            inputBuffer.deleteCharAt(inputBuffer.length - 1)
            
            if (inputBuffer.isEmpty()) {
                // Buffer is empty, just delete normally
                currentInputConnection?.deleteSurroundingText(1, 0)
                lastCommittedLength = 0
            } else {
                // Retransliterate remaining buffer
                val transliterated = transliterator.transliterate(inputBuffer.toString())
                
                // Replace previous committed text with new transliterated text
                val toDelete = lastCommittedLength
                if (toDelete > 0) {
                    currentInputConnection?.deleteSurroundingText(toDelete, 0)
                }
                currentInputConnection?.commitText(transliterated, 1)
                
                // Update tracking
                lastCommittedLength = transliterated.length
            }
        } else {
            // Normal backspace
            currentInputConnection?.deleteSurroundingText(1, 0)
            if (isAssameseMode) {
                lastCommittedLength = 0
            }
        }
    }

    private fun handleShift() {
        isShiftPressed = !isShiftPressed
        keyboardView?.isShifted = isShiftPressed
    }

    private fun handleSymbolsToggle() {
        // TODO: Implement symbols keyboard layout
        // For now, just show a toast or do nothing
    }

    private fun handleLanguageSwitch() {
        // TODO: Implement system language switching if needed
        // This could switch to other installed keyboards
    }

    private fun handleAssameseToggle() {
        // Flush any pending transliteration before switching
        if (isAssameseMode) {
            flushBuffer()
        }
        
        isAssameseMode = !isAssameseMode
        
        // Clear state for new mode
        inputBuffer.clear()
        lastCommittedLength = 0
        
        // Update the key label to show current mode
        updateLanguageKey()
    }

    private fun updateLanguageKey() {
        // Find and update the language toggle key
        val keys = keyboard?.keys
        keys?.forEach { key ->
            if (key.codes[0] == -102) {
                key.label = if (isAssameseMode) "EN" else "অসমীয়া"
            }
        }
        keyboardView?.invalidateAllKeys()
    }

    private fun flushBuffer() {
        if (inputBuffer.isNotEmpty()) {
            // Buffer should already be transliterated and committed
            // Just clear the tracking
            inputBuffer.clear()
            lastCommittedLength = 0
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