//! Language pack formats for Unsigned Keyboard.
//!
//! A pack is a single UTF-8 JSON file holding data only (never code). Every pack starts with the same
//! header (`format_version`, `resource`, and usually `language`) followed by one kind-specific body:
//!
//! - `transliteration`: input rules that turn Latin keystrokes into a script (`schema`)
//! - `keyboard_layout`: keys, pages and what each key types (`layout`)
//! - `input_method`: a named combination of a layout and an optional transliteration (`input_method`)
//!
//! Apps load packs from their own bundle or from files the user imports; this crate only parses and
//! validates them, so every platform accepts and rejects exactly the same files.

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::fmt::{Display, Formatter};

pub const RESOURCE_FORMAT_VERSION: u32 = 1;
pub const TRANSLITERATION_ENGINE_ABI: u32 = 1;
pub const KEYBOARD_LAYOUT_ABI: u32 = 1;
pub const INPUT_METHOD_ABI: u32 = 1;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ValidationError {
    pub path: String,
    pub message: String,
}

impl ValidationError {
    fn new(path: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            path: path.into(),
            message: message.into(),
        }
    }
}

impl Display for ValidationError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.path, self.message)
    }
}

impl Error for ValidationError {}

#[derive(Debug)]
pub enum ResourceError {
    Json(serde_json::Error),
    Validation(ValidationError),
}

impl Display for ResourceError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Json(error) => write!(f, "invalid pack JSON: {error}"),
            Self::Validation(error) => Display::fmt(error, f),
        }
    }
}

impl Error for ResourceError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Json(error) => Some(error),
            Self::Validation(error) => Some(error),
        }
    }
}

impl From<serde_json::Error> for ResourceError {
    fn from(value: serde_json::Error) -> Self {
        Self::Json(value)
    }
}

