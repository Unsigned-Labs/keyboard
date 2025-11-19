# Unsigned Keyboard

Transliteration engine for English to Indian languages (Hindi, Assamese, Bengali).

## Structure

```
keyboard/
├── core/                  # Rust transliteration engine
├── bindings/
│   ├── typescript/        # Node.js (N-API)
│   ├── wasm/              # Browser (WebAssembly)
│   └── android/           # Android (JNI)
└── apps/
    ├── web/               # Next.js web app
    ├── extension/         # Browser extension
    ├── linux/             # Linux desktop app
    ├── android/           # Android app
    └── cli/               # CLI tool
```

## Build

### Core
```bash
cd core && cargo build --release
```

### Bindings
```bash
cd bindings/typescript && npm install && npm run build
cd bindings/wasm && wasm-pack build --target bundler
cd bindings/android && cargo build --target aarch64-linux-android --release
```

### Apps
```bash
cd apps/web && npm install && npm run dev
cd apps/linux && cargo build --release
```

## Usage

### Node.js
```javascript
const { Transliterator, hindiSchema } = require('@unsigned/transliterator-native');
const t = new Transliterator(hindiSchema());
console.log(t.transliterate('namaste')); // नमस्ते
```

### Browser
```javascript
import init, { transliterate, hindiSchema } from '@unsigned/transliterator-wasm';
await init();
console.log(transliterate('namaste', hindiSchema())); // नमस्ते
```

### Android
```kotlin
import `in`.unsigned.keyboard.Transliterator

Transliterator.transliterate("namaste", "hindi") // नमस्ते
```

### CLI
```bash
cd apps/cli && npm start
```

### Linux Desktop (Rust)
```rust
use transliterator::{Transliterator, hindi_schema};

let t = Transliterator::new(hindi_schema());
let result = t.transliterate("namaste"); // नमस्ते
```

## License

MIT
