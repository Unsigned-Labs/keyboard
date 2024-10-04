package `in`.unsigned.keyboard

class Transliterator(private val schema: AssameseSchema) {
    fun transliterate(input: String): String {
        var output = ""
        var i = 0
        var previousCharWasConsonant = false
        var skipNextCombination = false
        var inBackticks = false

        while (i < input.length) {
            val result = processNextCharacter(
                input,
                i,
                previousCharWasConsonant,
                skipNextCombination,
                inBackticks
            )
            output += result.output
            i = result.newIndex
            previousCharWasConsonant = result.previousCharWasConsonant
            skipNextCombination = result.skipNextCombination
            inBackticks = result.inBackticks
        }

        return output
    }

    private fun processNextCharacter(
        input: String,
        index: Int,
        previousCharWasConsonant: Boolean,
        skipNextCombination: Boolean,
        inBackticks: Boolean
    ): CharacterResult {
        val backtickResult = handleBackticks(input, index)
        if (backtickResult != null) {
            return backtickResult.copy(
                inBackticks = if (backtickResult.output.isEmpty()) !inBackticks else inBackticks
            )
        }

        if (inBackticks) {
            return CharacterResult(
                input[index].toString(),
                index + 1,
                previousCharWasConsonant,
                skipNextCombination,
                inBackticks
            )
        }

        if (input[index] == '.') {
            if (index + 1 < input.length && input[index + 1] == '.') {
                return CharacterResult(
                    schema.exceptions.explicitHolonto,
                    index + 2,
                    false,
                    false,
                    inBackticks
                )
            }
            return CharacterResult(
                "",
                index + 1,
                previousCharWasConsonant,
                true,
                inBackticks
            )
        }

        for ((combo, result) in schema.exceptions.specialCombinations) {
            if (input.startsWith(combo, index)) {
                return CharacterResult(
                    result,
                    index + combo.length,
                    true,
                    false,
                    false
                )
            }
        }

        return handleRegularTransliteration(
            input,
            index,
            previousCharWasConsonant,
            skipNextCombination
        )
    }

    private fun handleBackticks(
        input: String,
        index: Int
    ): CharacterResult? {
        if (index + 1 < input.length && input[index] == '\\' && input[index + 1] == '`') {
            return CharacterResult(
                "`",
                index + 2,
                false,
                false,
                false
            )
        }

        if (input[index] == '`') {
            return CharacterResult(
                "",
                index + 1,
                false,
                false,
                false
            )
        }

        return null
    }

    private fun handleRegularTransliteration(
        input: String,
        index: Int,
        previousCharWasConsonant: Boolean,
        skipNextCombination: Boolean
    ): CharacterResult {
        val (longestMatch, matchedChar, matchedCategory) = findLongestMatch(
            input,
            index,
            skipNextCombination
        )

        if (longestMatch.isNotEmpty()) {
            return processMatch(
                input,
                index,
                matchedChar,
                matchedCategory,
                previousCharWasConsonant,
                skipNextCombination,
                longestMatch
            )
        }

        return CharacterResult(
            input[index].toString(),
            index + 1,
            false,
            false,
            false
        )
    }

    private fun findLongestMatch(
        input: String,
        index: Int,
        skipNextCombination: Boolean
    ): MatchResult {
        var longestMatch = ""
        var matchedChar = ""
        var matchedCategory: String? = null

        for (category in listOf("consonants", "vowels", "vowelMarks", "specialChar", "digits")) {
            for ((assamese, romanizations) in schema.getCategory(category)) {
                for (romanization in romanizations) {
                    if (input.startsWith(romanization, index) &&
                        romanization.length > longestMatch.length &&
                        (!skipNextCombination || romanization.length == 1)
                    ) {
                        longestMatch = romanization
                        matchedChar = assamese
                        matchedCategory = category
                    }
                }
            }
        }

        return MatchResult(longestMatch, matchedChar, matchedCategory)
    }

