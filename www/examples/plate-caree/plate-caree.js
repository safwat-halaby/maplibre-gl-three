// TODO turn this into a working demo.

function getPlateCareeTransformParameters(anchor4326) {
    const anchorReprojected = [...alignWithEquirectangularProjection(anchor4326), 0];
    const meractorCoordinate = maplibregl.MercatorCoordinate.fromLngLat([anchorReprojected[0], anchorReprojected[1]], anchorReprojected[2]);
    const scales = getPlateCarreeMeterScales(anchor4326);
    return {
        translateX: meractorCoordinate.x,
        translateY: meractorCoordinate.y,
        translateZ: meractorCoordinate.z,
        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,
        ...scales
    };
}

function handleAnchorPointPlateCaree() {
    const {lng, lat} = map.getCenter();
    const center = reverse_alignWithEquirectangularProjection([lng, lat]);
    updateAnchorPoint([...center, 0]);
}

const EPSG_WEB_MERCATOR = proj4.Proj("EPSG:3857");
const EPSG_WGS84 = proj4.Proj("EPSG:4326");
const WGS84_BOUND = 180;
const EPSG3857_BOUND = 20037508.3427892;

/// Maplibre
function alignWithEquirectangularProjection(point) {
    return proj4(EPSG_WEB_MERCATOR, EPSG_WGS84, wgs84_to_equirectangular(point))
}
function reverse_alignWithEquirectangularProjection(point) {
  return equirectangular_to_wgs84(proj4(EPSG_WGS84, EPSG_WEB_MERCATOR, point));
}
function wgs84_to_equirectangular([lon, lat]) {
    return [(lon / WGS84_BOUND) * EPSG3857_BOUND, (lat / WGS84_BOUND) * EPSG3857_BOUND];
}
function equirectangular_to_wgs84([lon, lat]) {
  return [(lon / EPSG3857_BOUND) * WGS84_BOUND, (lat / EPSG3857_BOUND) * WGS84_BOUND];
}

