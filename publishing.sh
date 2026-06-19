The root `package.json` publishes `src/library/maplibre-gl-three.js` as the package entrypoint.

NPM publish checklist:

- Confirm `package.json` has the intended `name`, `version`, `description`, `license`, `exports`, `files`, `peerDependencies`, and `devDependencies`.
- Run `npm install` from the repo root to refresh `package-lock.json` after package metadata changes.
- Run `npm pack --dry-run` and inspect the listed files. The tarball should include only the package entrypoint, package metadata, README, and license.
- Run the direct browser example and confirm `www/examples/washington/washington.html` still works through the import map route.
- Run the NPM example with `cd www/examples/npm-minimal`, `npm install`, and `npm run build`.
- Optionally test the generated tarball in a throwaway app with `npm pack`, then `npm install path/to/maplibre-gl-three-<version>.tgz`.
- Confirm NPM auth with `npm whoami`.
- Publish with `npm publish --dry-run` first.
- Publish for real with `npm publish` when the dry run output is correct.
- After publishing, install the published version in a fresh app and smoke test `import { ThreeDManager } from 'maplibre-gl-three';`.
- Update CDN imports example in `README.md`.