    private fun processMatch(
        input: String,
        index: Int,
        matchedChar: String,
        matchedCategory: String?,
        previousCharWasConsonant: Boolean,
        skipNextCombination: Boolean,
        longestMatch: String
    ): CharacterResult {
        var output = ""
        var newPreviousCharWasConsonant = false

        when (matchedCategory) {
            "consonants" -> {
                if (previousCharWasConsonant && !skipNextCombination) {
                    output += schema.exceptions.explicitHolonto
                }

                val nextChar = findNextConsonant(input, index + longestMatch.length)
                if (nextChar != null && schema.exceptions.joinedConsonantsBefore.containsKey(matchedChar)) {
                    output += schema.exceptions.joinedConsonantsBefore[matchedChar]
                } else {
                    output += matchedChar
                }

                newPreviousCharWasConsonant = true
            }
            "vowels" -> {
                if (previousCharWasConsonant && !skipNextCombination) {
                    val vowelMarker = schema.vowelMarks.entries.find { (_, markers) ->
                        markers.contains(schema.vowels[matchedChar]?.get(0))
                    }
                    if (vowelMarker != null) {
                        output += vowelMarker.key
                    } else {
                        output += matchedChar
                    }
                } else {
                    output += matchedChar
                }
            }
            else -> output += matchedChar
        }

        if (previousCharWasConsonant && schema.exceptions.joinedConsonantsAfter.containsKey(longestMatch)) {
            output = schema.exceptions.explicitHolonto +
                    schema.exceptions.joinedConsonantsAfter[longestMatch]!!
            newPreviousCharWasConsonant = true
        }

        return CharacterResult(
            output,
            index + longestMatch.length,
            newPreviousCharWasConsonant,
            false,
            false
        )
    }

    private fun findNextConsonant(
        input: String,
        startIndex: Int
    ): String? {
        for (i in startIndex until input.length) {
            val (_, matchedChar, matchedCategory) = findLongestMatch(input, i, false)
            if (matchedCategory == "consonants") {
                return matchedChar
            }
            if (matchedCategory != null) {
                break
            }
        }
        return null
    }

    private data class CharacterResult(
        val output: String,
        val newIndex: Int,
        val previousCharWasConsonant: Boolean,
        val skipNextCombination: Boolean,
        val inBackticks: Boolean
    )

    private data class MatchResult(
        val longestMatch: String,
        val matchedChar: String,
        val matchedCategory: String?
    )
}

class AssameseSchema {
    val consonants: Map<String, List<String>> = mapOf(
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

    val vowels: Map<String, List<String>> = mapOf(
        "অ" to listOf ("o"),
        "আ" to listOf ("a"),
        "ই" to listOf ("i"),
        "ঈ" to listOf ("ii"),
        "উ" to listOf ("u"),
        "ঊ" to listOf ("uu", "U"),
        "ঋ" to listOf ("riii"),
        "এ" to listOf ("e"),
        "ঐ" to listOf ("oi"),
        "ও" to listOf ("uuu", "oo", "O"),
        "ঔ" to listOf ("ou")
    )

    val vowelMarks: Map<String, List<String>> = mapOf(
        "" to listOf("o"),
        "া" to listOf("a"),
        "ি" to listOf ("i"),
        "ী" to listOf ("ii"),
        "ু" to listOf ("u"),
        "ূ" to listOf ("uu", "U"),
        "ৃ" to listOf ("riii"),
        "ে" to listOf ("e"),
        "ৈ" to listOf ("oi"),
        "ো" to listOf ("uuu", "oo", "O"),
        "ৌ" to listOf ("ou")
    )

    val specialChar: Map<String, List<String>> = mapOf(
        "ং" to listOf ("ngg", "Ngg", "nGg", "NGg", "ngG", "NgG", "nGG", "NGG"),
        "ঃ" to listOf ("hh", "HH", "hH", "Hh"),
        "ঁ" to listOf ("*"),
        "ৎ" to listOf ("t", "T"),
        "।" to listOf ("|"),
    )

    val digits: Map<String, List<String>> = mapOf(
        "০" to listOf ("0"),
        "১" to listOf ("1"),
        "২" to listOf ("2"),
        "৩" to listOf ("3"),
        "৪" to listOf ("4"),
        "৫" to listOf ("5"),
        "৬" to listOf ("6"),
        "৭" to listOf ("7"),
        "৮" to listOf ("8"),
        "৯" to listOf ("9")
    )

    val exceptions = Exceptions()

    fun getCategory(category: String): Map<String, List<String>> {
        return when (category) {
            "consonants" -> consonants
            "vowels" -> vowels
            "vowelMarks" -> vowelMarks
            "specialChar" -> specialChar
            "digits" -> digits
            else -> emptyMap()
        }
    }

    class Exceptions {
        val specialCombinations: Map<String, String> = mapOf(
            "gyy" to "জ্ঞ",
            "jyy" to "হ্য",
            "khm" to "ক্ষ্ম"
        )

        val joinedConsonantsBefore: Map<String, String> = mapOf(
            "চ" to "স"
        )

        val joinedConsonantsAfter: Map<String, String> = mapOf(
            "w" to "ব",
            "y" to "য"
        )

        val explicitHolonto: String = "্"
    }
}