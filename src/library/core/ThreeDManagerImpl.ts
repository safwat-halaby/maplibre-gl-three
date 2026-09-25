import * as THREE from 'three';
import { MercatorCoordinate, type Map as MapLibreMap } from 'maplibre-gl';
import { ecefToWgs84WithEllipsoidalHeight, ecefToLocalMatrix, wgs84WithEllipsoidalHeightToEcef, affineTransformation } from '../helpers/coordinates';
import { ThreeLayerImpl, type LayerServices } from './ThreeLayerImpl';
import type { AnchorMatrices, GeographicRaster } from './internal-interfaces';
import type {
    CreateLayerOptions, GetTransformParameters,
    LngLat, LngLatAlt, ThreeDManagerOptions, ThreeLayer, AffineTransformation, calculateAnchorPoint,
} from '../interfaces';

const DEFAULT_DRACO_PATH = 'https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/draco/';
const DEFAULT_KTX2_PATH = 'https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/basis/';

/** This class is the entry point of this library. It manages a MapLibre map's 3d layers.
 * If you have multiple MapLibre maps, you should use a separate ThreeDManager for each.
*/
export class ThreeDManagerImpl {
    /** All of our layers, whether attached to a MapLibre map or not */
    private layers = new Map<string, ThreeLayerImpl>();
    /** All of our layers which were added(attached) to a MapLibre map */
    private attachedLayers = new Set<ThreeLayerImpl>();
    /** The MapLibre map instance. For the sake of a clean API, we "Steal" this from a layer when it's added to the map. */
    private mapInstance: MapLibreMap | null = null;
    /** The anchor matrices are responsible for converting between the different coordinate systems.
     * The anchor is the main graphical trick of this library. See coordinate-systems.md and updateAnchor to make sense of this.
     * Short version: the "anchor" is the same point in several coordinate systems. The matrices convert between those different versions of the anchor.
     * The anchor goes by different names in each coordinate system:
     * Origin:     [0,0,0]    in the threeJS world. aka "local space".
     * anchor4326: [lon, lat] a geographical point close to the MapLibre camera center. WGS84 EPSG:4326
     * anchorEcef: [x,y,z] The same geographical point described in meters offset from earth's core. ECEF (EPSG:4978)
     * 
     * localToEcef and ecefToLocal convert points between ECEF and local space.
     * localToMap converts from local space to the web mercator(by default) point that corresponds to anchor4326.
     * (MapLibre's internal coordinate system is web mercator EPSG:3857, not WGS84 EPSG:4326).
     * 
     * The calculation of matrices is performed in updateAnchor(). The "input" is an anchor4326 returned by the callback `calculateAnchorPoint`.
     */
    private anchorMatrices: AnchorMatrices | null = null;
    private anchorDirty = true;
    /** If true, will render some debug markers. Currently anchor-local axis system. */
    private debugMode: boolean;
    private status : 'not_initialized' | 'initializing' | 'ready' | 'destroyed' = 'not_initialized';
    // CONSTRUCTOR PARAMETERS
    private dracoPath: string;
    private ktx2Path: string;
    private calculateAnchorPoint: calculateAnchorPoint;
    private getTransformParameters: GetTransformParameters;
    /** The raster representing the geoid undulation. See this.getGeoidUndulation for more info. */
    private verticalDatum: GeographicRaster;
    

    private moveHandler = () => {
        // Coalesce moves until the next render, then rebase all scenes together.
        this.anchorDirty = true;
        this.mapInstance?.triggerRepaint();
    };

    protected constructor(
        verticalDatum: GeographicRaster,
        {
            debugMode = false,
            dracoPath = DEFAULT_DRACO_PATH,
            ktx2Path = DEFAULT_KTX2_PATH,
            calculateAnchorPoint = calculateWebMercatorAnchorPoint,
            getTransformParameters = getWebMercatorTransformParameters,
        }: ThreeDManagerOptions = {},
    ) {
        this.verticalDatum = verticalDatum;
        this.debugMode = debugMode;
        this.dracoPath = dracoPath;
        this.ktx2Path = ktx2Path;
        this.calculateAnchorPoint = calculateAnchorPoint;
        this.getTransformParameters = getTransformParameters;
    }

