package `in`.unsigned.keyboard

data class TransliterationResult(
    val transliterated: String,
    val consumed: Int,
    val remaining: String
)

class Transliterator {

    private val consonants = mapOf(
        "ক" to listOf("k", "K"),
        "খ" to listOf("kh", "kH", "Kh", "KH"),
        "গ" to listOf("g", "G"),
        "ঘ" to listOf("gh", "gH", "Gh", "GH"),
        "ঙ" to listOf("ng", "Ng", "NG", "nG"),
        "চ" to listOf("s", "c"),
        "ছ" to listOf("S", "ss", "Ss", "SS", "cc", "Cc", "CC"),
        "জ" to listOf("j", "z"),
        "ঝ" to listOf("jh", "jH", "Jh", "JH"),
        "ঞ" to listOf("yy", "Y"),
        "ট" to listOf("T"),
        "ঠ" to listOf("Th"),
        "ড" to listOf("D"),
        "ঢ" to listOf("Dh"),
        "ণ" to listOf("N"),
        "ত" to listOf("t"),
        "থ" to listOf("th"),
        "দ" to listOf("d"),
        "ধ" to listOf("dh"),
        "ন" to listOf("n"),
        "প" to listOf("p", "P"),
        "ফ" to listOf("f", "F", "ph", "pH", "Ph", "PH"),
        "ব" to listOf("b", "B"),
        "ভ" to listOf("v", "V", "bh", "bH", "Bh", "BH"),
        "ম" to listOf("m", "M"),
        "য" to listOf("J", "jj", "JJ", "Jj", "Z", "zz", "ZZ", "Zz"),
        "ৰ" to listOf("r"),
        "ল" to listOf("l", "L"),
        "ৱ" to listOf("w", "W"),
        "স" to listOf("x", "X"),
        "শ" to listOf("xx", "Xx", "xX", "XX"),
        "ষ" to listOf("xxx", "XxX", "xXX", "XXX", "xxX", "xXx", "Xxx"),
        "হ" to listOf("h", "H"),
        "ড়" to listOf("rr", "R", "RR", "rR", "Rr"),
        "ঢ়" to listOf("rh", "Rh", "rH", "RH"),
        "য়" to listOf("y"),
        "ক্ষ" to listOf("khyy")
    )

    private val vowels = mapOf(
        "অ" to listOf("o"),
        "আ" to listOf("a"),
        "ই" to listOf("i"),
        "ঈ" to listOf("ii"),
        "উ" to listOf("u"),
        "ঊ" to listOf("uu", "U"),
        "ঋ" to listOf("riii"),
        "এ" to listOf("e"),
        "ঐ" to listOf("oi"),
        "ও" to listOf("uuu", "oo", "O"),
        "ঔ" to listOf("ou")
    )

    private val vowelMarks = mapOf(
        "" to listOf("o"),
        "া" to listOf("a"),
        "ি" to listOf("i"),
        "ী" to listOf("ii"),
        "ু" to listOf("u"),
        "ূ" to listOf("uu", "U"),
        "ৃ" to listOf("riii"),
        "ে" to listOf("e"),
        "ৈ" to listOf("oi"),
        "ো" to listOf("uuu", "oo", "O"),
        "ৌ" to listOf("ou")
    )

    private val specialChar = mapOf(
        "ং" to listOf("ngg", "Ngg", "nGg", "NGg", "ngG", "NgG", "nGG", "NGG"),
        "ঃ" to listOf("hh", "HH", "hH", "Hh"),
        "ঁ" to listOf("*"),
        "ৎ" to listOf("t", "T"),
        "।" to listOf("|")
    )

    private val digits = mapOf(
        "০" to listOf("0"),
        "১" to listOf("1"),
        "২" to listOf("2"),
        "৩" to listOf("3"),
        "৪" to listOf("4"),
        "৫" to listOf("5"),
        "৬" to listOf("6"),
        "৭" to listOf("7"),
        "৮" to listOf("8"),
        "৯" to listOf("9")
    )

    private val specialCombinations = mapOf(
        "gyy" to "জ্ঞ",
        "jyy" to "হ্য",
        "khm" to "ক্ষ্ম"
    )

    private val explicitHolonto = "্"

    fun transliterate(input: String): String {
        var output = ""
        var i = 0
        var previousCharWasConsonant = false
        var skipNextCombination = false

        while (i < input.length) {
            val result = processNextCharacter(input, i, previousCharWasConsonant, skipNextCombination)
            output += result.output
            i = result.newIndex
            previousCharWasConsonant = result.previousCharWasConsonant
            skipNextCombination = result.skipNextCombination
        }

        return output
    }

    fun transliterateBuffer(input: String): TransliterationResult {
        val transliterated = transliterate(input)
        return TransliterationResult(transliterated, input.length, "")
    }

