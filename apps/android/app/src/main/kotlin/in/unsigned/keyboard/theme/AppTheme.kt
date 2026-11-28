package `in`.unsigned.keyboard.theme

import android.content.Context
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatDelegate
import androidx.preference.PreferenceManager

/** Appearance preference shared by the settings activity and the keyboard service. */
object AppTheme {
    const val PREF_KEY = "theme"
    const val SYSTEM = "SYSTEM"
    private const val LIGHT = "DEFAULT_LIGHT"
    private const val DARK = "DEFAULT_DARK"

    fun savedMode(context: Context): String? =
        PreferenceManager.getDefaultSharedPreferences(context).getString(PREF_KEY, null)

    fun isDark(context: Context, savedMode: String? = savedMode(context)): Boolean = isDark(
        savedMode,
        (context.applicationContext.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
            Configuration.UI_MODE_NIGHT_YES
    )

    internal fun isDark(savedMode: String?, systemDark: Boolean): Boolean = when (savedMode) {
        LIGHT -> false
        DARK -> true
        else -> systemDark
    }

    fun apply(delegate: AppCompatDelegate, savedMode: String?) {
        delegate.localNightMode = when (savedMode) {
            LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
            DARK -> AppCompatDelegate.MODE_NIGHT_YES
            else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
        }
    }

    fun selection(savedMode: String?): String = when (savedMode) {
        LIGHT, DARK -> savedMode
        else -> SYSTEM
    }
}
