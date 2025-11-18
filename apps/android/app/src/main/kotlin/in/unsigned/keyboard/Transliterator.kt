package `in`.unsigned.keyboard

object Transliterator {
    init {
        System.loadLibrary("transliterator")
    }

    /**
     * Transliterate text from English to the specified Indian language
     * @param input The English text to transliterate
     * @param language The target language (hindi, assamese, bangla)
     * @return Transliterated text
     */
    external fun transliterate(input: String, language: String): String

    /**
     * Get list of available languages
     * @return Comma-separated list of language codes
     */
    external fun getAvailableLanguages(): String
}
