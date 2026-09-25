## Coordinate systems and projections

To glue MapLibre and Three.JS's cameras, we play around with 4 different coordinate systems. This document explains the details.

## Terminology

- `Origin`: the `[0,0,0]` point in the Three.js world.
- `Anchor4326`: a geographical point close to the camera center, longitude and latitude in the MapLibre world. Format: (longitude, latitude, altitude). Internally, MapLibre uses the Web Mercator for all its geographical points, and like other points this is projected and becomes what we call `AnchorWM`.
- `AnchorWM`: the Web Mercator-projected version of `Anchor4326`.
- `EcefAnchor`: the point in the 3D Tiles world which corresponds to `Anchor4326`. Format (x, y, z) in meters from the Earth's core.


### The process

This library always renders those points at the same spot on the screen. The process of gluing MapLibre to Three.js is as foolows this. On each MapLibre camera move:

- Derive `Anchor4326` from `mapLibre.getCenter()`
- Calculate the coordinates of `EcefAnchor` from the coordinates of `Anchor4326` using proj4js.
- Calculate a transformation matrix (`ecefToLocal`) which moves the ECEF world such that `EcefAnchor` is now at `[0,0,0]`. We call this LocalSpace.
- Calculate a transformation matrix (`localToMap`) which manipulates the Three.js camera such that this `[0,0,0]` renders at the same `AnchorWM` coordinate which `Anchor4326` is translated to internally in MapLibre.

The naive approach to glue MapLibre with an ECEF world is to transform every single ECEF coordinate to a MapLibre-friendly Web Mercator coordinate. But it this is an O(N) geographical calculation where N is every vertex in Three.JS. Expensive!

The main clever trick in this library is to ONLY geographically translate the `EcefAnchor` point. The rest of the ECEF points are translated by the same transformation matrix and are relative to `[0,0,0]` in meters as if the world is flat. Since it's a linear transformation, it's essentially instant in today's GPUs and it doesn't get more expensive with more vertices added. This is very accurate locally. But since we are assuming a flat earth, if we move away from the anchor we begin to lose precision. So we recalculate the (`ecefToLocal`) matrix on each MapLibre camera move.

## ECEF (EPSG:4978) coordinate system (home of `EcefAnchor`)

The coordinate system native to 3D Tiles and many other Geographical 3d constructs.

The objects in the Three.JS scene use the ECEF coordinate system.

- `[0,0,0]` is the center point in the Earth's core.
- `[1,0,0]` points to Null Island (longitude 0, latitude 0). In a typical 2D map this is "towards the viewer".
- `[0,0,1]` points to the North Pole.
- `[0,1,0]` points to (longitude 90, latitude 0). In a typical 2D map this is to the right.
- ECEF units are in meters. `[0,0,3]` is 3 meters towards the North Pole and away from the center point in the Earth's core.

## LocalSpace coordinate system (home of `Origin`)

- `[0,0,0]` is where `EcefAnchor` is after transformations and datum corrections, it is also (orthometric height / sea-level height / the "0" height in MapLibre). Whenever the MapLibre camera moves, LocalSpace moves with it. `[0,0,0]` moves and follows the camera center.
- `[1,0,0]` points "right" - we want this aligned with MapLibre's east
- `[0,1,0]` points up
- `[0,0,1]` points Z+ - we want this aligned with MapLibre's south.
- The units are whatever we want them to be. In this project we choose meters.

## WGS84 (EPSG:4326) coordinate system (home of `Anchor4326`)

- This is the universally used "GPS coordinate" format. [longitude, latitude] in degrees.
- Longitude is between -180 and +180
- Latitude is between -90 and +90
- Longitude 0 is the prime meridian crossing the Royal Observatory in London.
- Latitude 0 is the equator
- `[0,0]` is known as "Null Island", and is a place on the equator in the Pacific Ocean.
- MapLibre uses this coordinate system in its API, but it internally projects to Web Mercator (EPSG:3857).

## Web Mercator (EPSG:3857) coordinate system (home of `AnchorWM`)

- WGS84 is not flat and a flat world is more convenient. WGS84 is therefore often projected to some flat plane. Web Mercator is such a flat plane.
- The Web Mercator plane is a square whose units are "meters" (but not really; I call them pseudo-meters).
- On the equator, pseudo-meters equal meters. The higher north or south we go, the shorter the pseudo-meters get. MapLibre's `meterInMercatorCoordinateUnits()` converts between the two.
- The square -20 037 508.3427892 to +20037508.3427892, making it ~40,075,016 in width and height. This is the Earth's circumference. Some implementations treat it as a -1 to 1 span or a 0 to 1 span. MapLibre treats it as a 0 to 1.
- The longitude is simply linearly mapped. Longitude 0 is 0, longitude 180 is +20037508.3427892. Null Island sits in the middle of the square.
- The latitude mapping is complex. The farther from the equator we get, the more stretched the map gets. At latitude 90 the stretch spans infinity.
  To avoid this and to achieve a perfect square, Web Mercator is capped at about -85.05 to +85.05 latitude.
- Not to be confused with the very similar but more geodetically faithful EPSG:3395 Mercator projection, used for maritime navigation among other things.
- in MapLibre, web mercator coordinates also have a Z component. Quoting the docs of `MercatorCoordinate.fromLngLat`: "The z dimension of MercatorCoordinate is conformal. A cube in the mercator coordinate space would be rendered as a cube." - this is very relevant for stretching the Three.JS up axis properly, namely in `getWebMercatorTransformParameters`.

## EPSG codes for vertical datums

This library uses the EGM96 datum. Relevant EPSG codes:

- EPSG:5773 - EGM96 height
- EPSG:9707 (WGS84 + EGM96 height): Combines EPSG:4326 with EPSG:5773
- EPSG:4979 - WGS84 + height above ellipsoid