package `in`.unsigned.keyboard

import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.AttributeSet
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.widget.LinearLayout
import android.widget.PopupWindow
import android.widget.TextView
import `in`.unsigned.keyboard.layout.ComputedKey
import `in`.unsigned.keyboard.layout.KeyAction
import `in`.unsigned.keyboard.layout.KeyboardLayout
import `in`.unsigned.keyboard.layout.LayoutEngine
import `in`.unsigned.keyboard.layout.SymbolPages
import `in`.unsigned.keyboard.packs.InputMethodInfo
import `in`.unsigned.keyboard.theme.KeyVisualStyle
import `in`.unsigned.keyboard.theme.KeyboardColorScheme
import `in`.unsigned.keyboard.theme.KeyboardTheme

/** Draws whichever layout pack is active and reports what the user pressed. */
class UnsignedKeyboardView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    interface Listener {
        /** A key that types text. [afterConsonant] is the alternative for direct layouts. */
        fun onText(text: String, afterConsonant: String?)
        fun onDelete()
        fun onSpace()
        fun onEnter()
        fun onNextInputMethod()
        fun onInputMethodSelected(id: String)
    }

    private var listener: Listener? = null

    private var layout: KeyboardLayout = SymbolPages.layout
    private var pageId: String? = null
    private var showingSymbols = false
    private var isShifted = false
    private var capsLock = false
    private var inputMethodLabel = "🌐"
    private var inputMethods: List<InputMethodInfo> = emptyList()
    private var currentInputMethodId: String? = null

    private var computedKeys = listOf<ComputedKey>()
    private var layoutEngine: LayoutEngine? = null
    private var pressedKey: ComputedKey? = null
    private var longPressFired = false

    private val keyNormalPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val keyFunctionalPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val keyActionPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val keyPressedPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textPrimaryPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textSecondaryPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textOnActionPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val hintPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val shadowPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val backgroundPaint = Paint(Paint.ANTI_ALIAS_FLAG)

    private var vibrationEnabled = true
    private var soundEnabled = true
    private val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

    private var colorScheme: KeyboardColorScheme =
        if ((context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES) {
            KeyboardColorScheme.DefaultDark
        } else {
            KeyboardColorScheme.DefaultLight
        }

    private val handler = Handler(Looper.getMainLooper())
    private val repeatDelete = object : Runnable {
        override fun run() {
            if (pressedKey?.key?.action == KeyAction.DELETE) {
                performHapticFeedback()
                listener?.onDelete()
                handler.postDelayed(this, 50)
            }
        }
    }
    private val longPress = Runnable {
        val key = pressedKey ?: return@Runnable
        when {
            key.key.action == KeyAction.NEXT_INPUT_METHOD -> {
                longPressFired = true
                performHapticFeedback()
                showInputMethodPicker()
            }
            key.key.action == null && key.key.longPress.isNotEmpty() -> {
                longPressFired = true
                performHapticFeedback()
                listener?.onText(key.key.longPress.first(), null)
            }
        }
    }

    init {
        applyColorScheme()
    }

    fun setOnKeyboardActionListener(listener: Listener) {
        this.listener = listener
    }

    /** Show a layout pack's first page. */
    fun setLayout(layout: KeyboardLayout, inputMethodLabel: String) {
        val heightChanged = layout.maxRows != this.layout.maxRows
        this.layout = layout
        this.inputMethodLabel = inputMethodLabel
        pageId = null
        showingSymbols = false
        isShifted = false
        capsLock = false
        if (heightChanged) requestLayout()
        updateLayout()
    }

    fun setInputMethods(all: List<InputMethodInfo>, currentId: String?) {
        inputMethods = all
        currentInputMethodId = currentId
    }

    fun setTheme(theme: KeyboardTheme) {
        colorScheme = theme.getColorScheme()
        applyColorScheme()
        invalidate()
    }

    fun setFeedbackPreferences(vibration: Boolean, sound: Boolean) {
        vibrationEnabled = vibration
        soundEnabled = sound
    }

    private val activeLayout get() = if (showingSymbols) SymbolPages.layout else layout
    private val rowCount get() = maxOf(layout.maxRows, SymbolPages.layout.maxRows)

    private fun applyColorScheme() {
        keyNormalPaint.apply { color = colorScheme.keyNormal; style = Paint.Style.FILL }
        keyFunctionalPaint.apply { color = colorScheme.keyFunctional; style = Paint.Style.FILL }
        keyActionPaint.apply { color = colorScheme.keyAction; style = Paint.Style.FILL }
        for ((paint, color) in listOf(
            textPrimaryPaint to colorScheme.textPrimary,
            textSecondaryPaint to colorScheme.textSecondary,
            textOnActionPaint to colorScheme.textOnAction,
            hintPaint to colorScheme.textHint
        )) {
            paint.color = color
            paint.textAlign = Paint.Align.CENTER
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        }
        hintPaint.textSize = 28f
        shadowPaint.apply {
            color = colorScheme.shadow
            style = Paint.Style.FILL
            setShadowLayer(4f, 0f, 2f, colorScheme.shadow)
        }
        backgroundPaint.color = colorScheme.keyboardBackground
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val rowHeightDp = 52
        val height = (rowCount * rowHeightDp * context.resources.displayMetrics.density).toInt()
        setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), height)
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        layoutEngine = LayoutEngine(w, h)
        updateLayout()
    }

    private fun updateLayout() {
        val engine = layoutEngine ?: return
        val page = activeLayout.page(pageId)
        computedKeys = engine.computeLayout(page, rowCount, isShifted || capsLock)
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), backgroundPaint)
        for (key in computedKeys) {
            val shadow = RectF(key.bounds).apply { top += 4f; bottom += 4f }
            canvas.drawRoundRect(shadow, 12f, 12f, shadowPaint)
            drawKey(canvas, key, key == pressedKey)
        }
    }

    private fun drawKey(canvas: Canvas, key: ComputedKey, pressed: Boolean) {
        val style = key.key.style
        val background = if (pressed) pressedPaint(style) else when (style) {
            KeyVisualStyle.NORMAL, KeyVisualStyle.SPACEBAR -> keyNormalPaint
            KeyVisualStyle.FUNCTIONAL -> keyFunctionalPaint
            KeyVisualStyle.ACTION -> keyActionPaint
        }
        canvas.drawRoundRect(key.bounds, 12f, 12f, background)

        val label = displayLabel(key)
        if (label.isEmpty()) return
        val paint = when {
            style == KeyVisualStyle.ACTION || pressed -> textOnActionPaint
            style == KeyVisualStyle.FUNCTIONAL -> textSecondaryPaint
            else -> textPrimaryPaint
        }
        paint.textSize = if (style == KeyVisualStyle.FUNCTIONAL) 44f else 56f
        val maxWidth = key.bounds.width() * 0.8f
        while (paint.measureText(label) > maxWidth && paint.textSize > 20f) paint.textSize -= 2f

        val y = key.bounds.centerY() - (paint.descent() + paint.ascent()) / 2
        canvas.drawText(label, key.bounds.centerX(), y, paint)

        key.key.longPress.firstOrNull()?.takeIf { key.key.action == null }?.let { hint ->
            canvas.drawText(hint, key.bounds.right - 18f, key.bounds.top + 30f, hintPaint)
        }
    }

    private fun pressedPaint(style: KeyVisualStyle): Paint {
        keyPressedPaint.color = when (style) {
            KeyVisualStyle.NORMAL, KeyVisualStyle.SPACEBAR -> colorScheme.keyNormalPressed
            KeyVisualStyle.FUNCTIONAL -> colorScheme.keyFunctionalPressed
            KeyVisualStyle.ACTION -> colorScheme.keyActionPressed
        }
        return keyPressedPaint
    }

    private fun displayLabel(key: ComputedKey): String = when (key.key.action) {
        KeyAction.SHIFT -> if (capsLock) "⇪" else "⇧"
        KeyAction.NEXT_INPUT_METHOD -> inputMethodLabel
        else -> key.label
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                val key = computedKeys.find { it.bounds.contains(event.x, event.y) } ?: return true
                pressedKey = key
                longPressFired = false
                performHapticFeedback()
                playSoundEffect()
                when (key.key.action) {
                    KeyAction.DELETE -> {
                        listener?.onDelete()
                        handler.postDelayed(repeatDelete, 400)
                    }
                    KeyAction.SHIFT, KeyAction.PAGE, KeyAction.SYMBOLS -> handleModifier(key)
                    else -> handler.postDelayed(longPress, 350)
                }
                invalidate()
            }
            MotionEvent.ACTION_UP -> {
                handler.removeCallbacks(repeatDelete)
                handler.removeCallbacks(longPress)
                val key = pressedKey
                pressedKey = null
                if (key != null && !longPressFired && key.bounds.contains(event.x, event.y)) {
                    handleTap(key)
                }
                invalidate()
            }
            MotionEvent.ACTION_CANCEL -> {
                handler.removeCallbacks(repeatDelete)
                handler.removeCallbacks(longPress)
                pressedKey = null
                invalidate()
            }
        }
        return true
    }

    private fun handleModifier(key: ComputedKey) {
        when (key.key.action) {
            KeyAction.SHIFT -> when {
                capsLock -> capsLock = false
                isShifted -> { capsLock = true; isShifted = false }
                else -> isShifted = true
            }
            KeyAction.PAGE -> pageId = key.key.target
            KeyAction.SYMBOLS -> {
                showingSymbols = !showingSymbols
                pageId = null
            }
            else -> {}
        }
        updateLayout()
    }

    private fun handleTap(key: ComputedKey) {
        val l = listener ?: return
        when (key.key.action) {
            null -> {
                val shifted = isShifted || capsLock
                val text = key.key.outputFor(shifted) ?: return
                l.onText(text, key.key.afterConsonant)
                if (isShifted) {
                    isShifted = false
                    updateLayout()
                }
            }
            KeyAction.SPACE -> l.onSpace()
            KeyAction.ENTER -> l.onEnter()
            KeyAction.NEXT_INPUT_METHOD -> l.onNextInputMethod()
            else -> {}
        }
    }

    private fun showInputMethodPicker() {
        val textColor = colorScheme.textPrimary
        val popupView = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
            background = GradientDrawable().apply {
                setColor(colorScheme.keyNormal)
                cornerRadius = 16f
            }
        }
        val popup = PopupWindow(popupView, LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT, true)
        popup.elevation = 10f

        fun item(text: String, onClick: () -> Unit) = TextView(context).apply {
            this.text = text
            textSize = 18f
            setPadding(16, 16, 16, 16)
            setTextColor(textColor)
            setOnClickListener { onClick(); popup.dismiss() }
        }

        for (im in inputMethods) {
            val mark = if (im.id == currentInputMethodId) "✓  " else "     "
            popupView.addView(item(mark + im.name) { listener?.onInputMethodSelected(im.id) })
        }
        popupView.addView(View(context).apply {
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 2).apply { setMargins(0, 16, 0, 16) }
            setBackgroundColor(colorScheme.keyboardSeparator)
        })
        popupView.addView(item("⚙  Settings") {
            context.startActivity(Intent(context, SettingsActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        })
        popup.showAtLocation(this, Gravity.CENTER, 0, 0)
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
            // Some devices refuse vibration; typing must not fail because of it.
        }
    }

    private fun playSoundEffect() {
        if (!soundEnabled) return
        try {
            audioManager?.playSoundEffect(AudioManager.FX_KEYPRESS_STANDARD)
        } catch (e: Exception) {
            // Same as vibration.
        }
    }
}
