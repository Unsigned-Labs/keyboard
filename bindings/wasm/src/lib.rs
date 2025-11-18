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
