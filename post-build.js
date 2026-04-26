const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'dist', 'CMS-Frontend', 'browser');
const dest = path.resolve(__dirname, '..', '..', '..');

const isHostinger = fs.existsSync(dest) && fs.existsSync(path.join(dest, '.builds'));

if (isHostinger) {
  if (!fs.existsSync(src)) {
    console.error('Build output not found at:', src);
    process.exit(1);
  }
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log('Successfully deployed build output to public_html');
} else {
  console.log('Not a Hostinger environment, skipping copy step');
}