    isDestroyed(): boolean { return this.status === 'destroyed'; }

    /** Must call this before using threeDManager. Initializes services that are shared by all layers.
     * If vertical datums are enabled (default yes), will trigger a network request for fetching the vertical datum.
    */
    async init(): Promise<void> {
        if (this.status === 'destroyed') {
            throw new Error('Initializing a destroyed manager');
        }
        if (this.status === 'initializing') {
            throw new Error('Double-initializing a manager');
        }
        this.status = 'initializing';
        try {
            await this.verticalDatum.init();
        } catch (e) {
            this.status = 'not_initialized';
            throw e;
        }
        this.status = 'ready';
    }

    /** Creates a new layer which implements the MapLibre customLayer interface and can be added to a MapLibre map.
     * The layer exposes convenience functions for creating common assets such as 3dTiles,
     * as well as lower-level threeJS primitives for rendering anything with threeJS on a Maplibre custom layer.
     * If no id is supplied, an id will be auto-generated.
    */
    createLayer(options?: CreateLayerOptions): ThreeLayer {
        if (!options) {
            options = {}
        }
        this.assertReady();
        const services: LayerServices = {
            debugMode: this.debugMode,
            dracoPath: this.dracoPath,
            ktx2Path: this.ktx2Path,
            notifyAttach: (layer, map) => this.attachLayer(layer, map),
            notifyDetach: layer => this.detachLayer(layer),
            notifyDestroy: layer => this.layers.delete(layer.id),
            updateAnchor: () => this.updateAnchor(),
            ecefToLngLatAlt: point => this.ecefToLngLatAlt(point),
        };
        const layer = new ThreeLayerImpl(options, services);
        if (this.layers.has(layer.id)) throw new Error(`Layer "${layer.id}" already exists`);
        this.layers.set(layer.id, layer);
        if (this.anchorMatrices) layer.applyAnchor(this.anchorMatrices);
        return layer;
    }

    /** Convert longitude/latitude (degrees) and altitude above sea level (meters) to ECEF.
     * - Source coordinates: EPSG:9707 (which is a WGS84 (EPSG:4326) point with orthometric height (EGM96 EPSG:5773)) 
     * - Used vertical datum: EGM96 EPSG:5773
     * - Output coordinates: EPSG:4978
    */
    lngLatAltToEcef(lngLatAlt: LngLatAlt): THREE.Vector3 {
        this.assertReady();
        const { point, height } = lngLatAlt;
        return wgs84WithEllipsoidalHeightToEcef({
            point,
            height: height + this.getGeoidUndulation(point),
        });
    }

    /** Convert ECEF to longitude/latitude and height above sea level.
     * - Source coordinates: EPSG:4978
     * - Used vertical datum: EGM96 EPSG:5773
     * - Output coordinates: EPSG:9707 (which is a WGS84 (EPSG:4326) point with orthometric height (EGM96 EPSG:5773)) 
     */
    ecefToLngLatAlt(point: THREE.Vector3): LngLatAlt {
        this.assertReady();
        const result = ecefToWgs84WithEllipsoidalHeight(point);
        return {
            point: result.point,
            height: result.height - this.getGeoidUndulation(result.point),
        };
    }

