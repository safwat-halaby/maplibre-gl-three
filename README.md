Glue code which brings [ThreeJS](https://threejs.org/) capabilities into [Maplibre-gl-js](https://maplibre.org/). Currently focused on 3dTiles. internally uses [3d-tiles-renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS).

**This project is not officially affiliated with MapLibre**

## Project status

Repo is still under construction. The project is in its infancy.

As of now, no pull requests are accepted. The situation will likely change once the repository structure is stable.

## Installation and basic usage

**NPM install**:

```sh
npm install maplibre-gl three maplibre-gl-three 3d-tiles-renderer
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
const map = new maplibregl.Map(/* Your typical Maplibre initialization here*/);
map.addLayer(agiHqTiles.getLayer());
```

The repo contains a minimal [NPM-based example project](www/examples/basic/maplibreGlThree-npm-example) running the code abov. You can try it out with: 

```sh
cd www/examples/basic/maplibre-gl-three-npm-example
npm install
npm start
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


## CDNs and direct browser import

You don't have to use a package manager. The repo contains an example of [direct dependency import from a CDN](www/examples/basic/maplibreGlThree-cdn-example). To run it locally:

```sh
cd utils/express-static-server
npm install
node static-server.js 6153
```

*(Or by running `node-static-server.sh` or any other local web server which serves [www/examples/](www/examples/) at `/examples`)*

Then browse to http://localhost:6153/examples/basic/maplibreGlThree-cdn-example/index.html

If you prefer to self-host all the dependencies, generate the `www/dependencies` by running `npm install`, then start a local server as above and browse to http://localhost:6153/examples/basic/maplibreGlThree-selfhost-example/index.html 

*(You can also run `node-static-server.sh` or any other local web server which serves [www/dependencies/](www/dependencies/) at `/dependencies` and [src/library/](src/library/) at `/library`)*

## Configuration

**ThreeDManager optional constructor options**:
- `debugMode`: If true, will render the 3JS anchor point for debugging purposes.
- `dracoPath`: The path to the Draco loader to be lazy loaded. Defaults to `https://unpkg.com/three@0.183.2/examples/jsm/libs/draco/`.
- `ktx2Path`: The path to the ktx2 loader. Defaults to `https://unpkg.com/three@0.183.2/examples/jsm/libs/basis/`.

**load3dTiles optional options**:
- `offset`: Optional `{ east, up, south }` translation applied in the local 3JS frame before anchoring.

## Interesting use cases

If you have a height map of the same area, you can use the transparent terrain trick. TODO describe this further.

## Exotic use cases

TODO describe plate caree projections.

## Development

The project is just glue code, so to keep it simple there is currently no compilation/packing/minifcation step. The source code which is at `src/library` is what is ultimately published.

You can develop locally by pointing `maplibreGlThree-npm-example` to the local files rather than npm. In `package.json` put this line in the dependencies: `"maplibre-gl-three": "file:../../.."`.

Alternatively, run `node-static-server.sh` which serves the direct browser example. Modify the source code and refresh the page. No build step.

## Known issues / Notes
- Tiles go wild if camera moves away far enough.
- Does not yet work with the globe projection.
