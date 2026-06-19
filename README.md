Glue code which brings 3dTiles to MapLibre using 3JS.

**This project is not officially affiliated with MapLibre**

## Project status

Repo is still under construction. The project is in its infancy doesn't really work yet.

**Pull request policy:** As of now, no pull requests are accepted. The situation will likely change once the repository structure is stable.

## Installation

**Option 1: NPM install**:

```sh
npm install maplibre-gl-three maplibre-gl three 3d-tiles-renderer proj4
``` 

A full NPM/Webpack example can be found at [www/examples/basic/maplibreGlThree-npm-example](www/examples/basic/maplibreGlThree-npm-example). Usage:

```sh
cd www/examples/basic/maplibre-gl-three-npm-example
npm install
npm run build
npm run start
```

**Option 2: Direct browser import:**

See [www/examples/basic/maplibreGlThree-bundle-example/index.html](www/examples/basic/maplibreGlThree-bundle-example/index.html) for a self-hosting example and [www/examples/basic/maplibreGlThree-npm-example/index.html](www/examples/basic/maplibreGlThree-cdn-example/index.html) for a CDN example. 

To run these examples locally, run a local static file server with:

```sh
cd utils/express-static-server
npm install
node static-server.js 6153
```

*(...Or by running `node-static-server.sh` or any other local web server which serves [www/depedencies/](www/depedencies/) and [src/library/](src/library/))*

Then open one of these files:
- self-hosted dependencies option: `http://localhost:6153/examples/basic/maplibreGlThree-selfhost-example/index.html` 
- CDN option: `http://localhost:6153/examples/basic/maplibreGlThree-cdn-example/index.html` 

## Usage

The following code snippets work as-is if you use the NPM installation method. If using direct browser imports, make sure you include your scripts as modules e.g. `<script src="script.js" type="module"></script>`. 

See below for full hello-world example projects.

```js
import {ThreeDManager} from 'maplibre-gl-three';
import maplibregl from 'maplibre-gl';

const threeDManager = new ThreeDManager();
const agiHqTiles = threeDManager.load3dTiles({
    tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
    layerId: 'agiHqTiles'
    });
const map = new maplibregl.Map(/* Your typical Maplibre initialization here*/);
map.addLayer(agiHqTiles.getLayer());
```

Swapping to new tiles:

```js
tiles.destroy(); // will implicitly call map.removeLayer('agiHqTiles'); if needed
const tiles2 = threeDManager.load3dTiles({tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json'});
map.addLayer(tiles2.getLayer());
```

Teardown:

```js
threeDManager.destroy(); // will implicitly call destroy() on all assets not yet destroyed.
```

**ThreeDManager optional constructor options**:
- `debugMode`: If true, will render the 3JS anchor point for debugging purposes
- `dracoPath`: The path to the Draco loader to be lazy loaded. Defaults to `https://unpkg.com/three@0.183.0/examples/jsm/libs/draco/`. If you'd like to self-host this folder, it is included in `www/dependencies/three@0.183.0/examples/jsm/libs/draco/`
- `ktx2Path`: The path to the ktx2 loader. Defaults to `https://unpkg.com/three@0.183.0/examples/jsm/libs/basis/`. If you'd like to self-host this folder, it is included in `https://unpkg.com/three@0.183.0/examples/jsm/libs/basis/`.

## Development

The project is just glue code, so to keep it simple there is currently no compilation/packing/minifcation step. The source code which is at `src/library` is what is ultimately published.

You can develop locally by pointing `maplibreGlThree-npm-example` to the local files rather than npm: `"maplibre-gl-three": "file:../../.."`.

Alternatively, run `node-static-server.sh` which serves the direct browser example. Modify the source code and refresh the page. No build step.

## Known issues / Notes
- Tiles go wild if camera moves away far enough.
- Does not yet work with the globe projection
