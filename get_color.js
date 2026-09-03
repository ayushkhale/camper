const fs = require('fs');
const PNG = require('pngjs').PNG;

fs.createReadStream('c:/Camper/assets/header_bg1.png')
  .pipe(new PNG())
  .on('parsed', function() {
    // Get top row pixels
    for (let x = 0; x < Math.min(10, this.width); x++) {
      let idx = (this.width * 0 + x) << 2;
      let r = this.data[idx].toString(16).padStart(2, '0');
      let g = this.data[idx+1].toString(16).padStart(2, '0');
      let b = this.data[idx+2].toString(16).padStart(2, '0');
      console.log(`Pixel at (x=${x}, y=0) is #${r}${g}${b}`);
    }
  });
