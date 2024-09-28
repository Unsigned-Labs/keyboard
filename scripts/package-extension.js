/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

const rootDir = path.join(__dirname, '..');
const extensionSrcDir = path.join(rootDir, 'extension-src');
const extensionDistDir = path.join(rootDir, 'extension-dist');
const publicDir = path.join(rootDir, 'public');

fs.ensureDirSync(publicDir);

function createZipArchive(source, output) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(output);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

function prepareManifest(browser) {
  const manifestPath = path.join(extensionSrcDir, `manifest.${browser}.json`);
  const manifest = fs.readJsonSync(manifestPath);

  if (browser === 'firefox') {
    manifest.browser_specific_settings = {
      gecko: {
        strict_min_version: "57.0"
      }
    };
    delete manifest.minimum_chrome_version;
  }

  return manifest;
}

async function packageExtensions() {
  try {
    // Package for Chrome
    const chromeManifest = prepareManifest('chrome');
    const chromeTempDir = path.join(publicDir, 'chrome-temp');
    fs.copySync(extensionDistDir, chromeTempDir);
    fs.writeJsonSync(path.join(chromeTempDir, 'manifest.json'), chromeManifest, { spaces: 2 });
    await createZipArchive(chromeTempDir, path.join(publicDir, 'extension-chrome.zip'));
    fs.removeSync(chromeTempDir);
    console.log('Chrome extension packaged successfully.');

    // Package for Firefox
    const firefoxManifest = prepareManifest('firefox');
    const firefoxTempDir = path.join(publicDir, 'firefox-temp');
    fs.copySync(extensionDistDir, firefoxTempDir);
    fs.writeJsonSync(path.join(firefoxTempDir, 'manifest.json'), firefoxManifest, { spaces: 2 });
    await createZipArchive(firefoxTempDir, path.join(publicDir, 'extension-firefox.zip'));
    fs.removeSync(firefoxTempDir);
    console.log('Firefox extension packaged successfully.');

    console.log('Packaging process completed. Extensions are in the public folder.');
  } catch (error) {
    console.error('Packaging process failed:', error);
  }
}

packageExtensions();