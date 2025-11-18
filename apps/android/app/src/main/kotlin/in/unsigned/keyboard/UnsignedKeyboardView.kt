package `in`.unsigned.keyboard

import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.provider.Settings
import android.util.AttributeSet
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.widget.LinearLayout
import android.widget.PopupWindow
import android.widget.TextView
import android.media.AudioManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.HapticFeedbackConstants
import `in`.unsigned.keyboard.layout.*
import `in`.unsigned.keyboard.theme.KeyboardColorScheme
import `in`.unsigned.keyboard.theme.KeyboardTheme
import `in`.unsigned.keyboard.theme.KeyVisualStyle

class UnsignedKeyboardView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    interface OnKeyboardActionListener {
        fun onKey(primaryCode: Int)
        fun onText(text: String)
        fun onLanguageChanged(language: String)
    }

    private var listener: OnKeyboardActionListener? = null
    private var currentLanguage = "assamese"
    private var isShifted = false
    private var capsLock = false
    private var pressedKey: ComputedKey? = null
    private var keyboardMode = KeyboardMode.LETTERS

    enum class KeyboardMode {
        LETTERS,
        NUMBERS,
        SYMBOLS
    }

    private var computedKeys = listOf<ComputedKey>()
    private lateinit var layoutEngine: LayoutEngine

    private val keyNormalPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val keyFunctionalPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val keyActionPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val keyPressedPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textPrimaryPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textSecondaryPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textOnActionPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val shadowPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val backgroundPaint = Paint(Paint.ANTI_ALIAS_FLAG)

    private var vibrationEnabled = true
    private var soundEnabled = true
    private val vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
        val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
        vibratorManager?.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

    private var colorScheme: KeyboardColorScheme = KeyboardColorScheme.DefaultLight

    private val isDarkMode: Boolean
        get() = (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

    init {
        updateTheme()
    }

    private fun updateTheme() {
        colorScheme = if (isDarkMode) {
            KeyboardColorScheme.DefaultDark
        } else {
            KeyboardColorScheme.DefaultLight
        }
        applyColorScheme()
    }

    fun setTheme(theme: KeyboardTheme) {
        colorScheme = theme.getColorScheme()
        applyColorScheme()
        invalidate()
    }

    private fun applyColorScheme() {
        keyNormalPaint.apply {
            color = colorScheme.keyNormal
            style = Paint.Style.FILL
        }

        keyFunctionalPaint.apply {
            color = colorScheme.keyFunctional
            style = Paint.Style.FILL
        }

        keyActionPaint.apply {
            color = colorScheme.keyAction
            style = Paint.Style.FILL
        }

        textPrimaryPaint.apply {
            color = colorScheme.textPrimary
            textSize = 56f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        }

        textSecondaryPaint.apply {
            color = colorScheme.textSecondary
            textSize = 44f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        }

        textOnActionPaint.apply {
            color = colorScheme.textOnAction
            textSize = 56f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        }

        shadowPaint.apply {
            color = colorScheme.shadow
            style = Paint.Style.FILL
            setShadowLayer(4f, 0f, 2f, colorScheme.shadow)
        }

        backgroundPaint.color = colorScheme.keyboardBackground
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        layoutEngine = LayoutEngine(w, h)
        updateLayout()
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val desiredHeightDp = 210
        val desiredHeightPx = (desiredHeightDp * context.resources.displayMetrics.density).toInt()

        val width = MeasureSpec.getSize(widthMeasureSpec)
        setMeasuredDimension(width, desiredHeightPx)
    }

    private fun updateLayout() {
        val layout = when (keyboardMode) {
            KeyboardMode.LETTERS -> KeyboardLayouts.getLettersLayout()
            KeyboardMode.NUMBERS -> KeyboardLayouts.getNumbersLayout()
            KeyboardMode.SYMBOLS -> KeyboardLayouts.getSymbolsLayout()
        }

        computedKeys = layoutEngine.computeLayout(layout, isShifted || capsLock)
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), backgroundPaint)

        computedKeys.forEach { key ->
            drawKeyShadow(canvas, key)
            drawKey(canvas, key, key == pressedKey)
        }
    }

    private fun drawKeyShadow(canvas: Canvas, key: ComputedKey) {
        val cornerRadius = 12f
        val shadowOffset = 4f
        
        val shadowRect = RectF(key.bounds).apply {
            top += shadowOffset
            bottom += shadowOffset
        }
        
        canvas.drawRoundRect(shadowRect, cornerRadius, cornerRadius, shadowPaint)
    }

    private fun drawKey(canvas: Canvas, key: ComputedKey, isPressed: Boolean) {
        val cornerRadius = 12f

        val backgroundPaint = when {
            isPressed -> getPressedPaint(key.style)
            else -> getBackgroundPaint(key.style)
        }

        val textPaint = when {
            key.style == KeyVisualStyle.ACTION -> textOnActionPaint
            isPressed -> textOnActionPaint
            key.style == KeyVisualStyle.FUNCTIONAL -> textSecondaryPaint
            else -> textPrimaryPaint
        }

        canvas.drawRoundRect(key.bounds, cornerRadius, cornerRadius, backgroundPaint)

        val displayLabel = getDisplayLabel(key)

        if (displayLabel.isNotEmpty()) {
            val savedTextSize = textPaint.textSize
            if (key.style == KeyVisualStyle.FUNCTIONAL) {
                textPaint.textSize = 48f
            }

            val textX = key.bounds.centerX()
            val textY = key.bounds.centerY() - (textPaint.descent() + textPaint.ascent()) / 2
            canvas.drawText(displayLabel, textX, textY, textPaint)

            textPaint.textSize = savedTextSize
        }
    }

    private fun getBackgroundPaint(style: KeyVisualStyle): Paint {
        return when (style) {
            KeyVisualStyle.NORMAL -> keyNormalPaint
            KeyVisualStyle.FUNCTIONAL -> keyFunctionalPaint
            KeyVisualStyle.ACTION -> keyActionPaint
            KeyVisualStyle.SPACEBAR -> keyNormalPaint
        }
    }

    private fun getPressedPaint(style: KeyVisualStyle): Paint {
        keyPressedPaint.color = when (style) {
            KeyVisualStyle.NORMAL, KeyVisualStyle.SPACEBAR -> colorScheme.keyNormalPressed
            KeyVisualStyle.FUNCTIONAL -> colorScheme.keyFunctionalPressed
            KeyVisualStyle.ACTION -> colorScheme.keyActionPressed
        }
        keyPressedPaint.style = Paint.Style.FILL
        return keyPressedPaint
    }

    private fun getDisplayLabel(key: ComputedKey): String {
        return when (key.keyCode) {
            KeyCode.SHIFT -> if (capsLock) "⇪" else if (isShifted) "⇧" else "⇧"
            KeyCode.LANG_SWITCH -> getLanguageLabel()
            else -> key.label
        }
    }

    private fun getLanguageLabel(): String {
        return when (currentLanguage) {
            "hindi" -> "हिं"
            "assamese" -> "অ"
            "bangla" -> "বাং"
            "english" -> "EN"
            else -> "🌐"
        }
    }

    private val repeatHandler = android.os.Handler(android.os.Looper.getMainLooper())
    private val repeatRunnable = object : Runnable {
        override fun run() {
            pressedKey?.let { key ->
                performHapticFeedback()
                handleKeyPress(key)
                repeatHandler.postDelayed(this, 50)
            }
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                val key = findKey(event.x, event.y)
                if (key != null) {
                    pressedKey = key
                    invalidate()

                    if (key.keyCode == KeyCode.LANG_SWITCH) {
                        performHapticFeedback()
                        showLanguagePopup()
                    } else {
                        performHapticFeedback()
                        playSoundEffect()
                        handleKeyPress(key)

                        if (key.keyCode == KeyCode.DELETE) {
                            repeatHandler.removeCallbacks(repeatRunnable)
                            repeatHandler.postDelayed(repeatRunnable, 400)
                        }
                    }
                }
                return true
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                repeatHandler.removeCallbacks(repeatRunnable)
                if (pressedKey != null) {
                    pressedKey = null
                    invalidate()
                }
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    private fun handleKeyPress(key: ComputedKey) {
        when (key.keyCode) {
            KeyCode.SHIFT -> {
                if (isShifted) {
                    capsLock = true
                    isShifted = false
                } else if (capsLock) {
                    capsLock = false
                } else {
                    isShifted = true
                }
                updateLayout()
            }
            KeyCode.MODE_CHANGE -> {
                when (keyboardMode) {
                    KeyboardMode.LETTERS -> keyboardMode = KeyboardMode.NUMBERS
                    KeyboardMode.NUMBERS -> {
                        keyboardMode = if (key.label == "=\\<") {
                            KeyboardMode.SYMBOLS
                        } else {
                            KeyboardMode.LETTERS
                        }
                    }
                    KeyboardMode.SYMBOLS -> keyboardMode = KeyboardMode.LETTERS
                }
                updateLayout()
            }
            else -> {
                listener?.onKey(key.keyCode)
                if (isShifted && !capsLock) {
                    isShifted = false
                    updateLayout()
                }
            }
        }
    }

    private fun showLanguagePopup() {
        val popupView = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.WHITE)
            setPadding(32, 32, 32, 32)
            background = run {
                val drawable = android.graphics.drawable.GradientDrawable()
                drawable.setColor(Color.WHITE)
                drawable.cornerRadius = 16f
                drawable
            }
        }

        val languages = listOf(
            "assamese" to "অসমীয়া",
            "bengali" to "বাংলা",
            "hindi" to "हिन्दी",
            "english" to "English"
        )

        val popupWindow = PopupWindow(
            popupView,
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
            true
        )
        popupWindow.elevation = 10f

        languages.forEach { (code, name) ->
            val item = TextView(context).apply {
                text = name
                textSize = 18f
                setPadding(16, 16, 16, 16)
                setTextColor(Color.BLACK)
                setOnClickListener {
                    currentLanguage = code
                    listener?.onLanguageChanged(code)
                    popupWindow.dismiss()
                }
            }
            popupView.addView(item)
        }

        val separator = View(context).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                2
            ).apply {
                setMargins(0, 16, 0, 16)
            }
            setBackgroundColor(colorScheme.keyboardSeparator)
        }
        popupView.addView(separator)

        val settingsButton = TextView(context).apply {
            text = "⚙ Keyboard Settings"
            textSize = 18f
            setPadding(16, 16, 16, 16)
            setTextColor(Color.BLACK)
            setOnClickListener {
                val intent = Intent(Settings.ACTION_INPUT_METHOD_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                popupWindow.dismiss()
            }
        }
        popupView.addView(settingsButton)

        popupWindow.showAtLocation(this, Gravity.CENTER, 0, 0)
    }

    override fun performClick(): Boolean {
        return super.performClick()
    }

    private fun findKey(x: Float, y: Float): ComputedKey? {
        return computedKeys.find { it.bounds.contains(x, y) }
    }

    fun setOnKeyboardActionListener(listener: OnKeyboardActionListener) {
        this.listener = listener
    }

    fun updateLanguage(language: String) {
        currentLanguage = language
        invalidate()
    }

    fun setFeedbackPreferences(vibration: Boolean, sound: Boolean) {
        vibrationEnabled = vibration
        soundEnabled = sound
    }

    private fun performHapticFeedback() {
        if (!vibrationEnabled) return
        val v = vibrator ?: return

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(10, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(10)
            }
        } catch (e: Exception) {
            // Ignore vibration errors
        }
    }

    private fun playSoundEffect() {
        if (!soundEnabled) return
        try {
            audioManager?.playSoundEffect(AudioManager.FX_KEYPRESS_STANDARD)
        } catch (e: Exception) {
            // Ignore sound errors
        }
    }
}
