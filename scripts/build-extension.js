/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const extensionSrcDir = path.join(rootDir, 'extension-src');
const outputDir = path.join(rootDir, 'extension-dist');

// Ensure output directory exists and is empty
fs.emptyDirSync(outputDir);

// Webpack configuration
const webpackConfig = {
  mode: 'development',
  entry: {
    background: path.join(extensionSrcDir, 'background.js'),
    content: path.join(extensionSrcDir, 'content.js'),
    popup: path.join(extensionSrcDir, 'popup.js')
  },
  output: {
    path: outputDir,
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              experimentalWatchApi: true,
              configFile: path.resolve(__dirname, '..', 'tsconfig.extension.json'),
            },
          },
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.extension.json" })],
    alias: {
      '@': srcDir
    }
  },
  stats: 'verbose',
  devtool: 'source-map'
};

// Function to run webpack
function runWebpack() {
  return new Promise((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err || stats.hasErrors()) {
        console.error(err || stats.toString({
          chunks: false,
          colors: true
        }));
        reject(err);
      } else {
        console.log(stats.toString({
          chunks: false,
          colors: true
        }));
        resolve();
      }
    });
  });
}

// Copy necessary files to extension directory
function copyExtensionFiles() {
  const filesToCopy = [
    { src: path.join(extensionSrcDir, 'popup.html'), dest: path.join(outputDir, 'popup.html') },
    { src: path.join(extensionSrcDir, 'styles.css'), dest: path.join(outputDir, 'styles.css') },
    { src: path.join(extensionSrcDir, 'manifest.json'), dest: path.join(outputDir, 'manifest.json') },
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

// Main build process
async function build() {
  try {
    await runWebpack();
    copyExtensionFiles();
    console.log('Build process completed successfully.');
  } catch (error) {
    console.error('Build process failed:', error);
  }
}

build();