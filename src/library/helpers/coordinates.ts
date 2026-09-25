import { Matrix4, Quaternion, Vector3, MathUtils } from 'three';
import proj4 from 'proj4';
import type { GetTransformParameters, LngLat, LngLatAlt } from '../interfaces';

proj4.defs('EPSG:4978', '+proj=geocent +datum=WGS84 +units=m +no_defs');


/** Convert from EPSG:4978 to EPSG:4979 
 * - EPSG:4979: WGS84 (EPSG:4326) + Height Above The Ellipsoid
 * - EPSG:4978: ECEF
 */
export function wgs84WithEllipsoidalHeightToEcef(lngLatAlt: LngLatAlt): Vector3 {
    const [x, y, z] = proj4('EPSG:4326', 'EPSG:4978', [...lngLatAlt.point, lngLatAlt.height]) as [number, number, number];
    return new Vector3(x, y, z);
}

/** Convert from EPSG:4978 to EPSG:4979
 * - EPSG:4978: ECEF
 * - EPSG:4979: WGS84 (EPSG:4326) + Height Above The Ellipsoid */
export function ecefToWgs84WithEllipsoidalHeight(point: Vector3): LngLatAlt {
    const [longitude, latitude, height] = proj4('EPSG:4978', 'EPSG:4326', point.toArray()) as [number, number, number];
    return { point: [longitude, latitude], height };
}

/** Returns vectors pointing east, south, up in ECEF space.
 * The up vector points away from earth's core.
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
    // It helps to imagine the initial 3js coordinate system as identical to the ECEF system, [0,0,0] being earth's core, and the 3d model resting somewhere on the shell.
    // The "ecefAnchor" is also somewhere on the shell, sitting exactly at the ellipsoidal height of 0.
    // We don't like that. We want the anchor to be at 0,0,0. This transformation takes care of that.
    // It moves around the 3d model in the 3js world as follows.
    // 1. make "ecefAnchor" match the [0,0,0] "Origin" (see terminlogy in internal-docs/coordinate-systems.md)
    // We move the entire 3dtiles model from the earth's shell into earth's core and "ecefAnchor" is now on 0,0,0 in the 3js world.
    // if Ellipoidal height equals undulation, then 0,0,0 is now also the sea level height
    const ecefAnchor = wgs84WithEllipsoidalHeightToEcef({ point: anchor, height: ellipsoidalHeight });
    // 2. Rotate the whole 3dtiles model so that its UP is the same as the threeJS up.
    // We have made the up side of the 3d tiles model point to the north pole (model is sitting at earth's core)
    // We have now aligned the 3d tiles with our 3js coordinate system. 0,0,0 is the anchor point. (0,1,0) is up, (1,0,0) is east, (0,0,1) is south, the anchor is at [0,0,0] and the ellipsoid is at height 0.
    const matrix_translateEcefAnchorToOrigin = new Matrix4().makeTranslation(-ecefAnchor.x, -ecefAnchor.y, -ecefAnchor.z);
    const matrix_rotateEcefTo3JS = new Matrix4().makeRotationFromQuaternion(getEcefOrientationMatrix(anchor)).transpose(); // the transpose of a rotation matrix is equal to its inverse.
    return new Matrix4()
        .multiply(matrix_rotateEcefTo3JS)
        .multiply(matrix_translateEcefAnchorToOrigin);
    // The only thing left in terms of projections is to sync the 3js camera and the maplibre camera. But this is done elsewhere.
    
    // fun fact / exercise for the reader:
    // previously I called wgs84WithEllipsoidalHeightToEcef({ point: anchor, height: 0 }); as in, the anchor is always sitting on the ellipsoid initially,
    // and I had a step 3 which is .makeTranslation(0, -ellipsoidalHeight, 0). The two methods are equavilant. It's instructive to understand why. 
}

/** Returns an affine-transformation on anchor-relative coordinates. The specific transformation
 * is determined by getTransformParameters. We use the returned matrix to translate local coordinates where the anchor is 0,0,0 
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
