const fs = require('fs');
const PNG = require('pngjs').PNG;

fs.createReadStream('c:/Camper/assets/header_bg1.png')
  .pipe(new PNG())
  .on('parsed', function() {
    let colors = {};
    for (let x = 0; x < this.width; x++) {
      let idx = (this.width * 0 + x) << 2; // y = 0
      let r = this.data[idx].toString(16).padStart(2, '0');
      let g = this.data[idx+1].toString(16).padStart(2, '0');
      let b = this.data[idx+2].toString(16).padStart(2, '0');
      let hex = `#${r}${g}${b}`;
      colors[hex] = (colors[hex] || 0) + 1;
    }
    console.log("Top row colors:", colors);
  });
