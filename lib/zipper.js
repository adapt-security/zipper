const fs = require('fs-extra');
const jszip = require("jszip");
const klaw = require("klaw");
const path = require('path');
/**
* Module for zipping
*/
class Zipper {
  static async zip(inputDir, outputDir, options = {}) {
    const zip = new jszip();
    await pKlaw(inputDir, d => {
      if(d.stats.isDirectory()) return;
      zip.file(path.relative(inputDir, d.path), fs.createReadStream(d.path));
    });
    await pWriteZip(zip, outputDir);
    if(options.removeSource) await fs.remove(inputDir);
  }
  static async unzip(inputDir, outputDir, options = {}) {
    try {
      const rs = await fs.readFile(inputDir);
      const zip = await jszip.loadAsync(rs);
      await Promise.all(Object.values(zip.files).map(f => {
        if(f.dir) return Promise.resolve();
        return fs.outputFile(path.join(outputDir, f.name), f._data.compressedContent);
      }));
      if(options.removeSource) await fs.remove(inputDir);
    } catch(e) {
      console.log('ERROR:', e);
    }
  }
}

function pKlaw(dir, dataCallback) {
  return new Promise((resolve, reject) => {
    klaw(dir)
      .on('data', d => dataCallback(d))
      .on('error', (e, item) => reject({ error: e, item }))
      .on('end', () => resolve());
  });
}
function pWrite(zip, outputDir) {
  return new Promise((resolve, reject) => {
    zip
      .generateNodeStream()
      .pipe(fs.createWriteStream(outputDir))
      .on('error', (e) => reject(e))
      .on('finish', () => resolve());
  });
}

module.exports = Zipper;
