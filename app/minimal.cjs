const fs = require('fs')
// write immediately so we know the script ran
fs.writeFileSync('C:/Temp/elec-diag.txt',
  `pid=${process.pid}\n` +
  `type=${process.type}\n` +
  `versions.electron=${process.versions.electron}\n` +
  `ELECTRON_RUN_AS_NODE=${process.env.ELECTRON_RUN_AS_NODE}\n` +
  `electron module=${typeof require('electron')}\n`
)
process.exit(0)
