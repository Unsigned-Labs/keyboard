package `in`.unsigned.keyboard.packs

import android.content.Context
import android.net.Uri
import `in`.unsigned.keyboard.Engine
import `in`.unsigned.keyboard.layout.KeyboardLayout
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

data class PackInfo(
    val id: String,
    val kind: String,
    val version: String,
    val name: String,
    val language: String?,
    val imported: Boolean
)

data class InputMethodInfo(
    val id: String,
    val name: String,
    val shortLabel: String,
    val layoutId: String,
    val transliterationId: String?
)

/**
 * Packs bundled in the APK (assets/packs, copied from the repo's modules/ folder) plus packs the
 * user imported from files (filesDir/packs). The settings screen and the keyboard run in the same
 * process and share this state.
 */
object PackRepository {
    private const val ASSET_DIR = "packs"
    private const val MAX_PACK_BYTES = 8 * 1024 * 1024

    private var loaded = false
    private val importedIds = mutableSetOf<String>()
    private val layoutCache = mutableMapOf<String, KeyboardLayout>()

    @Synchronized
    fun ensureLoaded(context: Context) {
        if (!loaded) reload(context)
    }

    @Synchronized
    fun reload(context: Context) {
        Engine.clear()
        importedIds.clear()
        layoutCache.clear()
        loadAssets(context, ASSET_DIR)
        importDir(context).listFiles { f -> f.extension == "json" }?.sortedBy { it.name }?.forEach { file ->
            try {
                val info = JSONObject(Engine.loadPack(file.readBytes()))
                importedIds += info.getString("id")
            } catch (e: Exception) {
                // A pack that no longer validates (e.g. after an engine update) is skipped, not fatal.
            }
        }
        loaded = true
    }

    private fun loadAssets(context: Context, dir: String) {
        val entries = context.assets.list(dir) ?: return
        for (entry in entries.sorted()) {
            val path = "$dir/$entry"
            if (entry.endsWith(".json")) {
                Engine.loadPack(context.assets.open(path).use { it.readBytes() })
            } else {
                loadAssets(context, path)
            }
        }
    }

    private fun importDir(context: Context) = File(context.filesDir, "packs").apply { mkdirs() }

    /** Validates a pack file and, only if it is valid, keeps a copy and loads it. */
    @Synchronized
    fun import(context: Context, uri: Uri): Result<PackInfo> = runCatching {
        ensureLoaded(context)
        val bytes = context.contentResolver.openInputStream(uri)?.use { input ->
            val data = input.readBytes()
            require(data.size <= MAX_PACK_BYTES) { "File is too large for a pack" }
            data
        } ?: throw IllegalArgumentException("Couldn't read the file")

        val declaredVersion = runCatching {
            JSONObject(String(bytes)).getJSONObject("resource").getString("version")
        }.getOrNull()
        val info = parseInfo(JSONObject(Engine.loadPack(bytes)))
        require(declaredVersion == null || info.version == declaredVersion) {
            "A newer version (${info.version}) of ${info.id} is already installed"
        }

        val dir = importDir(context)
        val tmp = File(dir, "${info.id}.json.tmp")
        tmp.writeBytes(bytes)
        if (!tmp.renameTo(File(dir, "${info.id}.json"))) {
            tmp.delete()
            throw IllegalStateException("Couldn't save the pack")
        }
        importedIds += info.id
        layoutCache.remove(info.id)
        info.copy(imported = true)
    }

    @Synchronized
    fun remove(context: Context, id: String) {
        File(importDir(context), "$id.json").delete()
        reload(context)
    }

    @Synchronized
    fun packs(): List<PackInfo> {
        val array = JSONArray(Engine.listPacks())
        return (0 until array.length()).map { parseInfo(array.getJSONObject(it)) }
    }

    /** Input methods whose layout and transliteration are both installed. */
    @Synchronized
    fun inputMethods(): List<InputMethodInfo> = packs()
        .filter { it.kind == "input_method" && JSONArray(Engine.missingDependencies(it.id)).length() == 0 }
        .mapNotNull { info ->
            val json = Engine.packJson(info.id) ?: return@mapNotNull null
            val im = JSONObject(json).getJSONObject("input_method")
            InputMethodInfo(
                id = info.id,
                name = im.getString("name"),
                shortLabel = im.str("short_label") ?: im.getString("name").take(2),
                layoutId = im.getString("layout"),
                transliterationId = im.str("transliteration")
            )
        }

    @Synchronized
    fun layout(id: String): KeyboardLayout? = layoutCache.getOrPut(id) {
        val json = Engine.packJson(id) ?: return null
        KeyboardLayout.fromPackJson(id, JSONObject(json))
    }

    private fun parseInfo(o: JSONObject) = PackInfo(
        id = o.getString("id"),
        kind = o.getString("kind"),
        version = o.getString("version"),
        name = o.getString("name"),
        language = o.str("language"),
        imported = o.getString("id") in importedIds
    )
}

/** org.json returns "null" from optString for JSON nulls; this returns a real null. */
internal fun JSONObject.str(name: String): String? =
    if (isNull(name)) null else optString(name).ifEmpty { null }
