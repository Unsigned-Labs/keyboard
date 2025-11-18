use jni::objects::{JClass, JString};
use jni::sys::jstring;
use jni::JNIEnv;
use transliterator::{Transliterator, TransliterationSchema};

// Cache for transliterators
static mut HINDI_TRANSLITERATOR: Option<Transliterator> = None;
static mut ASSAMESE_TRANSLITERATOR: Option<Transliterator> = None;
static mut BANGLA_TRANSLITERATOR: Option<Transliterator> = None;

fn get_schema(language: &str) -> TransliterationSchema {
    match language {
        "hindi" => transliterator::hindi_schema(),
        "assamese" => transliterator::assamese_schema(),
        "bangla" => transliterator::bangla_schema(),
        _ => transliterator::assamese_schema(),
    }
}

fn get_or_create_transliterator(language: &str) -> &'static Transliterator {
    unsafe {
        match language {
            "hindi" => {
                if HINDI_TRANSLITERATOR.is_none() {
                    HINDI_TRANSLITERATOR = Some(Transliterator::new(get_schema("hindi")));
                }
                HINDI_TRANSLITERATOR.as_ref().unwrap()
            }
            "assamese" => {
                if ASSAMESE_TRANSLITERATOR.is_none() {
                    ASSAMESE_TRANSLITERATOR = Some(Transliterator::new(get_schema("assamese")));
                }
                ASSAMESE_TRANSLITERATOR.as_ref().unwrap()
            }
            "bangla" => {
                if BANGLA_TRANSLITERATOR.is_none() {
                    BANGLA_TRANSLITERATOR = Some(Transliterator::new(get_schema("bangla")));
                }
                BANGLA_TRANSLITERATOR.as_ref().unwrap()
            }
            _ => {
                if ASSAMESE_TRANSLITERATOR.is_none() {
                    ASSAMESE_TRANSLITERATOR = Some(Transliterator::new(get_schema("assamese")));
                }
                ASSAMESE_TRANSLITERATOR.as_ref().unwrap()
            }
        }
    }
}

#[no_mangle]
pub extern "C" fn Java_in_unsigned_keyboard_Transliterator_transliterate(
    mut env: JNIEnv,
    _class: JClass,
    input: JString,
    language: JString,
) -> jstring {
    let input_str: String = env
        .get_string(&input)
        .expect("Couldn't get input string")
        .into();

    let language_str: String = env
        .get_string(&language)
        .expect("Couldn't get language string")
        .into();

    let transliterator = get_or_create_transliterator(&language_str);
    let result = transliterator.transliterate(&input_str);

    let output = env
        .new_string(result)
        .expect("Couldn't create Java string");

    output.into_raw()
}

#[no_mangle]
pub extern "C" fn Java_in_unsigned_keyboard_Transliterator_getAvailableLanguages(
    mut env: JNIEnv,
    _class: JClass,
) -> jstring {
    let languages = "hindi,assamese,bangla";
    let output = env
        .new_string(languages)
        .expect("Couldn't create Java string");
    output.into_raw()
}
