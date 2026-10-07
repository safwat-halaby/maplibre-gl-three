# Development

The code is currently hosted at [GitHub](https://github.com/safwat-halaby/maplibre-gl-three). The TypeScript source code lives in `src/library`. To generate the library in the `dist/` folder:

```
npm install
npm run syncDeps
npm run build:watch
```

*...or `npm run build` for a one-time generation*

For subsequent runs, `npm run build:watch` is enough as long as dependencies are unmodified.

You probably also want to run a basic browser frontend project in parallel, which uses your local version of the `dist/` folder as a dependency. There are 2 methods:

1. Use [`www/examples/basic/maplibreGlThree-npm-example`](https://github.com/safwat-halaby/maplibre-gl-three/tree/master/www/examples/basic/maplibreGlThree-npm-example).
  - Point that project to the local `dist` files rather than the npm registry by running `npm run local_dependency`
  - Then run that project according to its readme.

2. Use [`maplibreGlThree-selfhost-example`](https://github.com/safwat-halaby/maplibre-gl-three/tree/master/www/examples/basic/maplibreGlThree-selfhost-example). Run `./node-static-server.sh` and browse to `http://localhost:6153/examples/basic/maplibreGlThree-selfhost-example/index.html`.

In either case refresh your page after changing things in the library's source code.

## Build the documentation

Install the Python documentation dependencies, then generate the API reference and site:

```sh
python -m pip install -r docs/requirements.txt
npm run docs:serve
```

The TypeDoc output is generated in `docs/api/` and is not committed to the repository.

To update the pinned Python documentation dependencies after editing `docs/requirements.in`:

```sh
python -m pip install uv
python -m uv pip compile --python-version 3.12 --output-file docs/requirements.txt docs/requirements.in
```

## Docs formatting rules

Use ordinary text for library display names, geographic concepts, and measurements: Three.js, Web Mercator, 

Use inline code (backticks) for exact identifiers and code: `ThreeDManager`, `height`, `true`, `layer.load3dTiles()`. If it's a function call, always have `()`. Do not use backticks in titles.

Use inline code for EPSG codes, package names, paths, commands, and version strings: `EPSG:4326`, `maplibre-gl-three`, `docs/index.md`, `npm run build`, `2.0.0`. Exceptions: Version numbers in the changelog titles. Version numbers not involving semantic versioning e.g. "MapLibre 6" in prose.

Write exact geographical numbers with backticks, e.g. `-20037508.3427892`.

Write coordinates or vectors as `[34, 35]`, `[1, 2, 3]`.

API links in markdown use backticks and link to `api/index.md`:

```text
See [`ThreeDManager`](api/index.md#threedmanager)
```

API links in TSDoc use `@link` e.g.

```text
{@link ThreeDManager}
```

Whether to use a link or not for classes/methods is context dependant. Apply judgement.

## Exact formatting for specific phrases

**Library display names:**

```
maplibre-gl-three, Three.js, 3d-tiles-renderer, GeoTIFF.js,
MapLibre GL JS ("MapLibre" if context is obvious),
```
**Data formats:**

```
3D Tiles, GeoJSON, GeoTIFF, glTF, GLB, KTX2
```

**Runtime, development related stuff**:

```
npm, Node.js, JavaScript, TypeScript,
GitHub, Read the Docs, jsDelivr, WebGL
```

**Coordinate systems and EPSG codes:**

```
WGS84 (`EPSG:4326`)
ECEF (`EPSG:4978`)
Web Mercator (`EPSG:3857`)
EGM96 height (`EPSG:5773`)
WGS84 + EGM96 height (`EPSG:9707`)
```

One doesn't always have to specify both the display name and EPSG. apply common sense.
