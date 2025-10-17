/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

const rootDir = path.join(__dirname, "..");
const unpackedDir = path.join(rootDir, "unpacked");
const packageDir = path.join(rootDir, "package");

fs.ensureDirSync(packageDir);

function createZipArchive(source, output) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(output);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on("error", (err) => reject(err))
      .pipe(stream);

    stream.on("close", () => resolve());
    archive.finalize();
  });
}

async function packageExtensions() {
  try {
    for (const browser of ["chrome", "firefox"]) {
      const browserDir = path.join(unpackedDir, browser);

      if (fs.existsSync(browserDir)) {
        await createZipArchive(browserDir, path.join(packageDir, `extension-${browser}.zip`));
        console.log(`${browser.charAt(0).toUpperCase() + browser.slice(1)} extension packaged successfully.`);
      } else {
        console.error(`Error: ${browserDir} does not exist. Build the extension first.`);
      }
    }

    console.log("Packaging process completed. Extensions are in the package folder.");
  } catch (error) {
    console.error("Packaging process failed:", error);
  }
}

packageExtensions();
