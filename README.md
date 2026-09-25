This library brings [Three.JS](https://threejs.org/) capabilities into [Maplibre-gl-js](https://maplibre.org/). It allows you to treat ThreeJS as MapLibre Custom Layer, rendering anything 3JS can render (inlcuding [3DTiles](https://cesium.com/why-cesium/3d-tiles/)!) along with the MapLibre Style Spec. For 3DTiles, the library internally relies on [3d-tiles-renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS).

Latest version: `maplibre-gl-three@0.0.10`

**This project is not officially affiliated with MapLibre**

## Installation and basic usage

**NPM install**:

```sh
npm install three 3d-tiles-renderer maplibre-gl maplibre-gl-three 
```

**Create a layer and load 3D Tiles:**

```js
import {ThreeDManager} from 'maplibre-gl-three';
import {Map} from 'maplibre-gl';

const map = new Map({
    terrainSkirtLength: 'none', // important if you are using a transparent maplibre terrain. Prevents vertical artifacts
    container: 'YOUR-HTML-MAPLIBRE-CONTAINER',
    zoom: 16,
    center: [-75.596, 40.038],
    pitch: 55,
    bearing: -20,
    maxPitch: 85,
    style: 'YOUR-MAPLIBRE_STYLE',
});
const threeDManager = new ThreeDManager();
await threeDManager.init();
const layer = threeDManager.createLayer();
const tilesAsset = await layer.load3dTiles({
    tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
    layerId: 'agiHqTiles',
    // Manually offset the 3dtiles down.
    // Note: Datum corrections are automatically applied! Manual corrections are only needed when there are errors in the 3DTIles data. 
    offset: { east: 0, up: -234, south: 0 }
});
map.on('load', () => map.addLayer(layer));
map.on('remove', () => threeDManager.destroy());
```

**Load ordinary threeJS objects**

The scene accepts **WGS84 ECEF positions (EPSG:4978)**. Helper functions are supplied by `threeDManager` to convert to and from the more familiar `longitude, latitude, altitude` form. `altitude` is height in meters above sea level.   

```js
import * as THREE from 'three';

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 16),
    new THREE.MeshStandardMaterial({ color: 0xff00ff }),
);
sphere.applyMatrix4(threeDManager.getEcefMatrix({ point: [-75.598, 40.040], height: 130 }));
layer.getScene().add(marker);
```

## Principles

### Object hierarchy and lifecycle

A `ThreeDManager` owns layers. Each layer owns "assets" and ThreeJS primitives (scene, camera, etc). The primitives allow direct ThreeJS access, while the "assets" are convenience wrappers, and they ultimately manipulate the same primitives. Currently the only asset type is the 3DTiles asset, created with `tilesAsset = await layer.load3dTiles(...)`.

A `ThreeDManager` is associataed with one MapLibre map. On the rare occasion of using multipel MapLibre maps, you should use multiple `ThreedManager` ocjects, one for each map.

### Lifecycle and destruction

| Operation | Effect |
| --- | --- |
| `threeDManager.destroy()` | Destroys all managed layers, and all assets managed by those layers. |
| `layer.destroy()` | Destroys the layer and destroys all its assets. |
| `asset.destroy()` | Destroys a specific asset. If it's a 3DTiles asset, frees all internal data associated with the 3dTiles model.
| `map.removeLayer(layer.id)` | Detaches the layer and disposes its renderer; preserves the scene and assets for reattachment |
| `map.addLayer(layer)` Creates a new renderer and (re)attaches the existing content |

A destroyed layer will call `scene.clear();`. Any additional disposals are caller-owned. You should take care of disposing any materials, textures, meshes etc that you created yourself.

### Layer order and depth

By default, the layers honor the MapLibre Style Spec layer order. Any layer below your layer renders below it, and any layer above renders above it. You can modify this using the layer's separator options when creating a layer.

Within the layer itself, depth is ruled by distance from camera by default. Nearer objects can occlude further objects. This can be manipulated via the ThreeJS primitives.

### Heights and datums

*Before reading this, make sure you understand the difference between 3DTiles and MapLibre's 3d terrain.*

`3DTiles` works in ECEF coordinates; a 3-number coordinate representing an offset from the earth's core. (0,0,0) is the Earth's center. ECEF does not really care about the sea level.

On the other hand, Maplibre uses `longitude, latitude`, and a MapLibre 3d terrain uses height above sea level (Orthometric height).

As strange as it sounds, the sea level is [not uniform](https://en.wikipedia.org/wiki/Geoid), so converting from ECEF to MapLibre's height cannot happen with pure math alone, and requires a dataset known as a vertical datum. By default, this library loads the EGM96 datum from https://cdn.proj.org/us_nga_egm96_15.tif (2.6MiB) as soon as the `threeDManager` is initialized. More info about the file and the CDN used can be found [here](https://github.com/OSGeo/PROJ-data/tree/master). The vertical datum is used whenever you convert from `ECEF` to `lngLatAlt` or vice versa. You can configure a different URL to fetch from, or you can disable the vertical datum altogether, in which case any ECEF to `lngLatAlt` will yield ellipsoidal height, and not sea level height.

Note that if the original data itself has vertical errors, the automatic datum corrections cannot fix those, and you would need to offset the objects manually.

In terms of aligning 3DTiles, or other ECEF objects with MapLibre's height, you have two options.

**If you have a 3d terrain (Terrain-RGB):**

Load the 3d terrain to MapLibre and keep the vertical datum on. This will give you automatic alignment.

If you are using the 3DTiles as a "background" on which you wish to draw style spec objects, consider making the MapLibre terrain *transparent*, as in, do not load any background tile to MapLibre. MapLibre will still use the height data to draw the vector features at their proper height above sea level, but the terrain itself wouldn't be visible, and instead you would render 3DTiles, which includes a rendering of a ground. Since the vertical datum is enabled, the 3dTiles's ground will very closely follow the transparent terrain, and the MapLibre objects will appear to be sitting properly on the 3DTiles.

**If you do not wish to load a 3dterrain and have a relatively flat-grounded 3DTiles:**

MapLibre will render all the features at 0 sea level since you have no terrain. In this case, you can disable the vertical datum, and manually offset the 3dtile until it sits at 0 sea level as well. This only works well with 3DTiles that have mostly flat ground, because the MapLibre features would all be at the same height of 0.

**If you do not wish to load a 3dterrain and your 3DTiles are not flat-grounded:**

You're out of luck. Your 3dtiles have slopes, but MapLibre does not have any ground data to work with since you did not load any terrain, and will render the features flat. This is impossible to align. In **THEORY** it is possible to derive terrain data from the 3DTiles model, but this is typically done server-side, in advance, to generate a terrain.

### Network Dependencies

`3d-tiles-renderer` has some network dependencies that are lazily fetched from `https://cdn.jsdelivr.net` when you call `layer.load3dTiles(...)`. You can fetch them from elsewhere by changing `ThreeDManager`'s `dracoPath` and `ktx2Path` options.

A vertical datum is fetched from `https://cdn.proj.org` when `ThreedManager.init()` is called. This can be modified or disabled. See the height section above for more info.

## Project status

This project forked from the [official Maplibre 3d Tiles example](https://maplibre.org/maplibre-gl-js/docs/examples/add-3d-tiles-using-threejs/). I am confident it is better than the existing example in almost every way, and if you are willing to use that for production, you should be comfortable using this project as well. However, I do not consider this project fully production ready. In particular, the documentation can be improved a lot to demonstrate the full potential of mixing Maplibre Style Spec with 3d tiles.

The project aims to be minimally scoped by design, and it will always be glue code between the libraries that do the heavy lifting. But some future features are in my mind. See [TODOS.md](todos.md).

**List of improvements over the official example:**

- Layer-based composition with direct access to Three.js scenes, cameras, and renderers.
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
