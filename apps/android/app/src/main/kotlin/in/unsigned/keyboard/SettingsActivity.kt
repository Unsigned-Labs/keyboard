package `in`.unsigned.keyboard

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.inputmethod.InputMethodManager
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.preference.ListPreference
import androidx.preference.MultiSelectListPreference
import androidx.preference.Preference
import androidx.preference.PreferenceCategory
import androidx.preference.PreferenceFragmentCompat
import `in`.unsigned.keyboard.packs.PackRepository

class SettingsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Unsigned Keyboard Settings"
        PackRepository.ensureLoaded(this)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.settings_container, SettingsFragment())
                .commit()
            importFromIntent(intent)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        importFromIntent(intent)
    }

    /** "Open with" a pack file from a file manager. */
    private fun importFromIntent(intent: Intent?) {
        if (intent?.action != Intent.ACTION_VIEW) return
        val uri = intent.data ?: return
        importPack(uri)
    }

    fun importPack(uri: Uri) {
        PackRepository.import(this, uri)
            .onSuccess { Toast.makeText(this, "Installed ${it.name} ${it.version}", Toast.LENGTH_LONG).show() }
            .onFailure { error ->
                AlertDialog.Builder(this)
                    .setTitle("Couldn't install this pack")
                    .setMessage(error.message ?: error.toString())
                    .setPositiveButton(android.R.string.ok, null)
                    .show()
            }
        (supportFragmentManager.findFragmentById(R.id.settings_container) as? SettingsFragment)?.refresh()
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressedDispatcher.onBackPressed()
        return true
    }

    class SettingsFragment : PreferenceFragmentCompat() {
        private val pickPack = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            if (uri != null) (activity as? SettingsActivity)?.importPack(uri)
        }

        override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
            setPreferencesFromResource(R.xml.preferences, rootKey)

            findPreference<Preference>("enable_keyboard")?.setOnPreferenceClickListener {
                val imm = requireContext().getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
                imm.showInputMethodPicker()
                true
            }
            findPreference<Preference>("import_pack")?.setOnPreferenceClickListener {
                pickPack.launch(arrayOf("application/json", "application/octet-stream", "text/plain"))
                true
            }
            findPreference<Preference>("version")?.summary = BuildConfig.VERSION_NAME
            refresh()
        }

        fun refresh() {
            val context = context ?: return
            val inputMethods = PackRepository.inputMethods()
            val names = inputMethods.map { it.name }.toTypedArray()
            val ids = inputMethods.map { it.id }.toTypedArray()

            findPreference<ListPreference>(UnsignedKeyboardService.PREF_INPUT_METHOD)?.apply {
                entries = names
                entryValues = ids
                summaryProvider = ListPreference.SimpleSummaryProvider.getInstance()
            }
            findPreference<MultiSelectListPreference>(UnsignedKeyboardService.PREF_ENABLED)?.apply {
                entries = names
                entryValues = ids
                if (values.isEmpty()) values = ids.toSet()
                summary = "${values.count { it in ids }} of ${ids.size} enabled"
                setOnPreferenceChangeListener { _, new ->
                    summary = "${(new as Set<*>).count { it in ids }} of ${ids.size} enabled"
                    true
                }
            }

            val category = findPreference<PreferenceCategory>("packs") ?: return
            for (i in category.preferenceCount - 1 downTo 0) {
                val p = category.getPreference(i)
                if (p.key != "import_pack") category.removePreference(p)
            }
            for (pack in PackRepository.packs()) {
                category.addPreference(Preference(context).apply {
                    key = "pack:${pack.id}"
                    title = pack.name
                    summary = buildString {
                        append(pack.kind.replace('_', ' '))
                        append(" · ").append(pack.version)
                        append(if (pack.imported) " · imported" else " · built in")
                        append("\n").append(pack.id)
                    }
                    isIconSpaceReserved = false
                    if (pack.imported) {
                        setOnPreferenceClickListener {
                            AlertDialog.Builder(context)
                                .setTitle("Remove ${pack.name}?")
                                .setMessage("A built-in pack with the same id, if any, is used again.")
                                .setPositiveButton("Remove") { _, _ ->
                                    PackRepository.remove(context, pack.id)
                                    refresh()
                                }
                                .setNegativeButton(android.R.string.cancel, null)
                                .show()
                            true
                        }
                    }
                })
            }
        }
    }
}
