# Frequently asked questions

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

This library automatically applies vertical datum corrections for 3D Tiles. In some cases your dataset may have already pre-corrected vertical datums and so the library might be double-correcting. Strictly speaking this is a dataset error, as all the ECEF coordinates in your dataset are incorrect, but you might be able to get away with it by turning off vertical datum corrections:

```js
const threeDManager = new ThreeDManager({
    verticalDatum: {
        enabled: false
    }
});
```
This has consequences if you're using additional externally sourced ECEF coordinates; they will not sit correctly on your 3D tiles or MapLibre map.

## I am seeing weird vertical artifacts

You're likely using a MapLibre terrain along with a transparent background. You have two options.

A. put something opaque as a base layer, at the very least a opaque background color:

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
// tiles3d is the object returned from `load3dTiles`
tiles3d.getTilesRenderer().addEventListener('load-root-tileset', () => {
    const tilesPosition = tiles3d.getReference();
    map.flyTo({center: tilesPosition.point, zoom: 16});
});
```

- It could also be an extention issue (this should appear in the console). Currently, not all 3D Tiles extensions are supported. Sorry :( - When time permits I will document which extensions are supported and expose more 3d-tiles-renderer configuration to allow you to add any extension.

