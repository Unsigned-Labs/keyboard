package `in`.unsigned.keyboard

import android.os.Bundle
import android.view.inputmethod.InputMethodManager
import androidx.appcompat.app.AppCompatActivity
import androidx.preference.ListPreference
import androidx.preference.Preference
import androidx.preference.PreferenceFragmentCompat

class SettingsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Unsigned Keyboard Settings"

        if (savedInstanceState == null) {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.settings_container, SettingsFragment())
                .commit()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressedDispatcher.onBackPressed()
        return true
    }

    class SettingsFragment : PreferenceFragmentCompat() {
        override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
            setPreferencesFromResource(R.xml.preferences, rootKey)

            // Language preference
            findPreference<ListPreference>("language")?.apply {
                setOnPreferenceChangeListener { _, newValue ->
                    summary = getLanguageDisplay(newValue as String)
                    true
                }
                summary = getLanguageDisplay(value)
            }

            // Enable keyboard preference
            findPreference<Preference>("enable_keyboard")?.apply {
                setOnPreferenceClickListener {
                    val imm = requireContext().getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
                    imm.showInputMethodPicker()
                    true
                }
            }
        }

        private fun getLanguageDisplay(code: String): String {
            return when (code) {
                "hindi" -> "Hindi (हिंदी)"
                "assamese" -> "Assamese (অসমীয়া)"
                "bangla" -> "Bangla (বাংলা)"
                else -> code
            }
        }
    }
}
