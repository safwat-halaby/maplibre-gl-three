This library brings [Three.js](https://threejs.org/) capabilities into [MapLibre GL JS](https://maplibre.org/). It allows you to treat Three.js as a MapLibre custom layer, rendering anything Three.js can render (including [3D Tiles](https://cesium.com/why-cesium/3d-tiles/)) along with the MapLibre Style Spec. For 3D Tiles, the library internally relies on [3d-tiles-renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS).

**This project is not officially affiliated with MapLibre**

## Installation and basic usage

**npm install**:

```sh
npm install three 3d-tiles-renderer maplibre-gl maplibre-gl-three 
```

**Create a layer and load 3D Tiles:**

```js
import {ThreeDManager} from 'maplibre-gl-three';
import {Map} from 'maplibre-gl';

const map = new Map({
    container: 'YOUR-HTML-MAPLIBRE-CONTAINER',
    zoom: 16,
    center: [-75.596, 40.038],
    pitch: 55,
    bearing: -20,
    maxPitch: 85,
    style: {
        "version": 8,
        "terrain": {
            "source": "mapterhorn"
        },
        "layers": [{
            "id": "backgroundFill",
            "type": "background",
            "paint": {
                "background-color": "#aaaaff"
            }
        }],
        "sources": {
            "mapterhorn": {
                "type": "raster-dem",
                "url": "https://tiles.mapterhorn.com/tilejson.json"
            }
        }
    }
});
const threeDManager = new ThreeDManager();
await threeDManager.init();
const layer = threeDManager.createLayer();
map.on('load', () => map.addLayer(layer));
map.on('remove', () => threeDManager.destroy());
const tilesAsset = await layer.load3dTiles({
    tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
    // Manually offset the 3D Tiles model downward.
    // Note: Datum corrections are automatically applied!
    // Manual corrections are only needed when there are errors in the 3D Tiles data.
    offset: { east: 0, up: -234, south: 0 }
});
```

**Load ordinary Three.js objects**

The Three.js scene expects **ECEF positions**. Helper functions convert to and from the more familiar longitude/latitude form. `height` is in meters above sea level.

```js
import * as THREE from 'three';

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 16),
    new THREE.MeshStandardMaterial({ color: 0xff00ff }),
);
sphere.applyMatrix4(threeDManager.getEcefMatrix({ point: [-75.598, 40.040], height: 130 }));
layer.three.getScene().add(sphere);
```

## Quick links

**Live examples** from [maplibre.org](https://maplibre.org/):

- [Basic example](https://maplibre.org/maplibre-gl-js/docs/examples/add-3d-tiles-3d-objects-and-models-using-threejs/)
- [Raycast example](https://maplibre.org/maplibre-gl-js/docs/examples/raycast-3d-tiles-using-threejs/)

Links from the maplibre-gl-three [docs website](https://maplibre-gl-three.readthedocs.io/):

- [Getting started guide](getting-started.md)
- [Core principles](principles.md)

## Design philosophy

The library is designed with the following mindset.

- **Thin wrapper only:** Glues between Three.js and MapLibre, then gets out of the way and lets the developer use the two libraries as natively as possible.
- **Sane defaults:** Imposes minimal mandatory configuration.
- **Great DX:** Strives to keep the API elegant, simple, and well documented.
- **Maintainable code:** Maintains low internal tech debt and aims to minimize accidental complexity. Also tries to make the tricky math functions approachable by adding commentary where appropriate.

## License

MIT license. Full license is in [`LICENSE.txt`](LICENSE.txt).

## Source code

[https://github.com/safwat-halaby/maplibre-gl-three](https://github.com/safwat-halaby/maplibre-gl-three)
