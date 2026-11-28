/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs-extra");
const path = require("path");
const webpack = require("webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const rootDir = path.join(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const outputDir = path.join(rootDir, "unpacked");

fs.emptyDirSync(outputDir);

const createWebpackConfig = (browser) => ({
  mode: "development",
  entry: {
    background: path.join(srcDir, "background.ts"),
    content: path.join(srcDir, "content.tsx"),
    popup: path.join(srcDir, "popup.tsx"),
    globals: path.join(srcDir, "styles", "globals.css"),
  },
  output: {
    path: path.join(outputDir, browser),
    filename: "[name].js",
    webassemblyModuleFilename: "[hash].wasm",
  },
  experiments: {
    asyncWebAssembly: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              experimentalWatchApi: true,
              configFile: path.resolve(__dirname, "..", "tsconfig.json"),
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  require("@tailwindcss/postcss")({
                    config: path.resolve(__dirname, "..", "tailwind.config.ts"),
                  }),
                  require("autoprefixer"),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/[name][ext]",
        },
      },
      {
        test: /\.wasm$/,
        type: "javascript/auto",
        loader: "arraybuffer-loader",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    plugins: [new TsconfigPathsPlugin({ configFile: path.resolve(__dirname, "..", "tsconfig.json") })],
    alias: {
      "@": srcDir,
      react: path.resolve(__dirname, "..", "node_modules", "react"),
      "react-dom": path.resolve(__dirname, "..", "node_modules", "react-dom"),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      React: "react",
    }),
    new MiniCssExtractPlugin({
      filename: "globals.css",
    }),
  ],
  stats: "verbose",
  devtool: "source-map",
});

function runWebpack(browser) {
  return new Promise((resolve, reject) => {
    webpack(createWebpackConfig(browser), (err, stats) => {
      if (err || stats.hasErrors()) {
        console.error(err || stats.toString({ chunks: false, colors: true }));
        reject(err);
      } else {
        console.log(stats.toString({ chunks: false, colors: true }));
        resolve();
      }
    });
  });
}

function copyExtensionFiles(browser) {
  const filesToCopy = [
    { src: path.join(srcDir, "popup.html"), dest: path.join(outputDir, browser, "popup.html") },
    {
      src: path.join(srcDir, `manifest.${browser}.json`),
      dest: path.join(outputDir, browser, "manifest.json"),
    },
  ];

  filesToCopy.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      fs.copySync(src, dest);
      console.log(`Copied ${src} to ${dest}`);
    } else {
      console.warn(`Warning: ${src} does not exist. Skipping copy.`);
    }
  });
}

// Copies the repo's language packs (modules/) into the extension as packs/, with an index.json the
// background script uses to load only what the chosen input method needs.
function copyPacks(browser) {
  const modules = path.join(rootDir, "..", "..", "modules");
  const dest = path.join(outputDir, browser, "packs");
  fs.ensureDirSync(dest);
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".json")) files.push(full);
    }
  };
  walk(modules);
  const index = files.sort().map((file) => {
    const pack = fs.readJsonSync(file);
    const { id, kind } = pack.resource;
    const im = pack.input_method;
    fs.copySync(file, path.join(dest, `${id}.json`));
    return {
      id,
      kind,
      file: `${id}.json`,
      name: (im && im.name) || (pack.layout && pack.layout.name) || (pack.language && pack.language.name) || id,
      language: pack.language || null,
      dependencies: im ? [im.layout, im.transliteration, im.dictionary].filter(Boolean) : [],
      transliteration: (im && im.transliteration) || null,
    };
  });
  fs.writeJsonSync(path.join(dest, "index.json"), index, { spaces: 2 });
  fs.copySync(
    path.join(rootDir, "node_modules", "@unsigned", "transliterator-wasm", "transliterator_wasm_bg.wasm"),
    path.join(outputDir, browser, "transliterator_wasm_bg.wasm")
  );
  console.log(`Copied ${index.length} packs to ${dest}`);
}

async function build() {
  try {
    await runWebpack("chrome");
    copyExtensionFiles("chrome");
    copyPacks("chrome");
    await runWebpack("firefox");
    copyExtensionFiles("firefox");
    copyPacks("firefox");
    console.log("Build process completed successfully.");
  } catch (error) {
    console.error("Build process failed:", error);
  }
}

build();
