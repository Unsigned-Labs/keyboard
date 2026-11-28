package `in`.unsigned.keyboard.packs

import android.content.Context
import android.net.Uri
import android.util.JsonReader
import android.util.JsonToken
import `in`.unsigned.keyboard.Engine
import `in`.unsigned.keyboard.EnglishDictionary
import `in`.unsigned.keyboard.layout.KeyboardLayout
import `in`.unsigned.keyboard.layout.LayoutInput
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File

data class PackInfo(
    val id: String,
    val kind: String,
    val version: String,
    val name: String,
    val language: String?,
    val imported: Boolean,
    val dependencies: List<String> = emptyList()
)

data class InputMethodInfo(
    val id: String,
    val name: String,
    val shortLabel: String,
    val layoutId: String,
    val transliterationId: String?,
    val language: String? = null,
    val direct: Boolean = false,
    val fallback: Boolean = false,
    val dictionaryId: String? = null
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
    private val englishDictionaries = mutableMapOf<String, EnglishDictionary>()
    private var factoryPacks: Map<String, FactoryPack>? = null
    private var removedFactoryIds = emptySet<String>()

    private data class FactoryPack(val info: PackInfo, val path: String)

    @Synchronized
    fun ensureLoaded(context: Context) {
        if (!loaded) reload(context)
    }

    @Synchronized
    fun reload(context: Context) {
        val factories = factoryPacks ?: loadFactoryCatalog(context).also { factoryPacks = it }
        removedFactoryIds = FactoryPackRemovals(context.filesDir).read()
        loaded = false
        Engine.clear()
        importedIds.clear()
        layoutCache.clear()
        englishDictionaries.clear()
        factories.values.filterNot { it.info.id in removedFactoryIds }.forEach { factory ->
            Engine.loadPack(context.assets.open(factory.path).use { it.readBytes() })
        }
        importDir(context).listFiles { f -> f.extension == "json" }?.sortedBy { it.name }?.forEach { file ->
            try {
                val bytes = file.readBytes()
                val info = JSONObject(Engine.loadPack(bytes))
                if (info.getString("version") == declaredVersion(bytes)) {
                    importedIds += info.getString("id")
                }
            } catch (e: Exception) {
                // A pack that no longer validates (e.g. after an engine update) is skipped, not fatal.
            }
        }
        loaded = true
    }

    private fun loadFactoryCatalog(context: Context): Map<String, FactoryPack> = buildMap {
        fun visit(dir: String) {
            for (entry in context.assets.list(dir).orEmpty().sorted()) {
                val path = "$dir/$entry"
                if (!entry.endsWith(".json")) {
                    visit(path)
                } else {
                    val info = JsonReader(context.assets.open(path).reader(Charsets.UTF_8)).use(::readFactoryInfo)
                    put(info.id, FactoryPack(info, path))
                }
            }
        }
        visit(ASSET_DIR)
    }

    /** Read the display metadata without loading removed resources into the engine or parsing word lists. */
    private fun readFactoryInfo(reader: JsonReader): PackInfo = with(reader) {
        var resource = emptyMap<String, String>()
        var language = emptyMap<String, String>()
        var layoutName: String? = null
        var methodName: String? = null
        fun name() = when (resource["kind"]) {
            "keyboard_layout" -> layoutName
            "input_method" -> methodName
            "dictionary" -> language["name"]?.let { "$it dictionary" }
            "transliteration" -> language["name"]?.let { "$it transliteration" }
            else -> null
        }
        beginObject()
        while (hasNext()) {
            when (nextName()) {
                "resource" -> resource = readStringFields(setOf("id", "kind", "version"))
                "language" -> if (peek() == JsonToken.BEGIN_OBJECT) {
                    language = readStringFields(setOf("tag", "name"))
                } else {
                    skipValue()
                }
                "layout" -> layoutName = readStringFields(setOf("name"))["name"]
                "input_method" -> methodName = readStringFields(setOf("name"))["name"]
                else -> skipValue()
            }
            if (name() != null && language.isNotEmpty()) break
        }
        PackInfo(
            id = resource.getValue("id"), kind = resource.getValue("kind"),
            version = resource.getValue("version"), name = checkNotNull(name()),
            language = language["tag"], imported = false
        )
    }

    private fun JsonReader.readStringFields(keys: Set<String>): Map<String, String> = buildMap {
        beginObject()
        while (hasNext()) {
            val field = nextName()
            if (field in keys && peek() == JsonToken.STRING) put(field, nextString()) else skipValue()
        }
        endObject()
    }

    private fun declaredVersion(bytes: ByteArray): String? = runCatching {
        JsonReader(bytes.inputStream().reader(Charsets.UTF_8)).use { reader ->
            reader.beginObject()
            while (reader.hasNext()) {
                if (reader.nextName() == "resource") {
                    return@use reader.readStringFields(setOf("version"))["version"]
                }
                reader.skipValue()
            }
            null
        }
    }.getOrNull()

    private fun importDir(context: Context) = File(context.filesDir, "packs").apply { mkdirs() }

    /** Validates a pack file and, only if it is valid, keeps a copy and loads it. */
    @Synchronized
    fun import(context: Context, uri: Uri): Result<PackInfo> = runCatching {
        ensureLoaded(context)
        val bytes = context.contentResolver.openInputStream(uri)?.use { input ->
            val output = ByteArrayOutputStream()
            val buffer = ByteArray(8192)
            while (true) {
                val count = input.read(buffer)
                if (count < 0) break
                require(output.size() + count <= MAX_PACK_BYTES) { "File is too large for a pack" }
                output.write(buffer, 0, count)
            }
            output.toByteArray()
        } ?: throw IllegalArgumentException("Couldn't read the file")

        val declaredVersion = declaredVersion(bytes)
        val info = parseInfo(JSONObject(Engine.loadPack(bytes)))
        require(declaredVersion == null || info.version == declaredVersion) {
            "A newer version (${info.version}) of ${info.name} is already installed"
        }

        val dir = importDir(context)
        val tmp = File(dir, "${info.id}.json.tmp")
        try {
            tmp.writeBytes(bytes)
            check(tmp.renameTo(File(dir, "${info.id}.json"))) { "Couldn't save the pack" }
        } catch (e: Exception) {
            tmp.delete()
            reload(context)
            throw e
        }
        importedIds += info.id
        layoutCache.remove(info.id)
        englishDictionaries.remove(info.id)
        info.copy(imported = true)
    }

    @Synchronized
    fun remove(context: Context, id: String): Result<Unit> = runCatching {
        ensureLoaded(context)
        val installed = packs().firstOrNull { it.id == id } ?: error("Resource is not installed")
        if (installed.imported) {
            val file = File(importDir(context), "$id.json")
            check(file.delete()) { "Couldn't remove this resource" }
            reload(context)
        } else {
            removeFactory(context, id).getOrThrow()
        }
    }

    @Synchronized
    fun removeFactory(context: Context, id: String): Result<Unit> = runCatching {
        ensureLoaded(context)
        require(id in factoryPacks.orEmpty()) { "Resource isn't included in this version" }
        FactoryPackRemovals(context.filesDir).remove(id)
        reload(context)
    }

    @Synchronized
    fun restoreFactory(context: Context, id: String): Result<Unit> = runCatching {
        ensureLoaded(context)
        require(id in factoryPacks.orEmpty()) { "Resource isn't included in this version" }
        FactoryPackRemovals(context.filesDir).restore(id)
        reload(context)
    }

    @Synchronized
    fun removedFactoryPacks(): List<PackInfo> = factoryPacks.orEmpty().values
        .filter { it.info.id in removedFactoryIds }.map { it.info }

    @Synchronized
    fun shadowedFactoryPacks(): List<PackInfo> = factoryPacks.orEmpty().values
        .filter { it.info.id in importedIds && it.info.id !in removedFactoryIds }.map { it.info }

    @Synchronized
    internal fun englishDictionary(context: Context, id: String): EnglishDictionary? {
        ensureLoaded(context)
        return englishDictionaries.getOrPut(id) {
            val json = Engine.packJson(id) ?: return null
            val words = JSONObject(json).optJSONObject("dictionary")?.optJSONObject("words") ?: return null
            EnglishDictionary(words.keys().asSequence().associateWith { words.getInt(it) })
        }
    }

    @Synchronized
    fun hasEnabledFactoryCopy(id: String): Boolean = id in factoryPacks.orEmpty() && id !in removedFactoryIds

    @Synchronized
    fun packs(): List<PackInfo> {
        val array = JSONArray(Engine.listPacks())
        return (0 until array.length()).map { parseInfo(array.getJSONObject(it)) }
    }

    /** Input methods whose required layout and phonetic rules are installed. Word lists are optional. */
    @Synchronized
    fun inputMethods(): List<InputMethodInfo> {
        val installed = packs()
        val kinds = installed.associate { it.id to it.kind }
        return installed.filter { it.kind == "input_method" }.mapNotNull { info ->
            val json = Engine.packJson(info.id) ?: return@mapNotNull null
            val im = JSONObject(json).getJSONObject("input_method")
            InputMethodInfo(
                id = info.id,
                name = im.getString("name"),
                shortLabel = im.str("short_label") ?: im.getString("name").take(2),
                layoutId = im.getString("layout"),
                transliterationId = im.str("transliteration"),
                language = info.language,
                dictionaryId = im.str("dictionary")
            ).takeIf { hasTypingResources(it, kinds) }?.let {
                val layout = layout(it.layoutId) ?: return@mapNotNull null
                it.copy(direct = layout.input == LayoutInput.DIRECT)
            }
        }
    }

    /** Installed, usable methods, or the independent English keyboard when none are usable. */
    @Synchronized
    fun typingMethods(): List<InputMethodInfo> = withTypingFallback(inputMethods())

    @Synchronized
    fun installedUses(id: String): List<PackInfo> = packs().filter { it.kind == "input_method" && id in it.dependencies }

    @Synchronized
    fun layout(id: String): KeyboardLayout? = layoutCache.getOrPut(id) {
        if (id == BasicEnglish.LAYOUT_ID) return BasicEnglish.layout
        val json = Engine.packJson(id) ?: return null
        KeyboardLayout.fromPackJson(id, JSONObject(json))
    }

    private fun parseInfo(o: JSONObject) = PackInfo(
        id = o.getString("id"),
        kind = o.getString("kind"),
        version = o.getString("version"),
        name = o.getString("name"),
        language = o.str("language"),
        imported = o.getString("id") in importedIds,
        dependencies = o.optJSONArray("dependencies")?.let { array ->
            (0 until array.length()).map { array.getString(it) }
        }.orEmpty()
    )
}

/** org.json returns "null" from optString for JSON nulls; this returns a real null. */
internal fun JSONObject.str(name: String): String? =
    if (isNull(name)) null else optString(name).ifEmpty { null }
