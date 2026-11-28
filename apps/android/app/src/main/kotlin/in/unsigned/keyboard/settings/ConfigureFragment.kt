package `in`.unsigned.keyboard.settings

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import androidx.appcompat.app.AlertDialog
import androidx.preference.ListPreference
import androidx.preference.Preference
import androidx.preference.PreferenceFragmentCompat
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import `in`.unsigned.keyboard.BuildConfig
import `in`.unsigned.keyboard.R
import `in`.unsigned.keyboard.SettingsActivity
import `in`.unsigned.keyboard.packs.InputMethodInfo
import `in`.unsigned.keyboard.packs.PackRepository
import `in`.unsigned.keyboard.theme.AppTheme
import java.util.Locale

internal interface RefreshableSettings {
    fun refresh()
}

class ConfigureFragment : PreferenceFragmentCompat(), RefreshableSettings {
    private val prefs get() = checkNotNull(preferenceManager.sharedPreferences)

    override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
        setPreferencesFromResource(R.xml.configure_preferences, rootKey)
        findPreference<Preference>("language_resources")?.setOnPreferenceClickListener {
            (requireActivity() as SettingsActivity).showLanguageResources()
            true
        }
        findPreference<Preference>("enable_keyboard")?.setOnPreferenceClickListener {
            val manager = requireContext().getSystemService(InputMethodManager::class.java)
            if (manager.hasKeyboardEnabled()) {
                manager.showInputMethodPicker()
            } else {
                startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS))
            }
            true
        }
        findPreference<ListPreference>(AppTheme.PREF_KEY)?.summaryProvider =
            Preference.SummaryProvider<ListPreference> { preference ->
                val value = AppTheme.selection(preference.value)
                val name = preference.entries[preference.findIndexOfValue(value)]
                getString(R.string.settings_theme_summary, name)
            }
        findPreference<Preference>("version")?.summary = getString(
            R.string.settings_version_value, BuildConfig.VERSION_NAME, BuildConfig.VERSION_CODE
        )
        refresh()
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    override fun refresh() {
        val context = context ?: return
        PackRepository.ensureLoaded(context)
        val available = PackRepository.typingMethods()
        val usingFallback = available.singleOrNull()?.fallback == true
        val saved = prefs.getStringSet(LanguageSettings.PREF_ENABLED, null)
        val enabled = LanguageSettings.enabled(available, saved)
        val current = LanguageSettings.current(
            enabled, prefs.getString(LanguageSettings.PREF_CURRENT, null),
            prefs.getString(LanguageSettings.PREF_LEGACY_LANGUAGE, null)
        )
        val labels = methodLabels(available)
        findPreference<Preference>(LanguageSettings.PREF_CURRENT)?.apply {
            summary = if (usingFallback) getString(R.string.settings_style_basic_summary) else labels[current?.id]
            isSelectable = !usingFallback
            setOnPreferenceClickListener {
                val selected = enabled.indexOf(current)
                MaterialAlertDialogBuilder(context)
                    .setTitle(R.string.settings_current_style)
                    .setSingleChoiceItems(enabled.map { labels.getValue(it.id) }.toTypedArray(), selected) { dialog, which ->
                        prefs.edit().putString(LanguageSettings.PREF_CURRENT, enabled[which].id).apply()
                        dialog.dismiss()
                        refresh()
                    }
                    .setNegativeButton(android.R.string.cancel, null)
                    .show()
                true
            }
        }
        findPreference<Preference>(LanguageSettings.PREF_ENABLED)?.apply {
            summary = if (usingFallback) getString(R.string.settings_style_basic_globe) else {
                resources.getQuantityString(R.plurals.settings_globe_summary, available.size, enabled.size, available.size)
            }
            isSelectable = !usingFallback
            setOnPreferenceClickListener {
                showGlobeChoices(available, enabled, labels)
                true
            }
        }
        val manager = context.getSystemService(InputMethodManager::class.java)
        findPreference<Preference>("enable_keyboard")?.setSummary(
            if (manager.hasKeyboardEnabled()) R.string.settings_keyboard_choose_summary else R.string.settings_keyboard_setup_summary
        )
    }

    private fun showGlobeChoices(
        available: List<InputMethodInfo>, enabled: List<InputMethodInfo>, labels: Map<String, String>
    ) {
        val chosen = enabled.mapTo(mutableSetOf()) { it.id }
        val shown = available.map { it.id }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.settings_globe_styles)
            .setMultiChoiceItems(
                shown.map(labels::getValue).toTypedArray(),
                BooleanArray(shown.size) { shown[it] in chosen }
            ) { dialog, which, checked ->
                if (checked) chosen.add(shown[which]) else chosen.remove(shown[which])
                (dialog as AlertDialog).getButton(AlertDialog.BUTTON_POSITIVE).isEnabled = chosen.isNotEmpty()
            }
            .setPositiveButton(android.R.string.ok) { _, _ ->
                val saved = prefs.getStringSet(LanguageSettings.PREF_ENABLED, null)
                val updated = LanguageSettings.updateEnabled(saved, shown.toSet(), chosen)
                if (updated != null) {
                    prefs.edit().putStringSet(LanguageSettings.PREF_ENABLED, updated).apply()
                    refresh()
                }
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun methodLabels(methods: List<InputMethodInfo>): Map<String, String> {
        val locale = resources.configuration.locales[0]
        val groups = methods.groupBy { method ->
            if (method.fallback) return@groupBy getString(R.string.settings_style_basic_english)
            val language = method.language?.let { Locale.forLanguageTag(it).getDisplayLanguage(locale) }
                ?.takeIf { it.isNotBlank() } ?: method.name
            getString(when {
                method.direct -> R.string.settings_style_native
                method.transliterationId != null -> R.string.settings_style_phonetic
                else -> R.string.settings_style_latin
            }, language)
        }
        return groups.flatMap { (label, matching) ->
            matching.map { method -> method.id to if (matching.size == 1) label else {
                getString(R.string.settings_style_named, label, method.name)
            } }
        }.toMap()
    }

    private fun InputMethodManager.hasKeyboardEnabled(): Boolean =
        enabledInputMethodList.any { it.packageName == requireContext().packageName }
}
