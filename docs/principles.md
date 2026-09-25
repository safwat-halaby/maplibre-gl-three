## Principles

### Object hierarchy and lifecycle

A `ThreeDManager` owns layers. Each layer owns "assets" and Three.js primitives (scene, camera, etc.). The primitives allow direct Three.js access, while the "assets" are convenience wrappers, and they ultimately manipulate the same primitives. Currently the only asset type is the 3D Tiles asset, created with `tilesAsset = await layer.load3dTiles(...)`.

A `ThreeDManager` is associated with one MapLibre map. On the rare occasion of using multiple MapLibre maps, you should use multiple `ThreeDManager` objects, one for each map.

### Lifecycle and destruction

- `threeDManager.destroy()` Destroys all managed layers, and all assets managed by those layers.
- `layer.destroy()` Destroys the layer and destroys all its assets.
- `asset.destroy()` Destroys a specific asset. If it's a 3D Tiles asset, frees all internal data associated with the 3D Tiles model.
- `map.removeLayer(layer.id)` Detaches the layer and disposes its renderer; preserves the scene and assets for reattachment.
- `map.addLayer(layer)` Creates a new renderer and (re)attaches the existing content.

A destroyed layer will call `scene.clear();`. Any additional disposals are caller-owned. You should take care of disposing any materials, textures, meshes etc that you created yourself.

### Layer order and depth

By default, the layers honor the MapLibre Style Spec layer order. Any layer below your layer renders below it, and any layer above renders above it. You can modify this using the layer's separator options when creating a layer.

Within the layer itself, depth is ruled by distance from camera by default. Nearer objects can occlude further objects. This can be manipulated via the Three.js primitives.

### Heights and datums

*Before reading this, make sure you understand the difference between 3D Tiles and MapLibre's 3D terrain.*

`3D Tiles` works in ECEF coordinates; a 3-number coordinate representing an offset from the Earth's core. (0,0,0) is the Earth's center. ECEF does not really care about sea level.

On the other hand, MapLibre uses `longitude, latitude`, and MapLibre 3D terrain uses height above sea level (orthometric height).

As strange as it sounds, sea level is [not uniform](https://en.wikipedia.org/wiki/Geoid), so converting from ECEF to MapLibre's height cannot happen with pure math alone, and requires a dataset known as a vertical datum. By default, this library loads the EGM96 datum from https://cdn.proj.org/us_nga_egm96_15.tif (2.6MiB) as soon as the `threeDManager` is initialized. More info about the file and the CDN used can be found [here](https://github.com/OSGeo/PROJ-data/tree/master). The vertical datum is used whenever you convert from `ECEF` to `lngLatAlt` or vice versa. You can configure a different URL to fetch from, or you can disable the vertical datum altogether, in which case any ECEF to `lngLatAlt` will yield ellipsoidal height, and not sea-level height.

Note that if the original data itself has vertical errors, the automatic datum corrections cannot fix those, and you would need to offset the objects manually.

In terms of aligning 3D Tiles, or other ECEF objects with MapLibre's height, you have two options.

**If you have 3D terrain (Terrain-RGB):**

Load 3D terrain into MapLibre and keep the vertical datum on. This will give you automatic alignment.

If you are using 3D Tiles as a "background" on which you wish to draw MapLibre Style Spec objects, consider making the MapLibre terrain *transparent*, as in, do not load any background tile to MapLibre. MapLibre will still use the height data to draw the vector features at their proper height above sea level, but the terrain itself would not be visible, and instead you would render 3D Tiles, which includes a rendering of a ground. Since the vertical datum is enabled, the 3D Tiles ground will very closely follow the transparent terrain, and the MapLibre objects will appear to be sitting properly on the 3D Tiles.

**If you do not wish to load 3D terrain and have relatively flat-grounded 3D Tiles:**

MapLibre will render all the features at sea level (0) since you have no terrain. In this case, you can disable the vertical datum, and manually offset the 3D Tiles model until it sits at sea level (0) as well. This only works well with 3D Tiles that have mostly flat ground, because the MapLibre features would all be at the same height of 0.

**If you do not wish to load 3D terrain and your 3D Tiles are not flat-grounded:**

You're out of luck. Your 3D Tiles have slopes, but MapLibre does not have any ground data to work with since you did not load any terrain, and will render the features flat. This is impossible to align. In theory, it is possible to derive terrain data from the 3D Tiles model, but this is typically done server-side, in advance, to generate terrain.

### Network Dependencies

`3d-tiles-renderer` has some network dependencies that are lazily fetched from `https://cdn.jsdelivr.net` when you call `layer.load3dTiles(...)`. You can fetch them from elsewhere by changing `ThreeDManager`'s `dracoPath` and `ktx2Path` options.

A vertical datum is fetched from `https://cdn.proj.org` when `ThreeDManager.init()` is called. This can be modified or disabled. See the height section above for more info.

 See the next section.