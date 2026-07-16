import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import proj4 from 'proj4';
import type { LngLatAltitude, TransformParameters } from './interfaces';

type LngLat = [longitude: number, latitude: number];
type LngLatLike = LngLat | LngLatAltitude;

const EPSG_WEB_MERCATOR = proj4.Proj("EPSG:3857");
const EPSG_WGS84 = proj4.Proj("EPSG:4326");
const WGS84_BOUND = 180;
const EPSG3857_BOUND = 20037508.3427892;

function getPlateCarreeTransformParameters(anchor4326: LngLatAltitude): TransformParameters {
    const [lng, lat] = alignWithEquirectangularProjection(anchor4326);
    const mercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 0);
    const scales = getPlateCarreeMeterScales(anchor4326);
    return {
        translateX: mercatorCoordinate.x,
        translateY: mercatorCoordinate.y,
        translateZ: mercatorCoordinate.z,
        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,
        ...scales
    };
}

function getPlateCarreeMeterScales([_lng, lat]: LngLatLike): Pick<TransformParameters, 'scaleEast' | 'scaleSouth' | 'scaleUp'> {
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

    // MapLibre MercatorCoordinate lives in a 0 to 1 space.
    const scaleEast = 1 / metersPerDegreeLng / 360;
    const scaleSouth = 1 / metersPerDegreeLat / 360;

    return {
        scaleEast,
        scaleSouth,
        scaleUp: scaleEast,
    };
}

function calculatePlateCarreeAnchorPoint(mapInstance: MapLibreMap): LngLatAltitude {
    const alignedCoordinates = mapInstance.getCenter();
    const [originalLng, originalLat] = reverse_alignWithEquirectangularProjection([alignedCoordinates.lng, alignedCoordinates.lat]);
    return [originalLng, originalLat, 0];
}

function degToRad(degrees: number): number {
    return degrees * Math.PI / 180;
}

function alignWithEquirectangularProjection(point: LngLatLike): LngLat {
    const [lng, lat] = proj4(EPSG_WEB_MERCATOR, EPSG_WGS84, wgs84_to_equirectangular(point));
    return [lng, lat];
}

function reverse_alignWithEquirectangularProjection(point: LngLatLike): LngLat {
    const [lng, lat] = proj4(EPSG_WGS84, EPSG_WEB_MERCATOR, [point[0], point[1]]);
    return equirectangular_to_wgs84([lng, lat]);
}

function wgs84_to_equirectangular([lon, lat]: LngLatLike): LngLat {
    return [(lon / WGS84_BOUND) * EPSG3857_BOUND, (lat / WGS84_BOUND) * EPSG3857_BOUND];
}

function equirectangular_to_wgs84([lon, lat]: LngLat): LngLat {
    return [(lon / EPSG3857_BOUND) * WGS84_BOUND, (lat / EPSG3857_BOUND) * WGS84_BOUND];
}
export const PlateCarreeTools = {getPlateCarreeTransformParameters, calculatePlateCarreeAnchorPoint};