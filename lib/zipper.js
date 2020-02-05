const fs = require('fs-extra');
const jszip = require("jszip");
const klaw = require("klaw");
const path = require('path');
/**
* Module for zipping
*/
class Zipper {
  static async zip(inputDir, outputDir=path.dirname(inputDir), options = {}) {
    await pWrite(await createZipObject(inputDir), outputDir);
    if(options.removeSource) await fs.remove(inputDir);
  }
  static async unzip(zipPath, outputDir=path.dirname(zipPath), options = {}) {
    const { dirs, files } = await processZip(zipPath);

    await Promise.all(dirs.map(async d => fs.ensureDir(path.join(outputDir, d))));
    await Promise.all(files.map(async f => pWrite(f, path.join(outputDir, f.name))));

    if(options.removeSource) await fs.remove(zipPath);
  }
}

async function createZipObject(inputDir) {
  const zip = new jszip();
  await pKlaw(inputDir, d => {
    if(!d.stats.isDirectory()) {
      zip.file(path.relative(inputDir, d.path), fs.createReadStream(d.path));
    }
  });
  return zip;
}

async function processZip(zipPath) {
  const zip = await jszip.loadAsync(await fs.readFile(zipPath));
  return Object.values(zip.files).reduce((m,f) => {
    if(f.dir) {
      m.dirs.push(f.name);
    } else {
      m.files.push(f);
    }
    return m;
  }, { dirs: [], files: [] });
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
  let stream;
  if(zip.generateNodeStream) {
    stream = zip.generateNodeStream();
  } else if(zip.nodeStream) {
    stream = zip.nodeStream();
  }
  if(!stream) {
    throw new Error('Unknown zip input');
  }
  return new Promise((resolve, reject) => {
    stream
      .pipe(fs.createWriteStream(outputDir))
      .on('error', (e) => reject(e))
      .on('finish', () => resolve());
  });
}

module.exports = Zipper;
