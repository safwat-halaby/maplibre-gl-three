As of MapLibre 6, using non-Web Mercator background tiles is very tricky, but this demo demonstrates that it is possible with enough hacks. We demonstrate a Plate Carree background map (sometimes referred to as unprojected EPSG:4326 / unprojected WGS84 / Equirectangular projection) in MapLibre, along with a MapLibre Style Spec and 3D Tiles.

Normally, MapLibre expects the background maps to be projected using the Web Mercator (EPSG:3857) projection.

This demo "lies" to MapLibre by using a Plate Carree projection for the background map in `style.json`. To visually see the difference, observe that when zooming out, Greenland is "squashed" in this example, while in the rest of the examples, Greenland is stretched (Web Mercator). The squashing is one indicator of a Plate Carree background map.

Since MapLibre isn't aware that the background map is not in Web Mercator, all background tiles are sitting in the wrong place (they sit properly in terms of left-right position, but they are closer to the equator than they should be), and if you render any vector feature on top, that feature would seem to sit on the wrong background tiles. In the northern hemisphere, the feature will seem to be north of where it should be. In fact, the feature is correct and the background is not, because it is biased towards the equator. To correct this, we use the same principle twice:

1. `alignGeoJSONWithPlateCarree` - For the MapLibre Style Spec, we reproject the GeoJSON feature collection. Now the features are also sitting in the "wrong" place. We add the same offset the tiles have to the features, and now everything visually looks in place. (It seems that sometimes, two wrongs do make a right!)
2. `PlateCarreeTools` - For 3D Tiles, we do the exact same trick by initializing the `threeDManager` differently with the help of `PlateCarreeTools`.

This solves a problem but creates another. The features are in the wrong coordinates, just like their tiles. This is good for visualization, and everything looks right, but in reality ALL OUR COORDINATES ARE WRONG.

To solve this, we "ruin" all coordinates that go into MapLibre, and "correct" any coordinates coming out. This is demonstrated in the way the default map coordinates `[-75.596, 40.038]` are wrapped in `alignWithEquirectangularProjection([-75.596, 40.038])`. That is the "ruin coordinates but correct visualization" function. If you get any coordinate out of MapLibre, for example by querying a feature or executing `map.getCenter()`, you have to perform the reverse function `reverse_alignWithEquirectangularProjection` to get real usable coordinates.

## Running this example

See `maplibreGlThree-selfhost-example` and follow the same instructions, but instead browse to

http://localhost:6153/examples/other/plate-carree/index.html