    /** Convert a Three.js local-space point (e.g. a raycast hit) to an ECEF Vector3.
     * ATTENTION: This assumes the camera has not yet moved since the local-space point was generated.
     * If the camera has moved, you should not use the local-space point anymore.
      * If raycasting, the best way to avoid trouble is to immediately convert any calculated localPoint using localVectorToEcef or localVectorToLngLatAlt
     * 
     * Output coordinates: EPSG:4978
     */
    localVectorToEcef(point: THREE.Vector3): THREE.Vector3 {
        this.assertReady();
        if (!this.anchorMatrices) throw new Error('Attach a layer before converting anchor-local coordinates');
        return point.clone().applyMatrix4(this.anchorMatrices.localToEcef);
    }
    /** Convert an ECEF point to a Three.js local-space point. You should probably not use this function unless you know what you're doing.
     * ATTENTION: Once the camera moves, you should not use the generated local-space point anymore.
     */
    ecefToLocalVector(point: THREE.Vector3): THREE.Vector3 {
        this.assertReady();
        if (!this.anchorMatrices) throw new Error('Attach a layer before converting anchor-local coordinates');
        return point.clone().applyMatrix4(this.anchorMatrices.ecefToLocal);
    }

    /** Convert a Three.js local-space point (e.g. a raycast hit) to a longitude, latitude, and height above sea level.
     * * ATTENTION: This assumes the camera has not yet moved since the local-space point was generated.
     * If the camera has moved, you should not use the local-space point anymore.
      * If raycasting, the best way to avoid trouble is to immediately convert any calculated localPoint using localVectorToEcef or localVectorToLngLatAlt
     * 
     * Output coordinates: EPSG:9707 (which is a WGS84 (EPSG:4326) point with orthometric height (EGM96 EPSG:5773)) 
     */
    localVectorToLngLatAlt(point: THREE.Vector3): LngLatAlt {
        return this.ecefToLngLatAlt(this.localVectorToEcef(point));
    }
    
    lngLatAltToLocal(point: LngLatAlt): THREE.Vector3 {
        return this.ecefToLocalVector(this.lngLatAltToEcef(point))
    }


    /**
     * Returns a matrix which, when applied to a ThreeJS object, places the object at the given location in ECEF space,
     * rotating it such that local +X points east, +Y points up, and +Z points south.
     * 
     * Typical usage: threeObject.applyMatrix4(threeDManager.getEcefMatrix(lngLatAlt));
     * 
     * This is very useful on a threeJS group. The children of the group's positions would be given as an offset from lngLatLat in meters.
     * 
     * This is equivalent to:
     *  - threeObject.position.copy(threeDManager.lngLatAltToEcef(lngLatAlt));
     *  - threeObject.quaternion.copy(getEcefOrientationMatrix(lngLatAlt));
     */
    getEcefMatrix(point: LngLatAlt): THREE.Matrix4 {
        return ecefToLocalMatrix(point.point, point.height + this.getGeoidUndulation(point.point))
            .invert();
    }

    /** Returns a matrix which transforms ECEF coordinates to the localSpace coordinates of the current anchor.
     * 
     * This is most useful to set on a raycaster with `raycaster.ray.applyMatrix4(threeDManager.getEcefMatrix())`.
     * Afterwards the rays can be fed into it in ECEF coordinates. 
     * The raycaster output would still be in localSpace, and can be converted to ECEF with vector.applyMatrix4(threeDManager.getAnchorLocalToEcefMatrix())
     * */
    getAnchorEcefToLocalMatrix(): THREE.Matrix4 {
        if (!this.anchorMatrices) {
            throw new Error('called getAnchorEcefMatrix before an anchor point was created.')
        }
        return this.anchorMatrices.ecefToLocal;
    }

    /** The inverse of `getAnchorEcefToLocalMatrix`. See that function for docs. */
    getAnchorLocalToEcefMatrix(): THREE.Matrix4 {
        if (!this.anchorMatrices) {
            throw new Error('called getAnchorEcefMatrix before an anchor point was created.')
        }
        return this.anchorMatrices.localToEcef;
    }

    destroy(): void {
        if (this.isDestroyed()) return;
        for (const layer of [...this.layers.values()]) layer.destroy();
        this.mapInstance = null;
        this.anchorMatrices = null;
        this.status = 'destroyed';
    }

    private assertReady(): void {
        if (!(this.status === 'ready')) throw new Error('Await manager.init() before using geographic services or creating layers');
    }

