Brings [ThreeJS](https://threejs.org/) capabilities into [Maplibre-gl-js](https://maplibre.org/). Currently focused on enabling [3DTiles](https://cesium.com/why-cesium/3d-tiles/) in MapLibre.

internally relies on [3d-tiles-renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS).

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

The repository contains a minimal [NPM-based example project](www/examples/basic/maplibreGlThree-npm-example) running the code above.

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
- `dracoPath`: The path to the Draco loader to be lazy loaded. Defaults to `https://unpkg.com/three@0.183.2/examples/jsm/libs/draco/`.
- `ktx2Path`: The path to the ktx2 loader. Defaults to `https://unpkg.com/three@0.183.2/examples/jsm/libs/basis/`.
- Additionally, `handleAnchorPoint(mapInstance)` and `getTransformParameters(anchor4326)` are advanced callbacks for overriding the calculation of the anchor point and the internal transform parameters, respectively. In the future the usage of these callbacks may be better documented. In the meantime see [www/examples/other/plate-caree/](www/examples/other/plate-caree/) for a usage example of the plate-caree projection. 

**load3dTiles optional options**:
- `offset`: Optional `{ east, up, south }` translation applied to the 3d tiles in meters.


## CDNs and direct browser import

You don't have to use a package manager. The repository contains an example for a [direct dependency import from a CDN](www/examples/basic/maplibreGlThree-cdn-example). If you prefer to host all the dependencies yourself, there's also [a self-hosting example](www/examples/basic/maplibreGlThree-selfhost-example). There's a convenience script to run these examples. See the next section.

## Run the examples and demos

You can locally the examples by running `node-static-server.sh` then browsing to `http://localhost:6153`. These include:

- Non-npm Bundling options
  - CDN
  - Self-hosting
- Interesting use cases
  - TODO heightmap
- Exotic use cases
  - Use Maplibre+ThreeJS with "unprojected" / Plate Carree background tiles [www/examples/other/plate-caree/](www/examples/other/plate-caree/). Some more documentation may be provided in the future.

## Development

To keep it simple there is currently no compilation/packing/minifcation step. The source code which is at `src/library` is what is ultimately published. This will possibly change in the future to properly support TypeScript.

You can develop locally by pointing `maplibreGlThree-npm-example` to the local files rather than npm. In `package.json` put this line in the dependencies: `"maplibre-gl-three": "file:../../.."`. Alternatively, you can run `node-static-server.sh` which serves the non-npm examples. Modify the source code and refresh the page. No build step.

## Known issues / Notes

- Tiles go wild if camera moves away far enough.
- Does not yet work with the globe projection.

## TODOS

See [TODOS.md](TODOS.md).