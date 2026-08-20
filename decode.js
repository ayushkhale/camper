const fs = require('fs'); fs.writeFileSync('c:/Camper/src/Screens/SplashScreen.jsx', Buffer.from(process.argv[2], 'base64').toString('utf8')); 
