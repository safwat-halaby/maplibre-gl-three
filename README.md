This library brings [Three.js](https://threejs.org/) capabilities into [MapLibre GL JS](https://maplibre.org/). It allows you to treat Three.js as a MapLibre custom layer, rendering anything Three.js can render (including [3D Tiles](https://cesium.com/why-cesium/3d-tiles/)) along with the MapLibre Style Spec. For 3D Tiles, the library internally relies on [3d-tiles-renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS).

Have a look at the [docs website](https://maplibre-gl-three.readthedocs.io/en/stable/) for more info!

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
    terrainSkirtLength: 'none', // important if you are using transparent MapLibre terrain. Prevents vertical artifacts
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
    // Manually offset the 3D Tiles model downward.
    // Note: Datum corrections are automatically applied! Manual corrections are only needed when there are errors in the 3D Tiles data.
    offset: { east: 0, up: -234, south: 0 }
});
map.on('load', () => map.addLayer(layer));
map.on('remove', () => threeDManager.destroy());
```

**Load ordinary Three.js objects**

The scene accepts **WGS84 ECEF positions (EPSG:4978)**. Helper functions are supplied by `threeDManager` to convert to and from the more familiar `longitude, latitude, altitude` form. `altitude` is height in meters above sea level.

```js
import * as THREE from 'three';

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 16),
    new THREE.MeshStandardMaterial({ color: 0xff00ff }),
);
sphere.applyMatrix4(threeDManager.getEcefMatrix({ point: [-75.598, 40.040], height: 130 }));
layer.getScene().add(sphere);
```

## Design philosophy

- **Thin wrapper only:** The library glues between Three.js and MapLibre, then gets out of the way and lets the developer use the two libraries as natively as possible.
- **Sane defaults:** Minimal mandatory configuration.
- **Great DX:** Strive to keep the API elegant, simple, and well documented.
- **Maintainable code:** Keep the internal tech debt low and aim to minimize accidental complexity. Try to make the tricky math functions approachable by adding commentary where appropriate. 

## License

See [LICENSE.txt](LICENSE.txt).