    private data class ProcessResult(
        val output: String,
        val newIndex: Int,
        val previousCharWasConsonant: Boolean,
        val skipNextCombination: Boolean
    )

    private fun processNextCharacter(
        input: String,
        index: Int,
        previousCharWasConsonant: Boolean,
        skipNextCombination: Boolean
    ): ProcessResult {

        if (input[index] == '.') {
            if (index + 1 < input.length && input[index + 1] == '.') {
                return ProcessResult(explicitHolonto, index + 2, false, false)
            }
            return ProcessResult("", index + 1, previousCharWasConsonant, true)
        }

        // Check special combinations
        for ((combo, result) in specialCombinations) {
            if (input.substring(index).startsWith(combo)) {
                return ProcessResult(result, index + combo.length, true, false)
            }
        }

        val longestMatch = findLongestMatch(input, index, skipNextCombination)

        if (longestMatch != null) {
            return processMatch(longestMatch.matchedChar, longestMatch.category,
                previousCharWasConsonant, skipNextCombination, longestMatch.match.length, index)
        }

        return ProcessResult(input[index].toString(), index + 1, false, false)
    }

    private data class MatchResult(
        val match: String,
        val matchedChar: String,
        val category: String
    )

    private fun findLongestMatch(input: String, index: Int, skipNextCombination: Boolean): MatchResult? {
        var longestMatch: MatchResult? = null
        val substring = input.substring(index)

        // Check consonants
        for ((assamese, romanizations) in consonants) {
            for (romanization in romanizations) {
                if (substring.startsWith(romanization) &&
                    (!skipNextCombination || romanization.length == 1) &&
                    (longestMatch == null || romanization.length > longestMatch.match.length)) {
                    longestMatch = MatchResult(romanization, assamese, "consonants")
                }
            }
        }

        // Check vowels
        for ((assamese, romanizations) in vowels) {
            for (romanization in romanizations) {
                if (substring.startsWith(romanization) &&
                    (!skipNextCombination || romanization.length == 1) &&
                    (longestMatch == null || romanization.length > longestMatch.match.length)) {
                    longestMatch = MatchResult(romanization, assamese, "vowels")
                }
            }
        }

        // Check special characters
        for ((assamese, romanizations) in specialChar) {
            for (romanization in romanizations) {
                if (substring.startsWith(romanization) &&
                    (!skipNextCombination || romanization.length == 1) &&
                    (longestMatch == null || romanization.length > longestMatch.match.length)) {
                    longestMatch = MatchResult(romanization, assamese, "specialChar")
                }
            }
        }

        // Check digits
        for ((assamese, romanizations) in digits) {
            for (romanization in romanizations) {
                if (substring.startsWith(romanization) &&
                    (!skipNextCombination || romanization.length == 1) &&
                    (longestMatch == null || romanization.length > longestMatch.match.length)) {
                    longestMatch = MatchResult(romanization, assamese, "digits")
                }
            }
        }

        return longestMatch
    }

    private fun processMatch(
        matchedChar: String,
        category: String,
        previousCharWasConsonant: Boolean,
        skipNextCombination: Boolean,
        matchLength: Int,
        index: Int
    ): ProcessResult {
        var output = ""
        var newPreviousCharWasConsonant = false

        // Debug logging
        println("DEBUG: matchedChar=$matchedChar, category=$category, previousCharWasConsonant=$previousCharWasConsonant")

        when (category) {
            "consonants" -> {
                if (previousCharWasConsonant && !skipNextCombination) {
                    output += explicitHolonto
                }
                output += matchedChar
                newPreviousCharWasConsonant = true
                println("DEBUG: consonant output=$output")
            }
            "vowels" -> {
                if (previousCharWasConsonant && !skipNextCombination) {
                    // We need to find the vowel mark for this vowel
                    // The matchedChar is the full vowel (like "ই"), we need the mark (like "ি")
                    val vowelMark = when (matchedChar) {
                        "আ" -> "া"
                        "ই" -> "ি"
                        "ঈ" -> "ী"
                        "উ" -> "ু"
                        "ঊ" -> "ূ"
                        "ঋ" -> "ৃ"
                        "এ" -> "ে"
                        "ঐ" -> "ৈ"
                        "ও" -> "ো"
                        "ঔ" -> "ৌ"
                        "অ" -> "" // No mark for 'o' sound
                        else -> matchedChar
                    }
                    output += vowelMark
                    println("DEBUG: vowel $matchedChar -> mark '$vowelMark', output=$output")
                } else {
                    output += matchedChar
                    println("DEBUG: standalone vowel output=$output")
                }
            }
            else -> {
                output += matchedChar
            }
        }

        return ProcessResult(output, index + matchLength, newPreviousCharWasConsonant, false)
    }
}