import fs from 'fs';
import path from 'path';

const updateVersion = (env) => {
  const envFile = `.env.${env}`;
  const envPath = path.resolve(process.cwd(), envFile);
  
  if (!fs.existsSync(envPath)) {
    console.error(`Environment file ${envFile} not found`);
    process.exit(1);
  }

  let content = fs.readFileSync(envPath, 'utf8');
  const versionMatch = content.match(/VITE_APP_VERSION=(\d+)\.(\d+)\.(\d+)-(\w+)/);
  
  if (!versionMatch) {
    console.error('Version pattern not found in env file');
    process.exit(1);
  }

  const [, major, minor, patch] = versionMatch;
  let newMajor = parseInt(major);
  let newMinor = parseInt(minor);
  let newPatch = parseInt(patch) + 1;

  // If patch reaches 10, increment minor and reset patch
  if (newPatch > 9) {
    newMinor += 1;
    newPatch = 0;
    // If minor reaches 10, increment major and reset minor
    if (newMinor > 9) {
      newMajor += 1;
      newMinor = 0;
    }
  }

  const newVersion = `${newMajor}.${newMinor}.${newPatch}-${env}`;
  
  content = content.replace(
    /VITE_APP_VERSION=.*/,
    `VITE_APP_VERSION=${newVersion}`
  );

  fs.writeFileSync(envPath, content);
  console.log(`Version updated to ${newVersion}`);
};

const env = process.argv[2];
if (!env) {
  console.error('Environment not specified');
  process.exit(1);
}

updateVersion(env);
