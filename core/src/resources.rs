//! Loading language packs into the engine.

use std::collections::HashMap;

use crate::Transliterator;

pub use unsigned_resource_format::{
    compare_versions, EngineCompatibility, InputMethodModule, KeyboardLayoutModule,
    LanguageIdentity, Pack, PackInfo, ResourceError, ResourceKind, ResourceMetadata,
    TransliterationModule, RESOURCE_FORMAT_VERSION, TRANSLITERATION_ENGINE_ABI,
};

/// Load one transliteration pack into a ready-to-use transliterator.
pub fn load_transliteration_module(bytes: &[u8]) -> Result<Transliterator, ResourceError> {
    let module = TransliterationModule::from_json_slice(bytes)?;
    Ok(Transliterator::new(module.schema))
}

/// The packs an app has loaded, by resource id. Loading a pack whose id is already present replaces
/// it only if the new version is the same or newer, so an older imported copy can't shadow a newer
/// bundled one by accident.
#[derive(Default)]
pub struct PackStore {
    packs: HashMap<String, Pack>,
    transliterators: HashMap<String, Transliterator>,
}

impl PackStore {
    pub fn new() -> Self {
        Self::default()
    }

    /// Validate and add a pack. Returns its info, or why it was rejected.
    pub fn load(&mut self, bytes: &[u8]) -> Result<PackInfo, ResourceError> {
        let pack = Pack::from_json_slice(bytes)?;
        let info = pack.info();
        if let Some(existing) = self.packs.get(&info.id) {
            if compare_versions(&existing.resource().version, &info.version).is_gt() {
                return Ok(existing.info());
            }
        }
        if let Pack::Transliteration(module) = &pack {
            self.transliterators
                .insert(info.id.clone(), Transliterator::new(module.schema.clone()));
        }
        self.packs.insert(info.id.clone(), pack);
        Ok(info)
    }

    pub fn remove(&mut self, id: &str) {
        self.packs.remove(id);
        self.transliterators.remove(id);
    }

    pub fn get(&self, id: &str) -> Option<&Pack> {
        self.packs.get(id)
    }

    pub fn list(&self) -> Vec<PackInfo> {
        let mut all: Vec<PackInfo> = self.packs.values().map(Pack::info).collect();
        all.sort_by(|a, b| a.id.cmp(&b.id));
        all
    }

    /// Ids an input method needs that aren't loaded.
    pub fn missing_dependencies(&self, input_method_id: &str) -> Vec<String> {
        match self.packs.get(input_method_id) {
            Some(Pack::InputMethod(m)) => m
                .dependencies()
                .into_iter()
                .filter(|d| !self.packs.contains_key(*d))
                .map(String::from)
                .collect(),
            _ => vec![input_method_id.to_string()],
        }
    }

    /// Every character used in the inputs of a transliteration pack. Apps send these keys to the
    /// transliterator and type anything else directly.
    pub fn input_alphabet(&self, transliteration_id: &str) -> String {
        let Some(Pack::Transliteration(m)) = self.packs.get(transliteration_id) else {
            return String::new();
        };
        let s = &m.schema;
        let mut chars: Vec<char> = [
            &s.consonants,
            &s.vowels,
            &s.vowel_marks,
            &s.special_char,
            &s.digits,
        ]
        .into_iter()
        .flat_map(|map| map.values().flatten())
        .chain(s.exceptions.special_combinations.keys())
        .flat_map(|input| input.chars())
        .collect();
        chars.sort_unstable();
        chars.dedup();
        chars.into_iter().collect()
    }

    pub fn clear(&mut self) {
        self.packs.clear();
        self.transliterators.clear();
    }

    /// Transliterate with a loaded transliteration pack. Unknown ids return the input unchanged.
    pub fn transliterate(&self, transliteration_id: &str, input: &str) -> String {
        match self.transliterators.get(transliteration_id) {
            Some(t) => t.transliterate(input),
            None => input.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const ASSAMESE: &[u8] = include_bytes!("../../modules/languages/as/transliteration.json");

    #[test]
    fn loads_assamese_without_a_language_specific_core_api() {
        let transliterator = load_transliteration_module(ASSAMESE).unwrap();
        assert_eq!(transliterator.transliterate("nomoskar"), "নমস্কাৰ");
    }

    #[test]
    fn store_transliterates_by_pack_id_and_keeps_newest_version() {
        let mut store = PackStore::new();
        let info = store.load(ASSAMESE).unwrap();
        assert_eq!(info.id, "org.unsigned.transliteration.as");
        assert_eq!(store.transliterate(&info.id, "nomoskar"), "নমস্কাৰ");

        let older = String::from_utf8(ASSAMESE.to_vec()).unwrap().replacen(
            "\"version\": \"1.0.0\"",
            "\"version\": \"0.9.0\"",
            1,
        );
        assert_eq!(store.load(older.as_bytes()).unwrap().version, "1.0.0");

        assert_eq!(store.transliterate("missing", "abc"), "abc");
        let alphabet = store.input_alphabet(&info.id);
        assert!(alphabet.contains('k') && alphabet.contains('|') && !alphabet.contains(','));
    }

    fn json_files(dir: &std::path::Path, out: &mut Vec<std::path::PathBuf>) {
        for entry in std::fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                json_files(&path, out);
            } else if path.extension().is_some_and(|e| e == "json") {
                out.push(path);
            }
        }
    }

    #[test]
    fn every_bundled_pack_loads_and_every_input_method_is_complete() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../modules");
        let mut files = Vec::new();
        json_files(&root, &mut files);
        let mut store = PackStore::new();
        for file in &files {
            store
                .load(&std::fs::read(file).unwrap())
                .unwrap_or_else(|e| panic!("{}: {e}", file.display()));
        }
        let input_methods: Vec<_> = store
            .list()
            .into_iter()
            .filter(|p| p.kind == ResourceKind::InputMethod)
            .collect();
        assert!(input_methods.len() >= 5);
        for im in input_methods {
            assert!(store.missing_dependencies(&im.id).is_empty(), "{}", im.id);
        }
        assert!(store
            .get("org.unsigned.layout.as.native")
            .unwrap()
            .to_json()
            .contains("after_consonant"));
    }
}
