import { Matrix4, Quaternion, Vector3, MathUtils } from 'three';
import proj4 from 'proj4';
import type { GetTransformParameters, LngLat, LngLatAlt } from '../interfaces';

proj4.defs('EPSG:4978', '+proj=geocent +datum=WGS84 +units=m +no_defs');


/** Convert from EPSG:4978 to EPSG:4979 
 * - EPSG:4979: WGS84 (EPSG:4326) + height above the ellipsoid
 * - EPSG:4978: ECEF
 */
export function wgs84WithEllipsoidalHeightToEcef(lngLatAlt: LngLatAlt): Vector3 {
    const [x, y, z] = proj4('EPSG:4326', 'EPSG:4978', [...lngLatAlt.point, lngLatAlt.height]) as [number, number, number];
    return new Vector3(x, y, z);
}

/** Convert from EPSG:4978 to EPSG:4979
 * - EPSG:4978: ECEF
 * - EPSG:4979: WGS84 (EPSG:4326) + height above the ellipsoid */
export function ecefToWgs84WithEllipsoidalHeight(point: Vector3): LngLatAlt {
    const [longitude, latitude, height] = proj4('EPSG:4978', 'EPSG:4326', point.toArray()) as [number, number, number];
    return { point: [longitude, latitude], height };
}

/** Returns vectors pointing east, south, up in ECEF space.
 * The up vector points away from the Earth's core.
 * The east vector points at the eastern horizon.
 * The south vector points at the southern horizon.
 * */
export function getEcefCompassVectors(lng: number, lat: number) {
    const lonRad = MathUtils.degToRad(lng);
    const latRad = MathUtils.degToRad(lat);
    return {
        east: new Vector3(-Math.sin(lonRad), Math.cos(lonRad), 0),
        up: new Vector3(
            Math.cos(latRad) * Math.cos(lonRad),
            Math.cos(latRad) * Math.sin(lonRad),
            Math.sin(latRad),
        ),
        south: new Vector3(
            Math.sin(latRad) * Math.cos(lonRad),
            Math.sin(latRad) * Math.sin(lonRad),
            -Math.cos(latRad),
        ),
    };
}

/** Orient model-local X/Y/Z along east/up/south at a longitude/latitude in degrees.
 * You should probably prefer ThreeDManager's getEcefMatrix which also includes translation, unless you're doing advanced stuff.
 */
export function getEcefOrientationMatrix(lngLat: LngLat | LngLatAlt): Quaternion {
    const [lng, lat] = Array.isArray(lngLat) ? lngLat : lngLat.point;
    const { east, up, south } = getEcefCompassVectors(lng, lat);
    return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(east, up, south));
}

export function ecefToLocalMatrix(anchor: LngLat, ellipsoidalHeight: number): Matrix4 {
    // This function is sometimes called with `anchor=anchor4326` (when camera moves)
    // but sometimes it is called with an arbitrary LngLat (when the API user translates stuff).
    //
    // The explanaiton addresses the first case, but a similar explanation applies to the more general case.
    // It helps to imagine the initial Three.js LocalSpace coordinate system as identical to the ECEF system, [0,0,0] being the Earth's core, and the 3D model resting somewhere on the shell.
    // EcefAnchor is also somewhere on the shell, sitting exactly at the ellipsoidal height of 0.
    // We don't like that. We want EcefAnchor to be at [0,0,0] LocalSpace. This transformation takes care of that.
    // It moves the 3D model in the Three.js world as follows.

    // 1. Make EcefAnchor match the [0,0,0] Origin (see terminology in https://maplibre-gl-three.readthedocs.io/en/latest/coordinate-systems/).
    // We move the entire 3D Tiles model (or ThreeJS scene) such that EcefAnchor is at [0,0,0] in LocalSpace.
    // In ECEF the model would have been sitting at earth's core now.
    // In the case of `anchor=anchor4326`, ellipsoidalHeight equals undulation,
    // meaning the anchor is at sea level height and [0,0,0] equals sea level height. (orthometric)
    const ecefAnchor = wgs84WithEllipsoidalHeightToEcef({ point: anchor, height: ellipsoidalHeight });
    
    // 2. Rotate the whole 3D Tiles model so that its up direction is the same as the Three.js up direction.
    // We have made the up side of the 3D Tiles model point to the North Pole (if it were sitting the Earth's core).
    // We have now aligned the 3D Tiles with the LocalSpace coordinate system. 0,0,0 is the anchor point. (0,1,0) is up, (1,0,0) is east, (0,0,1) is south, the anchor is at [0,0,0], and the geoid is at height 0.
    const matrix_translateEcefAnchorToOrigin = new Matrix4().makeTranslation(-ecefAnchor.x, -ecefAnchor.y, -ecefAnchor.z);
    const matrix_rotateEcefTo3JS = new Matrix4().makeRotationFromQuaternion(getEcefOrientationMatrix(anchor)).transpose(); // the transpose of a rotation matrix is equal to its inverse.    
    return new Matrix4()
        .multiply(matrix_rotateEcefTo3JS)
        .multiply(matrix_translateEcefAnchorToOrigin);

    // The only thing left in terms of projections is to sync the Three.js camera and the MapLibre camera. But this is done elsewhere by the `localToMap` matrix.
    
    // fun fact / exercise for the reader:
    // Previously I called wgs84WithEllipsoidalHeightToEcef({ point: anchor, height: 0 }); as in, the anchor is always sitting on the ellipsoid initially,
    // and I had a step 3 which is .makeTranslation(0, -ellipsoidalHeight, 0). The two methods are equivalent. It's a good exercise to try to understand why.
}

/** Returns an affine-transformation on anchor-relative coordinates. The specific transformation
 * is determined by getTransformParameters. We use the returned matrix to translate LocalSpace coordinates where the anchor is 0,0,0
 * to the coordinates which the map needs. The default getTransformParameters passed from ThreeDManager assumes a Web Mercator MapLibre map.
 */
export function affineTransformation(anchor: LngLat, getTransformParameters: GetTransformParameters): Matrix4 {
    const transform = getTransformParameters(anchor);
    return new Matrix4()
        .makeTranslation(transform.translateX, transform.translateY, transform.translateZ)
        .scale(new Vector3(transform.scaleEast, -transform.scaleSouth, transform.scaleUp))
        .multiply(new Matrix4().makeRotationX(transform.rotateX))
        .multiply(new Matrix4().makeRotationY(transform.rotateY))
        .multiply(new Matrix4().makeRotationZ(transform.rotateZ));
}
