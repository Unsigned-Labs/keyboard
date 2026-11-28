use napi_derive::napi;
use transliterator::{Transliterator as RustTransliterator, TransliterationSchema, transliterate};
use std::collections::HashMap;

#[napi(object)]
pub struct JsExceptions {
    pub special_combinations: HashMap<String, String>,
    pub joined_consonants_before: HashMap<String, String>,
    pub joined_consonants_after: HashMap<String, String>,
    pub explicit_holonto: String,
}

#[napi(object)]
pub struct JsTransliterationSchema {
    pub consonants: HashMap<String, Vec<String>>,
    pub vowels: HashMap<String, Vec<String>>,
    pub vowel_marks: HashMap<String, Vec<String>>,
    pub special_char: HashMap<String, Vec<String>>,
    pub digits: HashMap<String, Vec<String>>,
    pub exceptions: JsExceptions,
}

impl From<JsTransliterationSchema> for TransliterationSchema {
    fn from(js_schema: JsTransliterationSchema) -> Self {
        TransliterationSchema {
            consonants: js_schema.consonants,
            vowels: js_schema.vowels,
            vowel_marks: js_schema.vowel_marks,
            special_char: js_schema.special_char,
            digits: js_schema.digits,
            exceptions: transliterator::Exceptions {
                special_combinations: js_schema.exceptions.special_combinations,
                joined_consonants_before: js_schema.exceptions.joined_consonants_before,
                joined_consonants_after: js_schema.exceptions.joined_consonants_after,
                explicit_holonto: js_schema.exceptions.explicit_holonto,
            },
        }
    }
}

impl From<TransliterationSchema> for JsTransliterationSchema {
    fn from(schema: TransliterationSchema) -> Self {
        JsTransliterationSchema {
            consonants: schema.consonants,
            vowels: schema.vowels,
            vowel_marks: schema.vowel_marks,
            special_char: schema.special_char,
            digits: schema.digits,
            exceptions: JsExceptions {
                special_combinations: schema.exceptions.special_combinations,
                joined_consonants_before: schema.exceptions.joined_consonants_before,
                joined_consonants_after: schema.exceptions.joined_consonants_after,
                explicit_holonto: schema.exceptions.explicit_holonto,
            },
        }
    }
}

#[napi]
pub struct Transliterator {
    inner: RustTransliterator,
}

#[napi]
impl Transliterator {
    #[napi(constructor)]
    pub fn new(schema: JsTransliterationSchema) -> Self {
        Self {
            inner: RustTransliterator::new(schema.into()),
        }
    }

    #[napi]
    pub fn transliterate(&self, input: String) -> String {
        self.inner.transliterate(&input)
    }

    #[napi]
    pub fn get_schema(&self) -> JsTransliterationSchema {
        self.inner.get_schema().clone().into()
    }

    #[napi]
    pub fn set_schema(&mut self, schema: JsTransliterationSchema) {
        self.inner.set_schema(schema.into());
    }
}

#[napi]
pub fn transliterate_text(input: String, schema: JsTransliterationSchema) -> String {
    transliterate(&input, &schema.into())
}

#[napi]
pub fn hindi_schema() -> JsTransliterationSchema {
    transliterator::hindi_schema().into()
}

#[napi]
pub fn assamese_schema() -> JsTransliterationSchema {
    transliterator::assamese_schema().into()
}

#[napi]
pub fn bangla_schema() -> JsTransliterationSchema {
    transliterator::bangla_schema().into()
}

/// Language packs loaded from JSON files.
#[napi]
pub struct PackStore {
    inner: transliterator::PackStore,
}

#[napi]
impl PackStore {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: transliterator::PackStore::new(),
        }
    }

    /// Validates and loads a pack; returns its info as JSON, or throws with the reason.
    #[napi]
    pub fn load_pack(&mut self, json: String) -> napi::Result<String> {
        self.inner
            .load(json.as_bytes())
            .map(|info| serde_json::to_string(&info).unwrap())
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    /// All loaded packs as a JSON array.
    #[napi]
    pub fn list(&self) -> String {
        serde_json::to_string(&self.inner.list()).unwrap()
    }

    #[napi]
    pub fn missing_dependencies(&self, input_method_id: String) -> String {
        serde_json::to_string(&self.inner.missing_dependencies(&input_method_id)).unwrap()
    }

    #[napi]
    pub fn pack_json(&self, id: String) -> Option<String> {
        self.inner.get(&id).map(|p| p.to_json())
    }

    #[napi]
    pub fn transliterate(&self, transliteration_id: String, input: String) -> String {
        self.inner.transliterate(&transliteration_id, &input)
    }

    /// Converts a whole text word by word, taking each word's best candidate.
    #[napi]
    pub fn convert(&self, input_method_id: String, text: String) -> String {
        self.inner.convert(&input_method_id, &text)
    }

    /// Ranked candidates as a JSON array of {text, kind}; the first is what space commits.
    #[napi]
    pub fn candidates(&self, input_method_id: String, input: String, limit: u32) -> String {
        let candidates = self
            .inner
            .candidates(&input_method_id, &input, limit.max(1) as usize);
        serde_json::to_string(&candidates).unwrap()
    }
}

impl Default for PackStore {
    fn default() -> Self {
        Self::new()
    }
}
