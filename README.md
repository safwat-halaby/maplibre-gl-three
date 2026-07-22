This library brings [Three.JS](https://threejs.org/) capabilities into [Maplibre-gl-js](https://maplibre.org/). Currently focused on enabling [3DTiles](https://cesium.com/why-cesium/3d-tiles/) in MapLibre. It internally relies on [3d-tiles-renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS).

Latest version: `maplibre-gl-three@0.0.7`

**This project is not officially affiliated with MapLibre**

## Project status

Repo is still under construction. The project is in its infancy.

As of now, no pull requests are accepted. The situation will likely change once the repository structure is stable.

## Installation and basic usage

**NPM install**:

```sh
npm install three 3d-tiles-renderer maplibre-gl maplibre-gl-three 
```

**Load 3dTiles:**

```js
import {ThreeDManager} from 'maplibre-gl-three';
import maplibregl from 'maplibre-gl';

const threeDManager = new ThreeDManager();
const agiHqTiles = threeDManager.load3dTiles({
    tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
    layerId: 'agiHqTiles',
    offset: { east: 0, up: -300, south: 0 },
});
const map = new maplibregl.Map(
    container: 'YOUR-HTML-MAPLIBRE-CONTAINER',
    zoom: 16,
    center: [-75.596, 40.038],
    pitch: 55,
    bearing: -20,
    maxPitch: 85,
    style: 'YOUR-MAPLIBRE_STYLE'
);
map.addLayer(agiHqTiles.getLayer());
```

**Swapping to new tiles:**

```js
tiles.destroy(); // will implicitly call map.removeLayer('agiHqTiles'); if needed
const tiles2 = threeDManager.load3dTiles({tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json'});
map.addLayer(tiles2.getLayer());
```

**Teardown:**

```js
threeDManager.destroy(); // will implicitly call destroy() on all assets not yet destroyed.
```

**ThreeDManager optional constructor options**:
- `debugMode`: If true, will render the 3JS anchor point for debugging purposes.
- `dracoPath`: The path to the Draco loader to be lazy loaded. Defaults to `https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/draco/`.
- `ktx2Path`: The path to the ktx2 loader. Defaults to `https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/basis/`.
- Additionally, `calculateAnchorPoint(mapInstance)` and `getTransformParameters(anchor4326)` are advanced callbacks for overriding the calculation of the anchor point and the internal transform parameters, respectively. In the future the usage of these callbacks may be better documented. In the meantime see [www/examples/other/plate-carree/](www/examples/other/plate-carree/) for a usage example of the plate-carree projection. 

**load3dTiles optional options**:
- `offset`: Optional `{ east, up, south }` translation applied to the 3d tiles in meters.
- `preprocessUrl(url)`: Optional callback used to rewrite asset URLs before `3d-tiles-renderer` fetches them.


## CDNs and direct browser import

You don't have to use a package manager. The repository contains an example for a [direct dependency import from a CDN](www/examples/basic/maplibreGlThree-cdn-example). If you prefer to host all the dependencies yourself, there's also [a self-hosting example](www/examples/basic/maplibreGlThree-selfhost-example). There's a convenience script to run these examples. See the next section.

## Run the examples and demos

`www/examples/basic/maplibreGlThree-npm-example` has a basic npm project which uses this library as a dependency. Check its [README](www/examples/basic/maplibreGlThree-npm-example/README.md) for running instructions.

To  run the rest of the non-npm examples:  

```sh
npm install
npm updateDeps
npm run build
node-static-server.sh
```

...then browse to `http://localhost:6153`.

## Development

The TypeScript source code lives in `src/library`. To generate the library in the `dist/` folder:

```
npm install
npm updateDeps
npm run build:watch
```

*...or `npm run build` for a one-time generation*

For consequent runs, `npm run build:watch` is enough as long as dependencies are unmodified. 

You probably also want run a basic browser frontend project in parallel, which uses your local version of the `dist/` folder as a dependency. There are 2 methods:

1. Use [www/examples/basic/maplibreGlThree-npm-example](www/examples/basic/maplibreGlThree-npm-example/).
  - Point that project to the local `dist` files rather than the npm registry by running `npm run local_dependency`
  - Then run that project according to [its readme](www/examples/basic/maplibreGlThree-npm-example/README.md).

2. Use [maplibreGlthree-selfhost-example](www/examples/basic/maplibreGlThree-selfhost-example). Run `node-static-server.sh` and browse to `http://localhost:6153/examples/basic/maplibreGlThree-selfhost-example/index.html`.

In either case refresh your page after changing things in the library's source code.

## Known issues / Notes

- Tiles go wild if camera moves away far enough.
- Does not yet work with the globe projection. (why?)

## See also

- [Changelog](CHANGELOG.md)
- [License](LICENSE.txt)
- [TODOS.md](TODOS.md).