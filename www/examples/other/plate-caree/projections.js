export const EPSG_WEB_MERCATOR = proj4.Proj("EPSG:3857");
export const EPSG_WGS84 = proj4.Proj("EPSG:4326");
export const WGS84_BOUND = 180;
export const EPSG3857_BOUND = 20037508.3427892;


export function getPlateCareeTransformParameters(anchor4326) {
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

export function getPlateCarreeMeterScales([lng, lat]) {
    const a = 6378137.0;
    const e2 = 6.69437999014e-3;
    const latRad = degToRad(lat);
    const sinLat = Math.sin(latRad);
    const cosLat = Math.cos(latRad);
    const w = Math.sqrt(1 - e2 * sinLat * sinLat);
    const n = a / w;
    const m = (a * (1 - e2)) / (w * w * w);
    const metersPerDegreeLng = degToRad(1) * n * cosLat;
    const metersPerDegreeLat = degToRad(1) * m;

    // maplibre MercatorCoordinate lives in a 0 to 1 space.
    // Todo elaborate this consideration more.
    const scaleEast = 1 / metersPerDegreeLng / 360;
    const scaleSouth = 1 / metersPerDegreeLat / 360;

    return {
        scaleEast,
        scaleSouth,
        scaleUp: scaleEast, // just a convention
    };
}

export function handlePlateCarreeAnchorPoint(mapInstance) {
    const alignedCoordinates = mapInstance.getCenter(); 
    const [originalLng, originalLat] = reverse_alignWithEquirectangularProjection([alignedCoordinates.lng, alignedCoordinates.lat]);
    return [originalLng, originalLat, 0];
}

export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/// Maplibre
export function alignWithEquirectangularProjection(point) {
    return proj4(EPSG_WEB_MERCATOR, EPSG_WGS84, wgs84_to_equirectangular(point))
}
export function reverse_alignWithEquirectangularProjection(point) {
  return equirectangular_to_wgs84(proj4(EPSG_WGS84, EPSG_WEB_MERCATOR, point));
}
export function wgs84_to_equirectangular([lon, lat]) {
    return [(lon / WGS84_BOUND) * EPSG3857_BOUND, (lat / WGS84_BOUND) * EPSG3857_BOUND];
}
export function equirectangular_to_wgs84([lon, lat]) {
  return [(lon / EPSG3857_BOUND) * WGS84_BOUND, (lat / EPSG3857_BOUND) * WGS84_BOUND];
}
