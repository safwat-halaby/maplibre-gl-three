## ThreeDManager

You always start with a [ThreeDManager](api/index.md#threedmanager). It has various [constructor options](http://localhost:8000/api/#threedmanageroptions), all optional. You'll probably want to call the [init method](api/index.md#init) immediately.

```js
const threeDManager = new ThreeDManager(options);
await threeDManager.init();
```

## ThreeLayer

Next, you'll probably want to call [ThreeDManager.createlayer](api/index.md#createlayer). It also has various [optional paramaters](http://localhost:8000/api/#createlayeroptions). It returns a [ThreeLayer](api/index.md#threelayer), which can be added directly to a MapLibre map.

```js
const threeLayer = threeDManager.createLayer();
map.on('load', () => map.addLayer(threeLayer));
```

Now you can use ThreeLayer's various [methods](api/index.md#methods_3) to get access to ThreeJS primitives or to produce 3D tiles.

## 3D Tiles Asset

You can call [ThreeLayer.load3dTiles](api/index.md#load3dtiles) with various [options](api/index.md#load3dtilesoptions) to create a [ThreeDTilesAsset](api/index.md#threedtilesasset).

```js
const tilesAsset = await layer.load3dTiles({
    tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
    // Manually offset the 3D Tiles model downward.
    // Note: Datum corrections are automatically applied! Manual corrections are only needed when there are errors in the 3D Tiles data.
    offset: { east: 0, up: -234, south: 0 }
});
```

## Coordinate system conversions

[ThreeDManager](api/index.md#threedmanager) has various [methods](api/index.md#methods) to help you with coordinate system conversions. 