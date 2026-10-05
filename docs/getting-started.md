# Getting Started

This page assumes you've [installed](installation.md) `maplibre-gl-three` and that you have a MapLibre map object. If not, see the [introduction](index.md) first.

## ThreeDManager

You always start with a [ThreeDManager](api/index.md#threedmanager). It has various [constructor options](api/index.md#threedmanageroptions), all optional. You'll probably want to call the [init method](api/index.md#init) immediately.

```js
import {ThreeDManager} from 'maplibre-gl-three';

const threeDManager = new ThreeDManager();
await threeDManager.init();
```

## ThreeLayer

Next, you'll probably want to call [ThreeDManager.createlayer](api/index.md#createlayer). It also has various [optional paramaters](api/index.md#createlayeroptions). It returns a [ThreeLayer](api/index.md#threelayer), which can be added directly to a MapLibre map.

```js
const layer = threeDManager.createLayer();
map.on('load', () => map.addLayer(layer));
```

Now you can use ThreeLayer's various [methods](api/index.md#methods_3) to get access to ThreeJS primitives or to produce 3D tiles.

MapLibre layer order is honored by default. [addLayer](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#addlayer) adds the layer last by default. You can control depth by adding the layer elsewhere.

## 3D Tiles Asset

You can call [ThreeLayer.load3dTiles](api/index.md#load3dtiles) with various [options](api/index.md#load3dtilesoptions) to create a [ThreeDTilesAsset](api/index.md#threedtilesasset).

```js
const tilesAsset = await layer.load3dTiles({
    tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
    // Manually offset the 3D Tiles model downward.
    // Note: Datum corrections are automatically applied!
    // Manual corrections are only needed when there are errors in the 3D Tiles data.
    offset: { east: 0, up: -234, south: 0 }
});
```

## Coordinate system conversions / adding Three.JS objects

Suppose you want to load a regular Three.JS object.  

[ThreeDManager](api/index.md#threedmanager) has various [methods](api/index.md#methods) to help you with coordinate system conversions. In the following example, we use `getEcefMatrix` to convert from the typical longitude/latitude(`EPSG:4326`) coordinates to ECEF(`EPSG:4978`): 

```js
import * as THREE from 'three';

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 16),
    new THREE.MeshStandardMaterial({ color: 0xff00ff }),
);
sphere.applyMatrix4(threeDManager.getEcefMatrix({ point: [-75.598, 40.040], height: 130 }));
layer.three.getScene().add(sphere);
```

### Programmatically calculating terrain height

Assuming you have loaded a 3D terrain into MapLibre, you can use MapLibre's [map.queryTerrainElevation()](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#queryterrainelevation) to determine an object's height rather than hardcoding a 130.


## Acessing 3d-tiles-renderer / Centering the map on load

You can use the Tile Asset's [getTilesRenderer()](api/index.md#gettilesrenderer) to get access to the underlying 3d-tiles-renderer object. In this example, we use an event listener to zoom into the 3D Tiles once they are loaded.

```js
tiles3d.getTilesRenderer().addEventListener('load-root-tileset', () => {
    const tilesPosition = tiles3d.getReference();
    map.flyTo({center: tilesPosition.point, zoom: 16});
});
```
 
## Advanced depth control

**Occlusion / interlacing**

You can also add `{separatorAfter: false}` to the `createLayer` options. It means:

- All layers before the ThreeLayer are unaffected (MapLibre layer order still honored).
- All layers after the ThreeLayer may occlude or be occluded by the ThreeLayer, depending on what's closer to the camera.

`{separatorBefore: false}` performs the same logic for the layers before. Both options can be disabled at once. By default, both options are true.

**Multiple ThreeLayers**

For ultimate depth control, feel free to use as many ThreeLayer instances as you want. You can put regular MapLibre layers in between them / before them / after them in any order. Note that each ThreeLayer has its own underlying Three.JS instance.

## End

This concludes the getting started guide!
