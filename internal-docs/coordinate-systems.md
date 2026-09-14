Important terminology and notes:

- Origin: the (0,0,0) point in the 3JS world.
- anchor4326: a geographical point close to the camera center, longitude and latitude in the maplibre world. 
- EcefAnchor: The point in the 3dTiles world which corresponds to the anchor.

3dTiles uses the ECEF coordinate system. Rather than reprojecting all points in 3dtiles, we only reproject the anchor. 
This is very efficient, but it means the two worlds start losing sync as we travel away from the anchor.
So a new anchor is calculated whenever the mapLibre map moves around.

## ECEF (EPSG:4978) coordinate system

- [0,0,0] is the center point in earth's core.
- [1,0,0] points to null island (longitude 0, latitude 0). In a typical 2d map this is "towards the viewer"
- [0,0,1] points to the north pole.
- [0,1,0] points to (longitude 90, latitude 0). In a typical 2d map this is to the right.
- ECEF units are in meters. [0,0,3] is 3 meters towards the north pole and away from the center point in earth's core. 

## 3JS coordinate system

- [0,0,0] is where the ecefAnchor is at after transformations.  After datum corrections It's also 0 meters above geoid (orthometric height / above sea level).
- [1,0,0] points "right" - we want this aligned with MapLibre's east
- [0,1,0] points up
- [0,0,1] points Z+ - we want this aligned with MapLibre's south.
- The units are whatever we want them to be. In this project we choose meters.

## WGS84 (EPSG:4326) coordinate system

- This is the universally used "GPS coordinate" format. [longitude, latitude] in degrees.
- Longitude is between -180 and +180
- Latitude is between -90 and +90
- Longitude 0 is the prime meridian crossing the royal observatory in london
- Latitude 0 is the equator
- [0,0] is known as "null island", and is a place on the equator in the pacific ocean.
- Maplibre uses this coordinate system in its API, but it is internally projection to web mercator (EPSG:3857)

## Web mercator (EPSG:3857) coordinate system

- WGS84 is not flat and a flat world is more convenient. WGS84 is therefore often projected to some flat plane. Web Mercator is such a flat plane.
- In maplibre, the web mercator plane a square whose units is "meters" (but not really. I call them pseudo-meters).
- It spans -20 037 508.3427892 to +20037508.3427892. Making it ~40,075,016 in width and height. This is earth's circumference. Some implementations treat it as a -1 to 1 span.
- On the equator, pseudometers equal meters. The higher north or south we go, the shorter the pseudometers get. Maplibre's meterInMercatorCoordinateUnits() converts between the two.
- The longitude is simply linearly mapped. Longitude 0 is 0, longitude 180 is +20037508.3427892. Null island sits in the middle of the square.
- The latitude mapping is complex. The farther from the equator we get, the more stretched the map gets. At latitude 90 the stretch spans infinity.
  To avoid this and to achieve a perfect square, web mercator is capped at about -85.05 to +85.05 latitude.
- Not to be confused with the VERY similar but more geodetically faithful EPSG:3395 mercator, used for maritime navigation among other things.