package `in`.unsigned.keyboard

import java.util.Locale

internal enum class Spelling { NEUTRAL, IN_DICTIONARY, TYPO }
internal data class SpellResult(val status: Spelling, val suggestions: List<String> = emptyList())

internal fun isEnglishSpellLocale(locale: String): Boolean =
    locale.substringBefore('-').substringBefore('_').equals("en", ignoreCase = true)

internal fun acceptsEnglishComposition(text: String, hasComposition: Boolean): Boolean =
    text.isNotEmpty() && text.all { it.isAsciiLetter() || it == '\'' || it == '’' } &&
        (hasComposition || text.first().isAsciiLetter())

private fun Char.isAsciiLetter(): Boolean = this in 'A'..'Z' || this in 'a'..'z'

/** A local, immutable lexicon. Queries never change the word list or record what was typed. */
internal class EnglishDictionary(private val weights: Map<String, Int>) {
    private val sorted by lazy { weights.keys.sorted() }
    private val rank = compareByDescending<String> { weights.getValue(it) }.thenBy { it }

    /** The raw input is first and remains the editor's text unless a suggestion is tapped. */
    fun compose(typed: String, limit: Int): List<String> {
        if (limit <= 0 || typed.isEmpty()) return emptyList()
        val prefix = normalize(typed)
        if (prefix.length !in 2..MAX_WORD_LENGTH || limit == 1) return listOf(typed)
        val start = sorted.binarySearch(prefix).let { if (it < 0) -it - 1 else it }
        val completions = sorted.subList(start, sorted.size).asSequence().takeWhile { it.startsWith(prefix) }
            .filter { it != prefix }.sortedWith(rank).take(limit - 1).toList()
        val corrections = if (prefix.length >= 3 && prefix !in weights && completions.size < limit - 1) {
            corrections(prefix, limit - 1, completions.toSet())
        } else emptyList()
        return listOf(typed) + (completions + corrections).take(limit - 1).map { matchCaseAndApostrophe(it, typed) }
    }

    fun spell(text: String, locale: String, limit: Int): SpellResult {
        if (!isEnglishSpellLocale(locale) ||
            text.length !in 1..MAX_WORD_LENGTH || !acceptsEnglishComposition(text, hasComposition = false)
        ) return SpellResult(Spelling.NEUTRAL)
        val word = normalize(text)
        if (!ENGLISH_WORD.matches(word)) return SpellResult(Spelling.NEUTRAL)
        if (word in weights) return SpellResult(Spelling.IN_DICTIONARY)
        if (word.length < 3) return SpellResult(Spelling.NEUTRAL)
        val maxSuggestions = limit.coerceIn(0, 8)
        val matches = corrections(word, maxSuggestions.coerceAtLeast(1))
        if (matches.isEmpty()) return SpellResult(Spelling.NEUTRAL)
        return SpellResult(Spelling.TYPO, matches.take(maxSuggestions).map { matchCaseAndApostrophe(it, text) })
    }

    /** One insertion, deletion, substitution, or adjacent transposition. Never autocorrects. */
    private fun corrections(word: String, limit: Int, exclude: Set<String> = emptySet()): List<String> {
        val found = mutableSetOf<String>()
        fun takeIfKnown(candidate: String) {
            if (candidate != word && candidate in weights && candidate !in exclude) found.add(candidate)
        }
        for (i in word.indices) {
            val before = word.substring(0, i)
            val after = word.substring(i + 1)
            takeIfKnown(before + after)
            for (c in EDIT_ALPHABET) takeIfKnown(before + c + after)
            if (i + 1 < word.length) takeIfKnown(before + word[i + 1] + word[i] + word.substring(i + 2))
        }
        for (i in 0..word.length) {
            val before = word.substring(0, i)
            val after = word.substring(i)
            for (c in EDIT_ALPHABET) takeIfKnown(before + c + after)
        }
        return found.sortedWith(rank).take(limit)
    }

    private fun normalize(text: String): String = text.lowercase(Locale.ROOT).replace('’', '\'')

    private fun matchCaseAndApostrophe(word: String, typed: String): String {
        val caseMatched = when {
            typed.count { it.isAsciiLetter() } > 1 && typed.none { it in 'a'..'z' } -> word.uppercase(Locale.ROOT)
            typed.firstOrNull() in 'A'..'Z' -> word.replaceFirstChar { it.uppercaseChar() }
            else -> word
        }
        return if ('’' in typed) caseMatched.replace('\'', '’') else caseMatched
    }

    private companion object {
        const val MAX_WORD_LENGTH = 32
        const val EDIT_ALPHABET = "abcdefghijklmnopqrstuvwxyz'"
        val ENGLISH_WORD = Regex("[a-z]+(?:'[a-z]+)*")
    }
}
