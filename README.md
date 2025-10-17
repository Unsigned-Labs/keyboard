# Unsigned Keyboard - Monorepo

A transliteration system for English to Indian languages (Assamese, Bengali, Hindi, etc.)

## Structure

```
keyboard/
├── core/                   # Core transliteration engine
│   └── typescript/         # TypeScript SDK
│       ├── src/
│       │   ├── core/       # Core transliteration logic
│       │   ├── schemas/    # Language schemas
│       │   └── types/      # TypeScript type definitions
│       └── dist/           # Compiled output
└── apps/                   # Applications
    ├── web/                # Next.js web application
    ├── android/            # Android application
    └── extension/          # Browser extension
```

## Building

### TypeScript SDK

```bash
# Navigate to the SDK directory
cd core/typescript

# Install dependencies
npm install

# Build the SDK
npm run build
```

### Web Application

```bash
# Navigate to the web app directory
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
```

### Browser Extension

```bash
# Navigate to the web app directory (extension is built from here)
cd apps/browser

# Build the extension for both Chrome and Firefox
npm run build

# Package the extension
npm run package
```

Once they are packaged, move them to the public dir inside of the web app to make it available for download.

## Architecture

1. **Core Layer (TypeScript)**: Core transliteration engine
   - Language-agnostic engine
   - Pluggable language schemas
   - Extensible for multiple Indian languages

2. **Application Layer**: Platform-specific apps
   - Web: Next.js application at keyboard.unsigned.in
   - Extension: Browser extension for Chrome/Firefox

## Adding New Languages

To add support for a new language:

1. Create a new schema file in `core/typescript/src/schemas/`
2. Implement the `TransliterationSchema` interface
3. Export it from `core/typescript/src/index.ts`
4. Rebuild the SDK
5. Update applications to support the new language

## For Developers

Visit [keyboard.unsigned.in/docs](https://keyboard.unsigned.in/docs) for detailed API documentation and integration guides.

## License

MIT
