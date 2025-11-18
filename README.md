# Unsigned Keyboard

A high-performance transliteration system for English to Indian languages (Hindi, Assamese, Bengali).

## Architecture

**Rust Core** → **Platform Bindings** (TypeScript N-API, WASM) → **Apps** (Node.js, Web)

## Structure

```
keyboard/
├── core/                   # Rust core SDK
├── bindings/
│   ├── typescript/         # Node.js bindings (N-API)
│   └── wasm/              # Browser bindings (WebAssembly)
└── apps/
    └── web/               # Next.js web application
```

## Quick Start

### Build Rust Core
```bash
cd core && cargo build --release
```

### Build TypeScript Bindings (Node.js)
```bash
cd bindings/typescript && npm install && npm run build
```

### Build WASM Bindings (Browser)
```bash
cd bindings/wasm && wasm-pack build --target bundler
```

### Run Web App
```bash
cd apps/web && npm install && npm run dev
```

## Usage

### Node.js
```javascript
const { Transliterator, hindiSchema } = require('@unsigned/transliterator-native');
const t = new Transliterator(hindiSchema());
console.log(t.transliterate('namaste')); // नमस्ते
```

### Browser/Web
```javascript
import init, { transliterate, hindiSchema } from '@unsigned/transliterator-wasm';
await init();
console.log(transliterate('namaste', hindiSchema())); // नमस्ते
```

## License

MIT
