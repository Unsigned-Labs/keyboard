//! Word lookups for ranking and completing candidates.

use unsigned_resource_format::DictionaryModule;

/// Words sorted by text, so prefix queries are a binary search away.
pub struct Dictionary {
    words: Vec<(String, u64)>,
}

impl Dictionary {
    pub fn new(module: &DictionaryModule) -> Self {
        Self::from_words(module.dictionary.words.iter().map(|(w, c)| (w.clone(), *c)))
    }

    pub fn from_words(words: impl IntoIterator<Item = (String, u64)>) -> Self {
        let mut words: Vec<(String, u64)> = words.into_iter().collect();
        words.sort_unstable_by(|a, b| a.0.cmp(&b.0));
        words.dedup_by(|a, b| a.0 == b.0);
        Self { words }
    }

    pub fn len(&self) -> usize {
        self.words.len()
    }

    pub fn is_empty(&self) -> bool {
        self.words.is_empty()
    }

    fn lower_bound(&self, prefix: &str) -> usize {
        self.words.partition_point(|(w, _)| w.as_str() < prefix)
    }

    pub fn count(&self, word: &str) -> Option<u64> {
        let i = self.lower_bound(word);
        self.words
            .get(i)
            .filter(|(w, _)| w == word)
            .map(|(_, c)| *c)
    }

    /// True if some word starts with `prefix` (or equals it).
    pub fn has_prefix(&self, prefix: &str) -> bool {
        self.words
            .get(self.lower_bound(prefix))
            .is_some_and(|(w, _)| w.starts_with(prefix))
    }

    /// The most frequent words longer than `prefix` that start with it.
    pub fn completions(&self, prefix: &str, limit: usize) -> Vec<(&str, u64)> {
        const MAX_SCAN: usize = 20_000;
        let mut found: Vec<(&str, u64)> = self.words[self.lower_bound(prefix)..]
            .iter()
            .take(MAX_SCAN)
            .take_while(|(w, _)| w.starts_with(prefix))
            .filter(|(w, _)| w.len() > prefix.len())
            .map(|(w, c)| (w.as_str(), *c))
            .collect();
        found.sort_unstable_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(b.0)));
        found.truncate(limit);
        found
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn looks_up_words_prefixes_and_completions() {
        let d = Dictionary::from_words([
            ("কথা".to_string(), 50),
            ("কথাটো".to_string(), 5),
            ("কথাবোৰ".to_string(), 9),
            ("কম".to_string(), 20),
        ]);
        assert_eq!(d.count("কথা"), Some(50));
        assert_eq!(d.count("কথ"), None);
        assert!(d.has_prefix("কথ"));
        assert!(!d.has_prefix("খ"));
        let c: Vec<&str> = d.completions("কথা", 5).into_iter().map(|(w, _)| w).collect();
        assert_eq!(c, ["কথাবোৰ", "কথাটো"]);
    }
}