impl From<ValidationError> for ResourceError {
    fn from(value: ValidationError) -> Self {
        Self::Validation(value)
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum ResourceKind {
    Transliteration,
    KeyboardLayout,
    InputMethod,
    Dictionary,
    SpeechToText,
}

impl ResourceKind {
    /// Engine ABI this runtime supports for the kind, or `None` if the kind can't be loaded yet.
    pub fn supported_abi(self) -> Option<u32> {
        match self {
            Self::Transliteration => Some(TRANSLITERATION_ENGINE_ABI),
            Self::KeyboardLayout => Some(KEYBOARD_LAYOUT_ABI),
            Self::InputMethod => Some(INPUT_METHOD_ABI),
            Self::Dictionary | Self::SpeechToText => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageIdentity {
    /// A canonical BCP-47 language tag, such as `as`, `bn-IN`, or `hi`.
    pub tag: String,
    /// ISO 15924 script code used by the resource, such as `Beng` or `Deva`.
    pub script: String,
    pub name: String,
    pub native_name: String,
}

impl LanguageIdentity {
    pub fn validate(&self, path: &str) -> Result<(), ValidationError> {
        validate_identifier(&self.tag, &format!("{path}.tag"))?;

        if self.script.len() != 4 || !self.script.chars().all(|c| c.is_ascii_alphabetic()) {
            return Err(ValidationError::new(
                format!("{path}.script"),
                "must be a four-letter ISO 15924 script code",
            ));
        }

        validate_non_empty(&self.name, &format!("{path}.name"))?;
        validate_non_empty(&self.native_name, &format!("{path}.native_name"))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineCompatibility {
    /// Versioned behavior contract implemented by a resource runtime.
    pub abi: u32,
    /// Lowest application/runtime release known to support this resource.
    pub minimum_runtime_version: String,
}

impl EngineCompatibility {
    pub fn validate(&self, path: &str) -> Result<(), ValidationError> {
        if self.abi == 0 {
            return Err(ValidationError::new(
                format!("{path}.abi"),
                "must be greater than zero",
            ));
        }
        validate_semver(
            &self.minimum_runtime_version,
            &format!("{path}.minimum_runtime_version"),
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceMetadata {
    /// Globally stable identifier. It must not change between releases.
    pub id: String,
    pub kind: ResourceKind,
    pub version: String,
    pub engine: EngineCompatibility,
    pub license: String,
    #[serde(default)]
    pub attribution: Option<String>,
}

impl ResourceMetadata {
    pub fn validate(&self, path: &str) -> Result<(), ValidationError> {
        validate_identifier(&self.id, &format!("{path}.id"))?;
        validate_semver(&self.version, &format!("{path}.version"))?;
        self.engine.validate(&format!("{path}.engine"))?;
        validate_non_empty(&self.license, &format!("{path}.license"))
    }

    fn validate_kind(&self, expected: ResourceKind) -> Result<(), ValidationError> {
        if self.kind != expected {
            return Err(ValidationError::new(
                "resource.kind",
                format!("expected {expected:?}, found {:?}", self.kind),
            ));
        }
        let supported = expected.supported_abi().unwrap_or(0);
        if self.engine.abi != supported {
            return Err(ValidationError::new(
                "resource.engine.abi",
                format!(
                    "unsupported {expected:?} ABI {}; this runtime supports {supported}",
                    self.engine.abi
                ),
            ));
        }
        Ok(())
    }
}

/* -------------------------------------------------------------------------------------------- */
/* Transliteration                                                                               */
/* -------------------------------------------------------------------------------------------- */

/// Represents a complete transliteration schema for a language.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransliterationSchema {
    pub consonants: HashMap<String, Vec<String>>,
    pub vowels: HashMap<String, Vec<String>>,
    pub vowel_marks: HashMap<String, Vec<String>>,
    pub special_char: HashMap<String, Vec<String>>,
    pub digits: HashMap<String, Vec<String>>,
    pub exceptions: Exceptions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Exceptions {
    pub special_combinations: HashMap<String, String>,
    pub joined_consonants_before: HashMap<String, String>,
    pub joined_consonants_after: HashMap<String, String>,
    pub explicit_holonto: String,
}

impl TransliterationSchema {
    pub fn new() -> Self {
        Self {
            consonants: HashMap::new(),
            vowels: HashMap::new(),
            vowel_marks: HashMap::new(),
            special_char: HashMap::new(),
            digits: HashMap::new(),
            exceptions: Exceptions {
                special_combinations: HashMap::new(),
                joined_consonants_before: HashMap::new(),
                joined_consonants_after: HashMap::new(),
                explicit_holonto: String::new(),
            },
        }
    }

    pub fn validate(&self, path: &str) -> Result<(), ValidationError> {
        if self.consonants.is_empty() && self.vowels.is_empty() {
            return Err(ValidationError::new(
                path,
                "must define at least one consonant or vowel",
            ));
        }

        validate_mapping(&self.consonants, &format!("{path}.consonants"))?;
        validate_mapping(&self.vowels, &format!("{path}.vowels"))?;
        validate_mapping(&self.vowel_marks, &format!("{path}.vowel_marks"))?;
        validate_mapping(&self.special_char, &format!("{path}.special_char"))?;
        validate_mapping(&self.digits, &format!("{path}.digits"))?;

        for (input, output) in &self.exceptions.special_combinations {
            validate_non_empty(input, &format!("{path}.exceptions.special_combinations"))?;
            validate_non_empty(
                output,
                &format!("{path}.exceptions.special_combinations.{input}"),
            )?;
        }

        Ok(())
    }
}

impl Default for TransliterationSchema {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransliterationModule {
    pub format_version: u32,
    pub language: LanguageIdentity,
    pub resource: ResourceMetadata,
    pub schema: TransliterationSchema,
}

impl TransliterationModule {
    pub fn from_json_slice(bytes: &[u8]) -> Result<Self, ResourceError> {
        let module: Self = serde_json::from_slice(bytes)?;
        module.validate()?;
        Ok(module)
    }

    pub fn from_json_str(json: &str) -> Result<Self, ResourceError> {
        Self::from_json_slice(json.as_bytes())
    }

    pub fn validate(&self) -> Result<(), ValidationError> {
        validate_format_version(self.format_version)?;
        self.language.validate("language")?;
        self.resource.validate("resource")?;
        self.resource.validate_kind(ResourceKind::Transliteration)?;
        self.schema.validate("schema")
    }
}

/* -------------------------------------------------------------------------------------------- */
/* Keyboard layout                                                                               */
/* -------------------------------------------------------------------------------------------- */

/// How the text a key produces reaches the app.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LayoutInput {
    /// Keys type Latin letters that the input method's transliteration turns into the script.
    Latin,
    /// Keys type their output directly (a native-script layout).
    Direct,
}

/// What a key does besides (or instead of) typing text.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum KeyAction {
    Shift,
    Delete,
    Enter,
    Space,
    /// Show another page of this layout (`target`).
    Page,
    /// Show the app's numbers and symbols pages.
    Symbols,
    /// Switch to the next enabled input method.
    NextInputMethod,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShiftedKey {
    pub label: String,
    pub output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutKey {
    /// Text shown on the key. Defaults to `output`.
    #[serde(default)]
    pub label: Option<String>,
    /// Text the key types.
    #[serde(default)]
    pub output: Option<String>,
    /// Label/output while shift is active.
    #[serde(default)]
    pub shift: Option<ShiftedKey>,
    /// Direct layouts: text to type instead of `output` when the previous character is one of the
    /// layout's `composition.consonants` (a vowel sign instead of an independent vowel).
    #[serde(default)]
    pub after_consonant: Option<String>,
    /// Extra characters offered on long press.
    #[serde(default)]
    pub long_press: Vec<String>,
    /// Width relative to a regular key.
    #[serde(default = "one")]
    pub width: f32,
    #[serde(default)]
    pub action: Option<KeyAction>,
    /// Page id for `action: page`.
    #[serde(default)]
    pub target: Option<String>,
}

fn one() -> f32 {
    1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutRow {
    /// Empty space before the first key, in key widths (e.g. 0.5 for the second QWERTY row).
    #[serde(default)]
    pub offset: f32,
    pub keys: Vec<LayoutKey>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutPage {
    pub id: String,
    pub rows: Vec<LayoutRow>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Composition {
    /// Characters after which `after_consonant` outputs apply.
    #[serde(default)]
    pub consonants: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyboardLayout {
    pub name: String,
    pub input: LayoutInput,
    #[serde(default)]
    pub composition: Composition,
    /// The first page is shown first.
    pub pages: Vec<LayoutPage>,
}

impl KeyboardLayout {
    pub fn validate(&self, path: &str) -> Result<(), ValidationError> {
        validate_non_empty(&self.name, &format!("{path}.name"))?;
        if self.pages.is_empty() {
            return Err(ValidationError::new(
                format!("{path}.pages"),
                "must have at least one page",
            ));
        }
        let ids: HashSet<&str> = self.pages.iter().map(|p| p.id.as_str()).collect();
        if ids.len() != self.pages.len() {
            return Err(ValidationError::new(
                format!("{path}.pages"),
                "page ids must be unique",
            ));
        }
        for (pi, page) in self.pages.iter().enumerate() {
            let ppath = format!("{path}.pages[{pi}]");
            validate_identifier(&page.id, &format!("{ppath}.id"))?;
            if page.rows.is_empty() {
                return Err(ValidationError::new(
                    format!("{ppath}.rows"),
                    "must have at least one row",
                ));
            }
            for (ri, row) in page.rows.iter().enumerate() {
                let rpath = format!("{ppath}.rows[{ri}]");
                if row.keys.is_empty() {
                    return Err(ValidationError::new(
                        format!("{rpath}.keys"),
                        "must have at least one key",
                    ));
                }
                if !(0.0..=4.0).contains(&row.offset) {
                    return Err(ValidationError::new(
                        format!("{rpath}.offset"),
                        "must be between 0 and 4",
                    ));
                }
                for (ki, key) in row.keys.iter().enumerate() {
                    key.validate(&format!("{rpath}.keys[{ki}]"), &ids)?;
                }
            }
        }
        Ok(())
    }
}

impl LayoutKey {
    fn validate(&self, path: &str, page_ids: &HashSet<&str>) -> Result<(), ValidationError> {
        if !(0.25..=10.0).contains(&self.width) {
            return Err(ValidationError::new(
                format!("{path}.width"),
                "must be between 0.25 and 10",
            ));
        }
        match self.action {
            None => {
                if self.output.as_deref().unwrap_or("").is_empty() {
                    return Err(ValidationError::new(
                        format!("{path}.output"),
                        "a key without an action must type something",
                    ));
                }
            }
            Some(KeyAction::Page) => match self.target.as_deref() {
                Some(t) if page_ids.contains(t) => {}
                _ => {
                    return Err(ValidationError::new(
                        format!("{path}.target"),
                        "a page key needs the id of a page in this layout",
                    ))
                }
            },
            Some(_) => {}
        }
        if let Some(action) = self.action {
            if action != KeyAction::Space && self.label.as_deref().unwrap_or("").is_empty() {
                return Err(ValidationError::new(
                    format!("{path}.label"),
                    "action keys need a label",
                ));
            }
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyboardLayoutModule {
    pub format_version: u32,
    /// Absent for language-neutral layouts such as QWERTY.
    #[serde(default)]
    pub language: Option<LanguageIdentity>,
    pub resource: ResourceMetadata,
    pub layout: KeyboardLayout,
}

impl KeyboardLayoutModule {
    pub fn from_json_slice(bytes: &[u8]) -> Result<Self, ResourceError> {
        let module: Self = serde_json::from_slice(bytes)?;
        module.validate()?;
        Ok(module)
    }

    pub fn validate(&self) -> Result<(), ValidationError> {
        validate_format_version(self.format_version)?;
        if let Some(language) = &self.language {
            language.validate("language")?;
        }
        self.resource.validate("resource")?;
        self.resource.validate_kind(ResourceKind::KeyboardLayout)?;
        self.layout.validate("layout")
    }
}

/* -------------------------------------------------------------------------------------------- */
/* Input method                                                                                  */
/* -------------------------------------------------------------------------------------------- */

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputMethod {
    pub name: String,
    /// One or two characters shown on the input method switch key, such as `অ` or `EN`.
    #[serde(default)]
    pub short_label: Option<String>,
    /// Resource id of a keyboard layout.
    pub layout: String,
    /// Resource id of a transliteration, for layouts whose input is `latin`. Without one, the
    /// Latin text is typed as is.
    #[serde(default)]
    pub transliteration: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputMethodModule {
    pub format_version: u32,
    pub language: LanguageIdentity,
    pub resource: ResourceMetadata,
    pub input_method: InputMethod,
}

impl InputMethodModule {
    pub fn from_json_slice(bytes: &[u8]) -> Result<Self, ResourceError> {
        let module: Self = serde_json::from_slice(bytes)?;
        module.validate()?;
        Ok(module)
    }

    pub fn validate(&self) -> Result<(), ValidationError> {
        validate_format_version(self.format_version)?;
        self.language.validate("language")?;
        self.resource.validate("resource")?;
        self.resource.validate_kind(ResourceKind::InputMethod)?;
        validate_non_empty(&self.input_method.name, "input_method.name")?;
        validate_identifier(&self.input_method.layout, "input_method.layout")?;
        if let Some(t) = &self.input_method.transliteration {
            validate_identifier(t, "input_method.transliteration")?;
        }
        Ok(())
    }

    /// Resource ids this input method needs.
    pub fn dependencies(&self) -> Vec<&str> {
        let mut deps = vec![self.input_method.layout.as_str()];
        if let Some(t) = &self.input_method.transliteration {
            deps.push(t.as_str());
        }
        deps
    }
}

/* -------------------------------------------------------------------------------------------- */
/* Any pack                                                                                      */
/* -------------------------------------------------------------------------------------------- */

#[derive(Debug, Clone)]
pub enum Pack {
    Transliteration(TransliterationModule),
    KeyboardLayout(KeyboardLayoutModule),
    InputMethod(InputMethodModule),
}

/// Short description of a pack for listings and import results.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PackInfo {
    pub id: String,
    pub kind: ResourceKind,
    pub version: String,
    pub name: String,
    #[serde(default)]
    pub language: Option<String>,
    #[serde(default)]
    pub dependencies: Vec<String>,
}

#[derive(Deserialize)]
struct Header {
    resource: HeaderResource,
}

#[derive(Deserialize)]
struct HeaderResource {
    kind: ResourceKind,
}

impl Pack {
    /// Parse and validate any pack, dispatching on `resource.kind`.
    pub fn from_json_slice(bytes: &[u8]) -> Result<Self, ResourceError> {
        let header: Header = serde_json::from_slice(bytes)?;
        match header.resource.kind {
            ResourceKind::Transliteration => Ok(Self::Transliteration(
                TransliterationModule::from_json_slice(bytes)?,
            )),
            ResourceKind::KeyboardLayout => Ok(Self::KeyboardLayout(
                KeyboardLayoutModule::from_json_slice(bytes)?,
            )),
            ResourceKind::InputMethod => Ok(Self::InputMethod(InputMethodModule::from_json_slice(
                bytes,
            )?)),
            other => Err(ValidationError::new(
                "resource.kind",
                format!("{other:?} packs are not supported by this version of the app yet"),
            )
            .into()),
        }
    }

    /// The pack as JSON, with defaults filled in, for apps that render layouts themselves.
    pub fn to_json(&self) -> String {
        let value = match self {
            Self::Transliteration(m) => serde_json::to_string(m),
            Self::KeyboardLayout(m) => serde_json::to_string(m),
            Self::InputMethod(m) => serde_json::to_string(m),
        };
        value.expect("packs always serialize")
    }

    pub fn resource(&self) -> &ResourceMetadata {
        match self {
            Self::Transliteration(m) => &m.resource,
            Self::KeyboardLayout(m) => &m.resource,
            Self::InputMethod(m) => &m.resource,
        }
    }

    pub fn info(&self) -> PackInfo {
        let r = self.resource();
        let (name, language, dependencies) = match self {
            Self::Transliteration(m) => (
                format!("{} transliteration", m.language.name),
                Some(m.language.tag.clone()),
                vec![],
            ),
            Self::KeyboardLayout(m) => (
                m.layout.name.clone(),
                m.language.as_ref().map(|l| l.tag.clone()),
                vec![],
            ),
            Self::InputMethod(m) => (
                m.input_method.name.clone(),
                Some(m.language.tag.clone()),
                m.dependencies().into_iter().map(String::from).collect(),
            ),
        };
        PackInfo {
            id: r.id.clone(),
            kind: r.kind,
            version: r.version.clone(),
            name,
            language,
            dependencies,
        }
    }
}

/// Compare two `major.minor.patch` versions (pre-release suffixes ignored).
pub fn compare_versions(a: &str, b: &str) -> std::cmp::Ordering {
    let parse = |v: &str| -> Vec<u64> {
        v.split_once('-')
            .map_or(v, |(c, _)| c)
            .split('.')
            .map(|p| p.parse().unwrap_or(0))
            .collect()
    };
    parse(a).cmp(&parse(b))
}

/* -------------------------------------------------------------------------------------------- */

fn validate_format_version(version: u32) -> Result<(), ValidationError> {
    if version != RESOURCE_FORMAT_VERSION {
        return Err(ValidationError::new(
            "format_version",
            format!(
                "unsupported format version {version}; runtime supports {RESOURCE_FORMAT_VERSION}"
            ),
        ));
    }
    Ok(())
}

fn validate_mapping(
    mapping: &HashMap<String, Vec<String>>,
    path: &str,
) -> Result<(), ValidationError> {
    for (output, inputs) in mapping {
        if inputs.is_empty() {
            return Err(ValidationError::new(
                format!("{path}.{output}"),
                "must contain at least one input sequence",
            ));
        }
        for (index, input) in inputs.iter().enumerate() {
            // Empty input is permitted only for the inherent-vowel marker.
            if input.is_empty() && !output.is_empty() {
                return Err(ValidationError::new(
                    format!("{path}.{output}[{index}]"),
                    "input sequences cannot be empty",
                ));
            }
        }
    }
    Ok(())
}

fn validate_non_empty(value: &str, path: &str) -> Result<(), ValidationError> {
    if value.trim().is_empty() {
        Err(ValidationError::new(path, "cannot be empty"))
    } else {
        Ok(())
    }
}

fn validate_identifier(value: &str, path: &str) -> Result<(), ValidationError> {
    validate_non_empty(value, path)?;
    if !value
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
    {
        return Err(ValidationError::new(
            path,
            "may contain only ASCII letters, digits, periods, hyphens, and underscores",
        ));
    }
    Ok(())
}

fn validate_semver(value: &str, path: &str) -> Result<(), ValidationError> {
    let core = value.split_once('-').map_or(value, |(core, _)| core);
    let parts: Vec<&str> = core.split('.').collect();
    if parts.len() != 3 || parts.iter().any(|part| part.parse::<u64>().is_err()) {
        return Err(ValidationError::new(
            path,
            "must use semantic version syntax (major.minor.patch)",
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    const LAYOUT: &str = r#"{
      "format_version": 1,
      "resource": {"id": "test.layout", "kind": "keyboard_layout", "version": "1.0.0",
                   "engine": {"abi": 1, "minimum_runtime_version": "0.1.0"}, "license": "MIT"},
      "layout": {"name": "Test", "input": "latin", "pages": [
        {"id": "main", "rows": [{"keys": [{"output": "a"}, {"label": "⇧", "action": "shift"},
                                          {"label": "2", "action": "page", "target": "two"}]}]},
        {"id": "two", "rows": [{"keys": [{"output": "b"}]}]}
      ]}
    }"#;

    #[test]
    fn parses_any_pack_by_kind() {
        let pack = Pack::from_json_slice(LAYOUT.as_bytes()).unwrap();
        let info = pack.info();
        assert_eq!(info.kind, ResourceKind::KeyboardLayout);
        assert_eq!(info.name, "Test");
        assert_eq!(info.language, None);
    }

    #[test]
    fn rejects_page_key_with_unknown_target() {
        let bad = LAYOUT.replace("\"target\": \"two\"", "\"target\": \"nope\"");
        let err = Pack::from_json_slice(bad.as_bytes())
            .unwrap_err()
            .to_string();
        assert!(err.contains("target"), "{err}");
    }

    #[test]
    fn rejects_key_that_types_nothing() {
        let bad = LAYOUT.replace("{\"output\": \"b\"}", "{\"label\": \"b\"}");
        assert!(Pack::from_json_slice(bad.as_bytes()).is_err());
    }

    #[test]
    fn rejects_unsupported_kinds_and_abis() {
        let dict = LAYOUT.replace("keyboard_layout", "dictionary");
        assert!(Pack::from_json_slice(dict.as_bytes())
            .unwrap_err()
            .to_string()
            .contains("not supported"));
        let abi = LAYOUT.replace("\"abi\": 1", "\"abi\": 2");
        assert!(Pack::from_json_slice(abi.as_bytes())
            .unwrap_err()
            .to_string()
            .contains("ABI"));
    }

    #[test]
    fn compares_versions_numerically() {
        assert_eq!(
            compare_versions("1.10.0", "1.9.9"),
            std::cmp::Ordering::Greater
        );
        assert_eq!(
            compare_versions("1.0.0", "1.0.0-beta"),
            std::cmp::Ordering::Equal
        );
    }
}
