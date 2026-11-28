package `in`.unsigned.keyboard

/** The Rust engine. Packs are validated there, so every platform accepts the same files. */
object Engine {
    init {
        System.loadLibrary("transliterator")
    }

    /** Validates and loads a pack; returns its info as JSON. Throws IllegalArgumentException. */
    external fun loadPack(bytes: ByteArray): String

    external fun clear()

    external fun listPacks(): String

    external fun packJson(id: String): String?

    external fun missingDependencies(id: String): String

    external fun transliterate(transliterationId: String, input: String): String

    external fun inputAlphabet(transliterationId: String): String

    /** Ranked candidates as a JSON array of {text, kind}; the first is what space commits. */
    external fun candidates(inputMethodId: String, input: String, limit: Int): String
}
