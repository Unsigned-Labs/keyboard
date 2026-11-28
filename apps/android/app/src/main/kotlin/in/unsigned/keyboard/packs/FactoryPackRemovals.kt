package `in`.unsigned.keyboard.packs

import java.io.File

/** One marker per removed factory resource. Imports are stored separately. */
internal class FactoryPackRemovals(filesDir: File) {
    private val directory = File(filesDir, "removed-factory-packs")

    fun read(): Set<String> = directory.listFiles().orEmpty()
        .filter { it.isFile && isSafeId(it.name) }
        .mapTo(mutableSetOf()) { it.name }

    fun isRemoved(id: String): Boolean = marker(id).isFile

    fun remove(id: String) {
        val marker = marker(id)
        check(directory.isDirectory || directory.mkdirs()) { "Couldn't save the removal" }
        check(marker.createNewFile() || marker.isFile) { "Couldn't save the removal" }
    }

    fun restore(id: String) {
        val marker = marker(id)
        check(!marker.exists() || marker.delete()) { "Couldn't restore this resource" }
    }

    private fun marker(id: String): File {
        require(isSafeId(id))
        return File(directory, id)
    }

    private companion object {
        val ID = Regex("[a-zA-Z0-9_.-]+")
        fun isSafeId(id: String): Boolean = id != "." && id != ".." && ID.matches(id)
    }
}
