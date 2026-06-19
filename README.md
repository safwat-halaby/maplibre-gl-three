Glue code which brings 3dTiles to MapLibre using 3JS.

**This project is not officially affiliated with MapLibre**

## Project status

Repo is still under construction. The project is in its infancy doesn't really work yet.

**Pull request policy:** As of now, no pull requests are accepted. The situation will likely change once the repository structure is stable.

## Installation

**NPM import option**:

```sh
npm install maplibre-gl-three maplibre-gl three 3d-tiles-renderer proj4
``` 

**Option 2: Direct browser import with bundled dependencies:**

```html
<link rel="stylesheet" href="/dependencies/maplibre/maplibre-gl-5.7.3.css">
<script src="/dependencies/maplibre/maplibre-gl-5.7.3.js"></script>
<script src="/dependencies/proj4/proj4.js"></script>
<script type="importmap">
{
    "imports": {
        "three": "/dependencies/three@0.183.0/build/three.module.js",
        "three/examples/jsm/": "/dependencies/three@0.183.0/examples/jsm/",
        "3d-tiles-renderer": "/dependencies/3d-tiles-renderer@0.4.21/build/index.three.js",
        "maplibre-gl": "/maplibre-gl-wrapper.js",
        "proj4": "/proj4-wrapper.js",
        "maplibre-gl-three": "/maplibre-gl-three.js"
    }
}
</script>
```

**Option 3: Direct browser import with CDN dependencies:**

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5.7.3/dist/maplibre-gl.css">
<script src="https://cdn.jsdelivr.net/npm/maplibre-gl@5.7.3/dist/maplibre-gl.js"></script>
<script src="https://cdn.jsdelivr.net/npm/proj4@2.15.0/dist/proj4.js"></script>
<script type="importmap">
{
    "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js",
        "three/examples/jsm/": "https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/",
        "3d-tiles-renderer": "https://cdn.jsdelivr.net/npm/3d-tiles-renderer@0.4.21/build/index.three.js",
        "maplibre-gl": "/maplibre-gl-wrapper.js",
        "proj4": "/proj4-wrapper.js",
        "maplibre-gl-three": "/maplibre-gl-three.js"
    }
}
</script>
```

## Usage

The following code snippets work as-is if you used the NPM installation method. If using direct browser imports, make sure you include your scripts as modules e.g. `<script src="script.js" type="module"></script>`. For a complete hello-world demo project, see `www/examples/hello-world`.

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

## Project examples

Direct import-map example:

```sh
cd utils/express-static-server
npm install
node static-server.js 6153
```

*(...Or run `node-static-server.sh`.)*

Then open `http://localhost:6153/examples/washington/washington.html`.

NPM/Webpack example:

```sh
cd www/examples/npm-minimal
npm install
npm run build
npm run start
```

## Development

in the `npm-minimal` example, point to the local files rather than npm: `"maplibre-gl-three": "file:../../.."`. This allows local changes to `src/` to be reflected in the example immediately. Alternatively, run `node-static-server.sh` which serves the direct browser example.

## Known issues / Notes
- Tiles go wild if camera moves away far enough.
- Does not yet work with the globe projection
