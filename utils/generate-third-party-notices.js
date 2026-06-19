// this code is entirely AI-generated. It generates the THIRD-PARTY-NOTICES.txt file and isn't used in the project
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NOTICE_FILE = path.join(ROOT, 'THIRD-PARTY-NOTICES.txt');
const TMP_DIR = path.join(os.tmpdir(), 'maplibre-gl-three-third-party-notices');

const browserPackages = [
  {
    id: 'maplibre-gl@5.7.3',
    name: 'MapLibre GL JS 5.7.3',
    location: 'www/dependencies/maplibre/',
    npm: 'maplibre-gl',
    version: '5.7.3',
  },
  {
    id: 'three@0.183.0',
    name: 'three 0.183.0',
    location: 'www/dependencies/three@0.183.0/',
    npm: 'three',
    version: '0.183.0',
  },
  {
    id: '3d-tiles-renderer@0.4.21',
    name: '3D Tiles Renderer JS 0.4.21',
    location: 'www/dependencies/3d-tiles-renderer@0.4.21/',
    npm: '3d-tiles-renderer',
    version: '0.4.21',
  },
  {
    id: 'proj4@2.20.9',
    name: 'Proj4js 2.20.9',
    location: 'www/dependencies/proj4/',
    npm: 'proj4',
    version: '2.20.9',
  },
  {
    id: 'ktx-parse@1.1.0',
    name: 'ktx-parse 1.1.0',
    location: 'www/dependencies/three@0.183.0/examples/jsm/libs/ktx-parse.module.js',
    npm: 'ktx-parse',
    version: '1.1.0',
  },
  {
    id: 'zstddec@0.2.0',
    name: 'zstddec 0.2.0',
    location: 'www/dependencies/three@0.183.0/examples/jsm/libs/zstddec.module.js',
    npm: 'zstddec',
    version: '0.2.0',
  },
];

