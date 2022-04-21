require('dotenv').config();
const path = require('path');
const os = require('os');
const shell = require('shelljs');

if (process.env.NODE_ENV !== 'development') {
  setInterval(() => {
    shell.exec(
      path.join(os.homedir(), 'Documents', 'scripts', 'resolution.sh')
    );
    shell.exec('./check-resolution.sh');
  }, 1000);
}
