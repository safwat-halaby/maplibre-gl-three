This library brings [Three.JS](https://threejs.org/) capabilities into [Maplibre-gl-js](https://maplibre.org/). Currently focused on enabling [3DTiles](https://cesium.com/why-cesium/3d-tiles/) in MapLibre. It internally relies on [3d-tiles-renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS).

Latest version: `maplibre-gl-three@0.0.9`

**This project is not officially affiliated with MapLibre**

## Installation and basic usage

**NPM install**:

```sh
npm install three 3d-tiles-renderer maplibre-gl maplibre-gl-three 
```

**Load 3dTiles:**

```js
import {ThreeDManager} from 'maplibre-gl-three';
import {Map} from 'maplibre-gl';

const threeDManager = new ThreeDManager();
const agiHqTiles = await threeDManager.load3dTiles({
    tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
    layerId: 'agiHqTiles',
    offset: { east: 0, up: -300, south: 0 },
});
const map = new Map({
    container: 'YOUR-HTML-MAPLIBRE-CONTAINER',
    zoom: 16,
    center: [-75.596, 40.038],
    pitch: 55,
    bearing: -20,
    maxPitch: 85,
    style: 'YOUR-MAPLIBRE_STYLE'
});
map.addLayer(agiHqTiles.getLayer());
```

**Swapping to new tiles:**

```js
tiles.destroy(); // will implicitly call map.removeLayer('agiHqTiles'); if needed
const tiles2 = await threeDManager.load3dTiles({tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json'});
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
- `verticalDatum.enabled`: Optional flag controlling whether the vertical datum is loaded and applied. This will make the model have the proper height above sea level, and the ground will sit at a height matching the height of a Maplibre RGB Terrain. This entails loading a vertical datum file from the network. EGM96 height (EPSG:5773). Size: 2.6 MB. Default is `true`. Setting to `false` means no network request will take place, but means you likely need to apply a vertical offset to get the right height, using the `offset` option. Note that if the raw data has vertical errors, you may still need to apply an offset regardless of this flag. More info about the file and the CDN used can be found here: https://github.com/OSGeo/PROJ-data/tree/master
- `verticalDatum.path`: Optional URL of the GeoTIFF vertical datum file. Defaults to `https://cdn.proj.org/us_nga_egm96_15.tif`. Ignored if the vertical datum corrections are disabled via `verticalDatum.enabled`. More info about the file and the CDN used can be found here: https://github.com/OSGeo/PROJ-data/tree/master  
- Additionally, `calculateAnchorPoint(mapInstance)` and `getTransformParameters(anchor4326)` are advanced callbacks for overriding the calculation of the anchor point and the internal transform parameters, respectively. In the future the usage of these callbacks may be better documented. In the meantime see [www/examples/other/plate-carree/](www/examples/other/plate-carree/) for a usage example of the plate-carree projection. 

**load3dTiles optional options**:
- `offset`: Optional `{ east, up, south }` translation applied to the 3d tiles in meters.
- `preprocessUrl(url)`: Optional callback used to rewrite asset URLs before `3d-tiles-renderer` fetches them.

## Project status

This project forked from the [official Maplibre 3d Tiles example](https://maplibre.org/maplibre-gl-js/docs/examples/add-3d-tiles-using-threejs/). I am confident it is better than the existing example in almost every way, and if you are willing to use that for production, you should be comfortable using this project as well. However, I do not consider this project fully production ready. In particular, the documentation can be improved a lot to demonstrate the full potential of mixing Maplibre Style Spec with 3d tiles.

The project aims to be minimally scoped by design, and it will always be glue code between the libraries that do the heavy lifting. But some future features are in my mind. See [todos.md].

**List of improvements over the official example:**

- A very simple and intuitive API that doesn't expose the internals.
- Better anchoring algorithm, ensuring precision even when moving away from the model's center.
- Supports any `root.transform` matrix. In contrast, the official example assumes a particular matrix so some models will not align in the proper place.

**Known regressions:**

- The 3d tiles become misaligned if the camera pans away and zooms out far enough from the model. This is related to the anchoring algorithm and will be improved later. 

## List of features

soon.

## CDNs and direct browser import

You don't have to use a package manager. The repository contains an example for a [direct dependency import from a CDN](www/examples/basic/maplibreGlThree-cdn-example). If you prefer to host all the dependencies yourself, there's also [a self-hosting example](www/examples/basic/maplibreGlThree-selfhost-example). There's a convenience script to run these examples. See the next section.

## Run the examples and demos

`www/examples/basic/maplibreGlThree-npm-example` has a basic npm project which uses this library as a dependency. Check its [README](www/examples/basic/maplibreGlThree-npm-example/README.md) for running instructions.

To the non-npm examples:  

```sh
npm install
npm syncDeps
npm run build
node-static-server.sh
```

...then browse to `http://localhost:6153`.

## See also

- [Development](development.md)
- [Changelog](CHANGELOG.md)
- [License](LICENSE.txt)
- [TODOS.md](todos.md)

## Known issues / Notes


- Does not yet work with the globe projection. (why?)