    /** Ideally, the mean sea level follows the ellipsoid perfectly. In the real world the sea goes up and down because Earth's 
     * gravity is not perfectly uniform. (metalic density, etc). The actual mean sea level follows what's known as the geoid.
     * The geoid can be up to 100 meters higher/lower than the ellipsoid. The difference between the two is known as the geoid undulation.
     * If the geoid is 30 meters below the ellipsoid at a certain point, this would return -30.
     * This is calculated using the EGM96 (EPSG:5773) vertical datum.
     */
    private getGeoidUndulation(point: LngLat): number {
        return this.verticalDatum.getPixelValue(this.verticalDatum.wgs84ToPixels([...point]));
    }
    /** Called by a layer when it's added to the map. We start calculating anchors if 1 or more layers are attached. */
    private attachLayer(layer: ThreeLayerImpl, map: MapLibreMap): void {
        this.assertReady();
        if (this.mapInstance && this.mapInstance !== map) {
            throw new Error('A ThreeDManager can only serve one MapLibre map');
        }
        this.mapInstance = map;
        if (this.attachedLayers.size === 0) {
            map.on('move', this.moveHandler);
            this.anchorDirty = true;
        }
        this.attachedLayers.add(layer);
        this.updateAnchor();
    }
    /** Called by a layer when it's removed from the map. */
    private detachLayer(layer: ThreeLayerImpl): void {
        if (this.attachedLayers.delete(layer) && this.attachedLayers.size === 0) {
            this.mapInstance?.off('move', this.moveHandler);
        }
    }
    /** Update the geographical location of the anchor if it's dirty. What makes an anchor dirty is camera movement. See this.moveHandler.
     * This is called by an attached layer when it needs to render itself.
     * It may be called multiple times in a frame if we have multiple layers, but only the first call would perform a calculation.
     * Once an anchor is updated, the local reference frame shifts. a ThreeJS 0,0,0 point is always where the anchor is at.
     */
    private updateAnchor(): void {
        if (!this.anchorDirty || !this.mapInstance) return;
        // calculate the anchor point. The default calculation is "calculateWebMercatorAnchorPoint" but is user-overridable.
        const anchor4326 = this.calculateAnchorPoint(this.mapInstance);
        const ecefToLocal = ecefToLocalMatrix(anchor4326, this.getGeoidUndulation(anchor4326));
        // The 3js objects have ECEF coordinates, but they are children of the scene.
        // and the scene's matrix will end up being "ecefToLocal" in ThreeLayerImpl,
        // so the final WorldMatrix/world coordinates of the 3js objects
        // will be in local space, around the 0,0,0 anchor.
        this.anchorMatrices = {
            ecefToLocal,
            localToEcef: ecefToLocal.clone().invert(),
            localToMap: affineTransformation(anchor4326, this.getTransformParameters),
        };
        for (const layer of this.layers.values()) layer.applyAnchor(this.anchorMatrices);
        this.anchorDirty = false;
    }
}

/** The default calculateAnchorPoint. See the ThreeDManager public interface docs for more info. */
function calculateWebMercatorAnchorPoint(map: MapLibreMap): LngLat {
    const { lng, lat } = map.getCenter();
    return [lng, lat];
}

/** The default getTransformParameters function. See the ThreeDManager public interface docs for more info. */
function getWebMercatorTransformParameters(anchor4326: LngLat): AffineTransformation {
    const coordinate = MercatorCoordinate.fromLngLat(anchor4326);
    // A web mercator "meter" unit is not a real meter except on the equator. Given a longitude/latitude, this returns the needed scaling.
    const scale = coordinate.meterInMercatorCoordinateUnits();
    return {
        translateX: coordinate.x, translateY: coordinate.y, translateZ: coordinate.z,
        rotateX: Math.PI / 2, rotateY: 0, rotateZ: 0,
        scaleEast: scale, scaleSouth: scale, scaleUp: scale,
    };
}
