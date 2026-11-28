//! JNI bindings for `in.unsigned.keyboard.Engine`.
//!
//! The app keeps one pack store per process; the keyboard service and the settings screen share it.

use std::sync::{Mutex, MutexGuard, OnceLock};

use jni::objects::{JByteArray, JClass, JString};
use jni::sys::jstring;
use jni::JNIEnv;
use transliterator::PackStore;

fn store() -> MutexGuard<'static, PackStore> {
    static STORE: OnceLock<Mutex<PackStore>> = OnceLock::new();
    STORE
        .get_or_init(|| Mutex::new(PackStore::new()))
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn string(env: &mut JNIEnv, value: &JString) -> String {
    env.get_string(value).map(Into::into).unwrap_or_default()
}

fn java_string(env: &mut JNIEnv, value: impl AsRef<str>) -> jstring {
    env.new_string(value.as_ref())
        .map(|s| s.into_raw())
        .unwrap_or(std::ptr::null_mut())
}

/// Validates and loads a pack. Returns its info as JSON, or throws IllegalArgumentException.
#[no_mangle]
pub extern "C" fn Java_in_unsigned_keyboard_Engine_loadPack(
    mut env: JNIEnv,
    _class: JClass,
    bytes: JByteArray,
) -> jstring {
    let bytes = match env.convert_byte_array(&bytes) {
        Ok(bytes) => bytes,
        Err(_) => return std::ptr::null_mut(),
    };
    let result = store().load(&bytes);
    match result {
        Ok(info) => java_string(&mut env, serde_json::to_string(&info).unwrap()),
        Err(error) => {
            let _ = env.throw_new("java/lang/IllegalArgumentException", error.to_string());
            std::ptr::null_mut()
        }
    }
}

#[no_mangle]
pub extern "C" fn Java_in_unsigned_keyboard_Engine_clear(_env: JNIEnv, _class: JClass) {
    store().clear();
}

/// All loaded packs as a JSON array.
#[no_mangle]
pub extern "C" fn Java_in_unsigned_keyboard_Engine_listPacks(
    mut env: JNIEnv,
    _class: JClass,
) -> jstring {
    let list = serde_json::to_string(&store().list()).unwrap();
    java_string(&mut env, list)
}

/// A loaded pack as JSON with defaults filled in, or null.
#[no_mangle]
pub extern "C" fn Java_in_unsigned_keyboard_Engine_packJson(
    mut env: JNIEnv,
    _class: JClass,
    id: JString,
) -> jstring {
    let id = string(&mut env, &id);
    let json = store().get(&id).map(|pack| pack.to_json());
    match json {
        Some(json) => java_string(&mut env, json),
        None => std::ptr::null_mut(),
    }
}

/// Ids an input method needs that aren't loaded, as a JSON array.
#[no_mangle]
pub extern "C" fn Java_in_unsigned_keyboard_Engine_missingDependencies(
    mut env: JNIEnv,
    _class: JClass,
    id: JString,
) -> jstring {
    let id = string(&mut env, &id);
    let missing = serde_json::to_string(&store().missing_dependencies(&id)).unwrap();
    java_string(&mut env, missing)
}

#[no_mangle]
pub extern "C" fn Java_in_unsigned_keyboard_Engine_transliterate(
    mut env: JNIEnv,
    _class: JClass,
    transliteration_id: JString,
    input: JString,
) -> jstring {
    let id = string(&mut env, &transliteration_id);
    let input = string(&mut env, &input);
    let output = store().transliterate(&id, &input);
    java_string(&mut env, output)
}

#[no_mangle]
pub extern "C" fn Java_in_unsigned_keyboard_Engine_inputAlphabet(
    mut env: JNIEnv,
    _class: JClass,
    transliteration_id: JString,
) -> jstring {
    let id = string(&mut env, &transliteration_id);
    let alphabet = store().input_alphabet(&id);
    java_string(&mut env, alphabet)
}

/// Ranked candidates for an input method's composing text, as a JSON array of {text, kind}.
#[no_mangle]
pub extern "C" fn Java_in_unsigned_keyboard_Engine_candidates(
    mut env: JNIEnv,
    _class: JClass,
    input_method_id: JString,
    input: JString,
    limit: jni::sys::jint,
) -> jstring {
    let id = string(&mut env, &input_method_id);
    let input = string(&mut env, &input);
    let candidates = store().candidates(&id, &input, limit.max(1) as usize);
    java_string(&mut env, serde_json::to_string(&candidates).unwrap())
}
