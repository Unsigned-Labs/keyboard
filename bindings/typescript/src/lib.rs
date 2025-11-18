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
