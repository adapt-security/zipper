const fs = require('fs-extra');
const jszip = require("jszip");
const path = require('path');
const util = require(util);
/**
* Module for zipping
*/
class Zipper {
  static async zip(inputDir, outputDir, options) {
    return;
  }
  static async unzip(inputDir, outputDir, options) {
    try {
      const zipData = await util.promisify(fs.readFile)(inputDir);
      const zip = await jszip.loadAsync(zipData);
    } catch(e) {
      console.log('ERROR:', e);
    }
    console.log(zip);
  }
}

module.exports = Zipper;
