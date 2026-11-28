package `in`.unsigned.keyboard.settings

import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.preference.Preference
import androidx.preference.PreferenceCategory
import androidx.preference.PreferenceFragmentCompat
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import `in`.unsigned.keyboard.R
import `in`.unsigned.keyboard.SettingsActivity
import `in`.unsigned.keyboard.packs.PackInfo
import `in`.unsigned.keyboard.packs.PackRepository
import java.util.Locale

class LanguageResourcesFragment : PreferenceFragmentCompat(), RefreshableSettings {
    private val pickPack = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) (activity as? SettingsActivity)?.importPack(uri)
    }

    override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
        preferenceScreen = preferenceManager.createPreferenceScreen(requireContext())
        refresh()
    }

    override fun refresh() {
        val context = context ?: return
        PackRepository.ensureLoaded(context)
        val installed = PackRepository.packs()
        val shadowedFactory = PackRepository.shadowedFactoryPacks()
        val shadowedIds = shadowedFactory.mapTo(mutableSetOf()) { it.id }
        val removed = PackRepository.removedFactoryPacks()
        val availableMethods = PackRepository.inputMethods().mapTo(mutableSetOf()) { it.id }
        preferenceScreen.apply {
            removeAll()
            addPreference(Preference(context).apply {
                summary = getString(R.string.settings_resources_intro)
                isSelectable = false
                isIconSpaceReserved = false
            })
            addPreference(Preference(context).apply {
                setTitle(R.string.settings_resource_import)
                setSummary(R.string.settings_resource_import_summary)
                isIconSpaceReserved = false
                setOnPreferenceClickListener {
                    pickPack.launch(arrayOf("application/json", "application/octet-stream", "text/plain"))
                    true
                }
            })
            val installedCategory = PreferenceCategory(context).apply {
                setTitle(R.string.settings_resources_installed)
                isIconSpaceReserved = false
            }
            addPreference(installedCategory)
            if (installed.isEmpty()) {
                installedCategory.addPreference(Preference(context).apply {
                    setSummary(R.string.settings_resources_empty)
                    isSelectable = false
                    isIconSpaceReserved = false
                })
            }
            for (pack in (installed + shadowedFactory).sortedBy(::displayName)) {
                val shadowed = !pack.imported && pack.id in shadowedIds
                val unavailable = !shadowed && pack.kind == "input_method" && pack.id !in availableMethods
                installedCategory.addPreference(Preference(context).apply {
                    title = displayName(pack)
                    val source = if (pack.imported) R.string.settings_resource_source_imported
                        else R.string.settings_resource_source_included
                    val kind = getString(kindLabel(pack))
                    summary = when {
                        shadowed -> getString(R.string.settings_resource_shadowed, kind)
                        unavailable -> getString(R.string.settings_resource_unavailable, kind)
                        else -> getString(R.string.settings_resource_row_summary, kind, getString(source))
                    }
                    isIconSpaceReserved = false
                    setOnPreferenceClickListener {
                        showInstalled(pack, unavailable, shadowed)
                        true
                    }
                })
            }
            if (removed.isNotEmpty()) {
                val removedCategory = PreferenceCategory(context).apply {
                    setTitle(R.string.settings_resources_removed)
                    isIconSpaceReserved = false
                }
                addPreference(removedCategory)
                for (pack in removed.sortedBy(::displayName)) {
                    removedCategory.addPreference(Preference(context).apply {
                        title = displayName(pack)
                        summary = getString(R.string.settings_resource_tap_restore, getString(kindLabel(pack)))
                        isIconSpaceReserved = false
                        setOnPreferenceClickListener {
                            showRestore(pack, installed.any { it.id == pack.id && it.imported })
                            true
                        }
                    })
                }
            }
        }
    }

    private fun showInstalled(pack: PackInfo, unavailable: Boolean, shadowed: Boolean) {
        val dependents = PackRepository.installedUses(pack.id)
        val replacement = pack.imported && PackRepository.hasEnabledFactoryCopy(pack.id)
        val lines = mutableListOf(description(pack, unavailable))
        if (dependents.isNotEmpty()) {
            lines += getString(R.string.settings_resource_used_by, dependents.joinToString(", ", transform = ::displayName))
            if (pack.kind != "dictionary" && !replacement && !shadowed) {
                lines += getString(R.string.settings_resource_required_notice)
            }
        }
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(getString(R.string.settings_resource_remove_title, displayName(pack)))
            .setMessage((lines + getString(when {
                replacement -> R.string.settings_resource_remove_imported_override
                pack.imported -> R.string.settings_resource_remove_imported
                shadowed -> R.string.settings_resource_remove_shadowed
                else -> R.string.settings_resource_remove_included
            })).joinToString("\n\n"))
            .setPositiveButton(R.string.settings_resource_remove) { _, _ ->
                applyResourceChange {
                    if (pack.imported) PackRepository.remove(requireContext(), pack.id)
                    else PackRepository.removeFactory(requireContext(), pack.id)
                }
            }
            .setNeutralButton(R.string.settings_resource_details) { _, _ -> showDetails(pack) }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun showRestore(pack: PackInfo, hasImportedCopy: Boolean) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(getString(R.string.settings_resource_restore_title, displayName(pack)))
            .setMessage(listOfNotNull(getString(R.string.settings_resource_restore_message),
                if (hasImportedCopy) getString(R.string.settings_resource_restore_imported) else null
            ).joinToString("\n\n"))
            .setPositiveButton(R.string.settings_resource_restore) { _, _ ->
                applyResourceChange { PackRepository.restoreFactory(requireContext(), pack.id) }
            }
            .setNeutralButton(R.string.settings_resource_details) { _, _ -> showDetails(pack) }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun showDetails(pack: PackInfo) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle(R.string.settings_resource_details)
            .setMessage(getString(R.string.settings_resource_details_value, pack.id, pack.version))
            .setPositiveButton(android.R.string.ok, null)
            .show()
    }

    private inline fun applyResourceChange(action: () -> Result<Unit>) {
        action().onFailure {
            MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.settings_resource_change_error)
                .setPositiveButton(android.R.string.ok, null)
                .show()
        }
        refresh()
    }

    private fun displayName(pack: PackInfo): String {
        if (pack.imported || pack.kind !in setOf("dictionary", "transliteration")) return pack.name
        val tag = pack.language ?: return pack.name
        val language = Locale.forLanguageTag(tag).getDisplayLanguage(resources.configuration.locales[0])
        return getString(R.string.settings_resource_row_summary, language, getString(kindLabel(pack)))
    }

    private fun kindLabel(pack: PackInfo): Int = when (pack.kind) {
        "input_method" -> R.string.settings_resource_kind_style
        "keyboard_layout" -> R.string.settings_resource_kind_layout
        "transliteration" -> R.string.settings_resource_kind_phonetic
        "dictionary" -> R.string.settings_resource_kind_dictionary
        else -> R.string.settings_resource_kind_other
    }

    private fun description(pack: PackInfo, unavailable: Boolean): String = getString(when (pack.kind) {
        "input_method" -> if (unavailable) R.string.settings_resource_unavailable_description else R.string.settings_resource_style_description
        "keyboard_layout" -> R.string.settings_resource_layout_description
        "transliteration" -> R.string.settings_resource_phonetic_description
        "dictionary" -> R.string.settings_resource_dictionary_description
        else -> R.string.settings_resources_intro
    })
}
