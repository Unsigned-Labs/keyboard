/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs-extra");
const path = require("path");
const webpack = require("webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const rootDir = path.join(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const extensionSrcDir = path.join(rootDir, "extension-src");
const outputDir = path.join(rootDir, "extension-unpacked");

fs.emptyDirSync(outputDir);

const createWebpackConfig = (browser) => ({
  mode: "development",
  entry: {
    background: path.join(extensionSrcDir, "background.ts"),
    content: path.join(extensionSrcDir, "content.tsx"),
    popup: path.join(extensionSrcDir, "popup.tsx"),
    editor: path.join(extensionSrcDir, "editor.tsx"),
    globals: path.join(srcDir, "app", "globals.css"),
  },
  output: {
    path: path.join(outputDir, browser),
    filename: "[name].js",
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
              configFile: path.resolve(__dirname, "..", "tsconfig.extension.json"),
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
                  require("tailwindcss")({
                    config: path.resolve(__dirname, "..", "tailwind.config.ts"),
                  }),
                  require("autoprefixer"),
                ],
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.extension.json" })],
    alias: {
      "@": srcDir,
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
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
    { src: path.join(extensionSrcDir, "popup.html"), dest: path.join(outputDir, browser, "popup.html") },
    { src: path.join(extensionSrcDir, "editor.html"), dest: path.join(outputDir, browser, "editor.html") },
    {
      src: path.join(extensionSrcDir, `manifest.${browser}.json`),
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

async function build() {
  try {
    await runWebpack("chrome");
    copyExtensionFiles("chrome");
    await runWebpack("firefox");
    copyExtensionFiles("firefox");
    console.log("Build process completed successfully.");
  } catch (error) {
    console.error("Build process failed:", error);
  }
}

build();
