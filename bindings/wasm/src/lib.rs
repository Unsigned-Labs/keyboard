use wasm_bindgen::prelude::*;
use transliterator::{Transliterator as RustTransliterator, TransliterationSchema};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub struct Transliterator {
    inner: RustTransliterator,
}

#[wasm_bindgen]
impl Transliterator {
    #[wasm_bindgen(constructor)]
    pub fn new(schema: JsValue) -> Result<Transliterator, JsValue> {
        let schema: TransliterationSchema = serde_wasm_bindgen::from_value(schema)?;
        Ok(Transliterator {
            inner: RustTransliterator::new(schema),
        })
    }

    #[wasm_bindgen]
    pub fn transliterate(&self, input: &str) -> String {
        self.inner.transliterate(input)
    }

    #[wasm_bindgen(js_name = getSchema)]
    pub fn get_schema(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(self.inner.get_schema())
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = setSchema)]
    pub fn set_schema(&mut self, schema: JsValue) -> Result<(), JsValue> {
        let schema: TransliterationSchema = serde_wasm_bindgen::from_value(schema)?;
        self.inner.set_schema(schema);
        Ok(())
    }
}

#[wasm_bindgen(js_name = transliterate)]
pub fn transliterate_text(input: &str, schema: JsValue) -> Result<String, JsValue> {
    let schema: TransliterationSchema = serde_wasm_bindgen::from_value(schema)?;
    Ok(transliterator::transliterate(input, &schema))
}

#[wasm_bindgen(js_name = hindiSchema)]
pub fn hindi_schema() -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(&transliterator::hindi_schema())
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen(js_name = assameseSchema)]
pub fn assamese_schema() -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(&transliterator::assamese_schema())
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen(js_name = banglaSchema)]
pub fn bangla_schema() -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(&transliterator::bangla_schema())
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Language packs loaded from JSON, shared by every input method on the page.
#[wasm_bindgen]
pub struct PackStore {
    inner: transliterator::PackStore,
}

#[wasm_bindgen]
impl PackStore {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PackStore {
        PackStore {
            inner: transliterator::PackStore::new(),
        }
    }

    /// Validates and loads a pack; returns its info as JSON, or throws with the reason.
    #[wasm_bindgen(js_name = loadPack)]
    pub fn load_pack(&mut self, json: &str) -> Result<String, JsValue> {
        self.inner
            .load(json.as_bytes())
            .map(|info| serde_json::to_string(&info).unwrap())
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// All loaded packs as a JSON array.
    pub fn list(&self) -> String {
        serde_json::to_string(&self.inner.list()).unwrap()
    }

    #[wasm_bindgen(js_name = packJson)]
    pub fn pack_json(&self, id: &str) -> Option<String> {
        self.inner.get(id).map(|p| p.to_json())
    }

    #[wasm_bindgen(js_name = missingDependencies)]
    pub fn missing_dependencies(&self, input_method_id: &str) -> String {
        serde_json::to_string(&self.inner.missing_dependencies(input_method_id)).unwrap()
    }

    pub fn transliterate(&self, transliteration_id: &str, input: &str) -> String {
        self.inner.transliterate(transliteration_id, input)
    }

    #[wasm_bindgen(js_name = inputAlphabet)]
    pub fn input_alphabet(&self, transliteration_id: &str) -> String {
        self.inner.input_alphabet(transliteration_id)
    }

    /// Converts a whole text word by word, taking each word's best candidate.
    pub fn convert(&self, input_method_id: &str, text: &str) -> String {
        self.inner.convert(input_method_id, text)
    }

    /// Ranked candidates as a JSON array of {text, kind}; the first is what space commits.
    pub fn candidates(&self, input_method_id: &str, input: &str, limit: usize) -> String {
        serde_json::to_string(&self.inner.candidates(input_method_id, input, limit)).unwrap()
    }
}

impl Default for PackStore {
    fn default() -> Self {
        Self::new()
    }
}