const rawSourceBlocks = [
  {
    id: 'google-draco@1.5.7/LICENSE',
    name: 'Google Draco decoder 1.5.7 license',
    location: 'www/dependencies/three@0.183.0/examples/jsm/libs/draco/',
    source: 'https://raw.githubusercontent.com/google/draco/1.5.7/LICENSE',
  },
];

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function text(value) {
  return Buffer.from(value, 'utf8');
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'maplibre-gl-three-notice-generator' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirected = new URL(response.headers.location, url).toString();
        response.resume();
        fetchBuffer(redirected).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Failed to fetch ${url}: HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function fetchJson(url) {
  return JSON.parse((await fetchBuffer(url)).toString('utf8'));
}

function ensureCleanTempDir() {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function removeTempDir() {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
}

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

async function fetchNpmTarballUrl(name, version) {
  const metadata = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(name).replace('%40', '@')}/${version}`);
  return metadata.dist.tarball;
}

async function extractLicenseFilesFromTarball({ id, name, source }) {
  const packageDir = path.join(TMP_DIR, safeName(id));
  const tgzPath = path.join(TMP_DIR, `${safeName(id)}.tgz`);
  fs.mkdirSync(packageDir, { recursive: true });
  fs.writeFileSync(tgzPath, await fetchBuffer(source));

  const result = spawnSync('tar', ['-xzf', tgzPath, '-C', packageDir], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`Failed to extract ${source}: ${result.stderr || result.stdout}`);
  }

  const root = path.join(packageDir, 'package');
  const candidates = fs.readdirSync(root)
    .filter((file) => /^(licen[cs]e|copying|notice)(\.|$)/i.test(file))
    .map((file) => path.join(root, file))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

  if (candidates.length === 0) {
    const packageJsonPath = path.join(root, 'package.json');
    let license = 'UNKNOWN';
    if (fs.existsSync(packageJsonPath)) {
      license = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).license || 'UNKNOWN';
    }

    return [{
      id,
      name,
      source,
      sourcePath: 'package.json license field only; no license text file was present in the package tarball',
      license,
      content: Buffer.alloc(0),
      missingText: true,
    }];
  }

  return candidates.map((filePath) => ({
    id: `${id}/${path.basename(filePath)}`,
    name,
    source,
    sourcePath: `package/${path.basename(filePath)}`,
    content: fs.readFileSync(filePath),
  }));
}

async function npmPackageBlocks(packages) {
  const blocks = [];
  for (const pkg of packages) {
    const source = pkg.resolved || await fetchNpmTarballUrl(pkg.npm, pkg.version);
    blocks.push(...await extractLicenseFilesFromTarball({
      id: pkg.id || `${pkg.npm}@${pkg.version}`,
      name: pkg.name || `${pkg.npm} ${pkg.version}`,
      source,
    }));
  }

  return blocks;
}

function extractProj4EqualEarthNotice() {
  const filePath = path.join(ROOT, 'www', 'dependencies', 'proj4', 'proj4-src.js');
  const source = fs.readFileSync(filePath);
  const content = source.toString('utf8');
  const start = content.indexOf('/**\n   * Copyright 2018 Bernie Jenny');
  const end = content.indexOf('*/', start);
  if (start === -1 || end === -1) {
    throw new Error('Could not find the Equal Earth notice in proj4-src.js');
  }

  return {
    id: 'proj4-equal-earth-notice',
    name: 'Proj4js embedded Equal Earth projection notice',
    source: 'www/dependencies/proj4/proj4-src.js',
    sourcePath: 'embedded source comment',
    content: Buffer.from(content.slice(start, end + 2), 'utf8'),
  };
}

async function rawBlocks() {
  const blocks = [];
  for (const sourceBlock of rawSourceBlocks) {
    blocks.push({
      id: sourceBlock.id,
      name: sourceBlock.name,
      location: sourceBlock.location,
      source: sourceBlock.source,
      content: await fetchBuffer(sourceBlock.source),
    });
  }
  blocks.push(extractProj4EqualEarthNotice());
  return blocks;
}

function appendVerbatimBlock(parts, block) {
  parts.push(text(`BEGIN VERBATIM SOURCE: ${block.id}\n`));
  parts.push(text(`NAME: ${block.name}\n`));
  if (block.location) parts.push(text(`LOCATION: ${block.location}\n`));
  parts.push(text(`SOURCE: ${block.source}\n`));
  if (block.sourcePath) parts.push(text(`SOURCE-PATH: ${block.sourcePath}\n`));

  if (block.missingText) {
    parts.push(text(`PACKAGE-LICENSE-FIELD: ${block.license}\n`));
    parts.push(text('NOTICE: No license text file was present in the package tarball.\n'));
    parts.push(text(`END VERBATIM SOURCE: ${block.id}\n\n`));
    return;
  }

  parts.push(text(`SHA256: ${sha256(block.content)}\n`));
  parts.push(text('CONTENT-BEGIN\n'));
  parts.push(block.content);
  if (block.content.length > 0 && block.content[block.content.length - 1] !== 0x0a) {
    parts.push(text('\n'));
  }
  parts.push(text(`CONTENT-END\nEND VERBATIM SOURCE: ${block.id}\n\n`));
}

async function generate() {
  ensureCleanTempDir();
  try {
    const browserBlocks = await npmPackageBlocks(browserPackages);
    const otherBlocks = await rawBlocks();

    const parts = [];
    parts.push(text('THIRD-PARTY NOTICES\n'));
    parts.push(text('===================\n\n'));
    parts.push(text('This file is generated. Do not manually type license text into this file; regenerate it from authoritative sources instead.\n\n'));

    parts.push(text('Bundled browser dependencies\n'));
    parts.push(text('----------------------------\n'));
    for (const pkg of browserPackages) {
      parts.push(text(`${pkg.name}\nLocation: ${pkg.location}\nNotice source: npm package ${pkg.npm}@${pkg.version}\n\n`));
    }
    for (const block of rawSourceBlocks) {
      parts.push(text(`${block.name}\nLocation: ${block.location}\nNotice source: ${block.source}\n\n`));
    }

    parts.push(text('Data\n'));
    parts.push(text('----\n'));
    parts.push(text('Natural Earth raster map data\nLocation: www/datasets/natural-earth/\nTerms source: https://www.naturalearthdata.com/about/terms-of-use/\n\n'));

    parts.push(text('Verbatim source texts\n'));
    parts.push(text('---------------------\n'));
    for (const block of [...browserBlocks, ...otherBlocks]) {
      appendVerbatimBlock(parts, block);
    }

    return Buffer.concat(parts);
  } finally {
    removeTempDir();
  }
}

async function main() {
  const expected = await generate();
  if (process.argv.includes('--verify')) {
    const actual = fs.readFileSync(NOTICE_FILE);
    if (!actual.equals(expected)) {
      console.error('THIRD-PARTY-NOTICES.txt does not match generated output.');
      console.error(`actual sha256:   ${sha256(actual)}`);
      console.error(`expected sha256: ${sha256(expected)}`);
      process.exit(1);
    }
    console.log(`Verified THIRD-PARTY-NOTICES.txt (${sha256(actual)}).`);
    return;
  }

  fs.writeFileSync(NOTICE_FILE, expected);
  console.log(`Wrote THIRD-PARTY-NOTICES.txt (${sha256(expected)}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
