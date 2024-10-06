## Unsigned Keyboard

## Getting Started

This app is available as a web app and a browser extension.

### Web App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Extension

```bash
npm run extension:build
```

This will generate the unpacked extension inside of extension-unpacked that can be loaded onto Chrome.

```bash
npm run extension:package
```

This will generate the zipped version of the built extension and place it inside of `public`. You can navigate to [/extension](http://localhost:3000/extension) to test it out once packaged.