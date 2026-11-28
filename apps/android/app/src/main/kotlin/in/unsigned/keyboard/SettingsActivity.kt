package `in`.unsigned.keyboard

import android.content.ContentResolver
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.preference.PreferenceManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import `in`.unsigned.keyboard.packs.PackRepository
import `in`.unsigned.keyboard.settings.ConfigureFragment
import `in`.unsigned.keyboard.settings.LanguageResourcesFragment
import `in`.unsigned.keyboard.settings.RefreshableSettings
import `in`.unsigned.keyboard.theme.AppTheme

class SettingsActivity : AppCompatActivity() {
    private val prefs get() = PreferenceManager.getDefaultSharedPreferences(this)
    private val onThemeChanged = SharedPreferences.OnSharedPreferenceChangeListener { shared, key ->
        if (key == AppTheme.PREF_KEY || key == null) {
            AppTheme.apply(delegate, shared.getString(AppTheme.PREF_KEY, null))
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        AppTheme.apply(delegate, AppTheme.savedMode(this))
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportFragmentManager.addOnBackStackChangedListener(::updateTitle)
        updateTitle()

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .setReorderingAllowed(true)
                .replace(R.id.settings_container, ConfigureFragment())
                .commit()
            importFromIntent(intent)
        }
    }

    override fun onStart() {
        super.onStart()
        prefs.registerOnSharedPreferenceChangeListener(onThemeChanged)
        AppTheme.apply(delegate, AppTheme.savedMode(this))
    }

    override fun onStop() {
        prefs.unregisterOnSharedPreferenceChangeListener(onThemeChanged)
        super.onStop()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        importFromIntent(intent)
    }

    private fun importFromIntent(intent: Intent?) {
        if (intent?.action != Intent.ACTION_VIEW) return
        val uri = intent.data?.takeIf { it.scheme == ContentResolver.SCHEME_CONTENT } ?: return
        importPack(uri)
    }

    internal fun importPack(uri: Uri) {
        PackRepository.import(this, uri)
            .onSuccess {
                Toast.makeText(this, getString(R.string.settings_resource_imported_toast, it.name), Toast.LENGTH_LONG).show()
            }
            .onFailure { error ->
                MaterialAlertDialogBuilder(this)
                    .setTitle(R.string.settings_resource_import_error)
                    .setMessage(R.string.settings_resource_import_error_message)
                    .setNeutralButton(R.string.settings_resource_details) { _, _ ->
                        MaterialAlertDialogBuilder(this)
                            .setTitle(R.string.settings_resource_details)
                            .setMessage(error.message ?: error.javaClass.simpleName)
                            .setPositiveButton(android.R.string.ok, null)
                            .show()
                    }
                    .setPositiveButton(android.R.string.ok, null)
                    .show()
            }
        (supportFragmentManager.findFragmentById(R.id.settings_container) as? RefreshableSettings)?.refresh()
    }

    internal fun showLanguageResources() {
        supportFragmentManager.beginTransaction()
            .setReorderingAllowed(true)
            .replace(R.id.settings_container, LanguageResourcesFragment())
            .addToBackStack("language_resources")
            .commit()
    }

    private fun updateTitle() {
        val title = if (supportFragmentManager.backStackEntryCount == 0) {
            R.string.settings_configure
        } else {
            R.string.settings_resources
        }
        supportActionBar?.setTitle(title)
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressedDispatcher.onBackPressed()
        return true
    }
}
