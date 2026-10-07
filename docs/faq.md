# Frequently Asked Questions

## My 3D Tiles dataset is vertically misaligned with MapLibre. What do I do?

*See also the [Heights and datums principles](principles.md#heights-and-datums) page*

There are multiple possibilities:

**A. You did not load any terrain to MapLibre**, so MapLibre is rendering things at sea-level while the dataset is floating above it. Adding a 3D Terrain to MapLibre will resolve your problem. [Mapterhorn](https://mapterhorn.com/) is a public dataset you can use. If using a `style.json`, you'd need to add the following:

```json
{
    "terrain": {
        "source": "mapterhorn"
    },
    "sources": {
        "mapterhorn": {
            "type": "raster-dem",
            "url": "https://tiles.mapterhorn.com/tilejson.json"
        }
    }
}
```

**B. You are using terrain exaggeration** and MapLibre is rendering things with inflated height. Use an exaggeration of 1.

**C. The dataset itself has vertical errors.** You can use the `offset` option to manually correct it:

```js
const tilesAsset = await layer.load3dTiles({
    tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
    // Manually offset the 3D Tiles model downward.
    // Note: Datum corrections are automatically applied!
    // Manual corrections are only needed when there are errors in the 3D Tiles data.
    offset: { east: 0, up: -234, south: 0 }
});
```

**D. The dataset has orthometric ECEF coordinates**

maplibre-gl-three automatically applies vertical datum corrections for 3D Tiles. In some cases your dataset may have already pre-corrected vertical datums and so we might be double-correcting heights. Strictly speaking this is a dataset error, because ECEF coordinates are not supposed to be orthometric, but you might be able to get away with it by turning off vertical datum corrections:

```js
const threeDManager = new ThreeDManager({
    verticalDatum: {
        enabled: false
    }
});
```
This has consequences if you're using additional externally sourced ECEF coordinates; they will not sit correctly on your 3D Tiles or MapLibre map.

## I am seeing weird vertical lines on the edges of terrain tiles

You're likely using a MapLibre terrain along with a transparent background. You have two options.

A. put something opaque as a base layer, at the very least an opaque background color:

```json
{
    "layers": [{
        "id": "backgroundFill",
        "type": "background",
        "paint": {
            "background-color": "#aaaaff"
        }
    }]
}
```

B. Disable MapLibre's [skirts](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#terrainskirtlength):

```js
const map = new Map({
    terrainSkirtLength: 'none',
    // ...
});
``` 

## I loaded some 3D Tiles and I see nothing. What do I do? 

- Check the browser console for errors.
- Make sure MapLibre is centered where the data is at. You can do this programmatically like so:

```js
// map is the MapLibre map
// tilesAsset is the object returned from `load3dTiles()`
tilesAsset.getTilesRenderer().addEventListener('load-root-tileset', () => {
    const tilesPosition = tilesAsset.getReference();
    map.flyTo({center: tilesPosition.point, zoom: 16});
});
```

**If it's a missing 3D Tiles extension issue:**

If the console reports a missing extension or loader, you should probably set [`threeLayer.load3dTiles({autoLoaders: false})`](api/index.md#load3dtilesoptions) and then add the proper loaders yourself. If I missed a very common loader, I should add it to the autoLoaders list. [Contact me](contact.md).

## How do I center the map on the 3D Tiles?

See the previous question.
