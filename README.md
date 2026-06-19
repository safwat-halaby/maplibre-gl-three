Glue code that brings the 3d capabilities of ThreeJS into MapLibre.

**This project is not officially affiliated with MapLibre**

## Project status

Repo is still under construction. The project is in its infancy doesn't really work yet.

## Pull request policy

As of now, no pull requests are accepted. The situation will likely change once the repository structure is sufficiently stable.

## Usage

Initialization

```js
import {ThreeDManager} from 'maplibre-gl-three';

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

**ThreeDManager constructor options**:
- `debugMode`: Optional: If true, will render the 3JS anchor point for debugging purposes
- `dracoPath`: Optional: The path to the Draco lader to be lazy loaded. Defaults to `https://unpkg.com/three@0.183.0/examples/jsm/libs/draco/`. If you'd like to self-host this folder, it is included in `www/dependencies/three@0.183.0/examples/jsm/libs/draco/`
- `ktx2Path`: The path to the ktx2 loader. Defaults to `https://unpkg.com/three@0.183.0/examples/jsm/libs/basis/`. If you'd like to self-host this folder, it is included in `https://unpkg.com/three@0.183.0/examples/jsm/libs/basis/`


## Todos

**Must:**

* Proper API
* reproject callbacks
* NPM-ify and upload

**Should:**

* prevent the anchor from leaving the 3d tile
* altOffset
* use npm dependencies rather than lazy loading draco, if possible

**Could :**

* Support multiple 3d tiles
* Support 3d models in addition to 3d tiles
* Typescript

## Known issues / Notes
- Tiles go wild if camera moves away far enough.
- Does not yet work with the globe projection
- proj4 - not provided as an ES module

