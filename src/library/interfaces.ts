import type { CustomLayerInterface, Map as MapLibreMap } from 'maplibre-gl';
import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { TilesRenderer } from '3d-tiles-renderer';

export type LngLat = [longitude: number, latitude: number];
/** A WGS84 (EPSG:4326) point with height included.
Normally, height is assumed to be above mean sea level. Also known as orthometric height.

If you've disabled vertical datum conversions, the orthometric height will be approximated to always equal the ellipsoidal height.
This may cause vertical offset issues if you're using 3D Tiles or other ECEF-based/ellipsoidal-height-based data sources along with MapLibre 3D terrain, which uses orthometric height. */
export interface LngLatAlt {
    point: LngLat;
    height: number;
}

/** Represents an affine transformation (A transformation combining translation, rotation, and scaling). */
export interface AffineTransformation {
    translateX: number;
    translateY: number;
    translateZ: number;
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    scaleEast: number;
    scaleSouth: number;
    scaleUp: number;
}

/** Represents an offset in meters. */
export interface MetersOffset {
    east: number;
    up: number;
    south: number;
}

/** See ThreeDManagerOptions for an explanation */
export type calculateAnchorPoint = (mapInstance: MapLibreMap) => LngLat;
/** See ThreeDManagerOptions for an explanation */
export type GetTransformParameters = (anchor4326: LngLat) => AffineTransformation;

export interface VerticalDatumOptions {
    /**
     * Optional URL of the GeoTIFF vertical datum file.
     * Ignored if the vertical datum corrections are disabled via
     * {@link VerticalDatumOptions.enabled}
     * 
     * @see {@link https://github.com/OSGeo/PROJ-data/tree/master | More info about the datum file and the CDN}
     * @see {@link https://maplibre-gl-three.readthedocs.io/en/latest/principles/#heights-and-datums | More info about vertical datums in this library}
     * @defaultValue `https://cdn.proj.org/us_nga_egm96_15.tif`
     */
    path?: string;
    /**
     * Whether to load and apply the vertical datum. When disabled, uses a
     * zero-undulation approximation.
     * 
     * @see {@link https://maplibre-gl-three.readthedocs.io/en/latest/principles/#heights-and-datums | More info about vertical datums in this library}
     * @defaultValue true
     */
    enabled?: boolean;
}

/** Options for configuring maplibre-gl-three. */
export interface ThreeDManagerOptions {
    /**
     * If true, renders the Three.js anchor point for debugging.
     * @defaultValue false
     */
    debugMode?: boolean;
    /**
     * Path to the Draco loader to be lazy loaded if needed.
     * This is used internally by 3d-tiles-renderer to decompress Draco-compressed 3D Tiles.
     * @defaultValue https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/draco/
     */
    dracoPath?: string;
    /**
     * Path to the KTX2 loader to be lazy loaded if needed.
     * This is used internally by 3d-tiles-rendrer.
     * @defaultValue https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/basis/
     */
    ktx2Path?: string;
    /**
     * Configuration for loading and applying a vertical datum, necessary for accurate above-sea-level calculations.
     * 
     * @see {@link VerticalDatumOptions}
     * @see {@link https://github.com/OSGeo/PROJ-data/tree/master | More info about the vertical datum}
     */
    verticalDatum?: VerticalDatumOptions;
    /**
     * Advanced optional callback for overriding the calculation of the anchor point.
     * 
     * By default, whenever the MapLibre map moves, the anchor point is calculated to be the lng-lat of the center of the camera.
     */
    calculateAnchorPoint?: calculateAnchorPoint;
    /**
     * Advanced optional callback for overriding the internal transform parameters. Explanation below.
     * 
     * Suppose we have an anchor at the geographical location 35, 31 (WGS84).
     * 5 meters to the east of it, we have a point.
     * In the LocalSpace coordinate system, the anchor is at 0,0,0 while the point to the right is at 5,0,0.
     * But what is the point's geographical position? (It's probably 35 plus-something, 31).
     * 
     * This callback expects you to return an affine transformation(translate,rotate,scale), such that when any anchor-relative coordinate like 5,0,0 is transformed, the proper geographical location is returned.
     * 
     * This is an approximation. An affine transformation cannot really take the Earth's curvature into account.
     * It turns out this approximation is very accurate around the anchor. The anchor is recalculated whenever the map moves, such that 0,0,0 is the camera center. The accuracy problem is largely solved!
     * 
     * If not supplied, the default transformation assumes MapLibre's internal coordinate system, Web Mercator.
     * 
     * @see {@link https://maplibre-gl-three.readthedocs.io/en/latest/examples/repo/ | the repo example which uses a Plate Carree projection}
     */
    getTransformParameters?: GetTransformParameters;
}

export interface Load3dTilesOptions {
    tilesetUrl: string;
    /**
     * Offset in meters along east/up/south.
     */
    offset?: MetersOffset;
    /**
     * Optional callback used to transform URLs before 3d-tiles-renderer fetches them. Useful for authorization tokens.
     */
    preprocessURL?: (url: string) => string;
    /**
     * Optional maximum traversal depth for the loaded tileset.
     */
    maxDepth?: number;
}

export interface CreateLayerOptions {
    /** The layer id as it would appear in MapLibre. If no id is supplied, an id will be auto-generated. */
    id?: string;
    /** Clear depth before this layer's entire scene. Defaults to true.
     * If true, the MapLibre layers that came before will be below this layer.
     * If false, the MapLibre layers that came before will be interlaced, meaning visibility at each pixel is determined by whatever is closer to the camera. 
     * If both separatorBefore and separatorAfter are true (default), the depth is dictated solely by MapLibre layer order. 
     */
    separatorBefore?: boolean;
    /** Clear depth after this layer's entire scene. Defaults to true.
     * If true, the MapLibre layers that come after will cover this layer.
     * If false, the MapLibre layers that come after will be interlaced, meaning visibility at each pixel is determined by whatever is closer to the camera. 
     * If both separatorBefore and separatorAfter are true (default), the depth is dictated solely by MapLibre layer order. 
     */
    separatorAfter?: boolean;
}

/** An asset is something that is loaded to a ThreeLayer in addition to the raw Three.js primitives.
 * Currently the only supported asset type is ThreeDTilesAsset. */
export interface Asset {
    /** Returns whether or not the asset has been destroyed. 
     * An asset may be manually destroyed with destroy(), but is also automatically destroyed if its parent ThreeLayer is destroyed.
    */
    isDestroyed(): boolean;
    /** Live content object. Placement owned by the library is on its parent. */
    getObject3D(): Object3D;
    /** Removes and disposes this asset, leaving its layer and siblings alive. */
    destroy(): void;
}

/** A 3D Tiles asset that is loaded to a layer and rendered on the map.
 * The asset is a thin wrapper around the "3d-tiles-renderer" library.
*/
export interface ThreeDTilesAsset extends Asset {
    /** Returns the underlying TilesRenderer object of the 3d-tiles-renderer library. */
    getTilesRenderer(): TilesRenderer;
    /** Returns the offset. See setOffset for details. */
    getOffset(): MetersOffset;
    /** Sets an offset, in meters, relative to where the 3D Tiles would be on Earth if there were no offset.
     * Positive up offset moves the tiles away from the Earth's core.
     * Positive east offset moves the tiles towards the eastern horizon.
     * Positive south offset moves the tiles towards the southern horizon.
     */
    setOffset(offset: MetersOffset): void;
    /** Returns the center of the containing sphere of the 3D Tiles model. Null if the 3D Tiles aren't yet loaded.
     * You're advised to await the loading of the root tile so that null is not obtained. Use
     * .getTilesRenderer().addEventListener('load-root-tileset', () => {
         // getReference is ready unless something went wrong.
	});
     */
    getReference(): LngLatAlt | null;
}

/** A thin wrapper around a MapLibre custom layer and a Three.js scene.
 * It can be added to a MapLibre map just like any other layer.
 * The scene can be manipulated just like any Three.js scene.
 * It exposes convenience functions for creating common assets such as 3D Tiles, as well as lower-level Three.js primitives for rendering
 * anything Three.js can render on a MapLibre custom layer. The camera is auto-synced with MapLibre's camera.
 * */
export interface ThreeLayer extends CustomLayerInterface {
    id: string;
    type: 'custom';
    renderingMode: '3d';
    /** Returns whether or not the layer has been destroyed. 
     * A layer may be manually destroyed with destroy(), but is also automatically destroyed if its parent ThreeDManager is destroyed.
    */
    isDestroyed(): boolean;
    /** Returns the Three.js scene. Objects within the scene are expected to have ECEF Vector3 coordinates.
     * The simplest way for achieving this is with ThreeDManager.getEcefMatrix.
     * Note: The library owns and updates the scene matrix. Do not touch the scene matrix.
     * Other than this, you may use the scene as you normally would use it in Three.js.
    */
    getScene(): Scene;
    /** Returns the library-controlled Three.js camera in LocalSpace coordinates, updated during render.
     * Updating the camera is not advised. But it can be used for querying. E.g. raycasting.
     */
    getCamera(): PerspectiveCamera;
    /** Returns the Three.js WebGLRenderer. Returns null while the layer is detached from a map. */
    getRenderer(): WebGLRenderer | null;
    /** Adds 3D Tiles to the map and returns the controlling asset. Resolves after asset setup, not after streaming finishes.
     * The asset is a thin wrapper around the "3d-tiles-renderer" library.
     * 
     * If the current Three.JS scene is empty, automatically adds an ambient light as a sane default before adding the 3D Tiles.
     * To prevent this behaviour, add your own lighting or any object to the scene before calling load3dTiles.
     */
    load3dTiles(options: Load3dTilesOptions): Promise<ThreeDTilesAsset>;
    /** Calls MapLibre's triggerRepaint(). */
    requestRepaint(): void;
    /** Permanently removes the layer and destroys all child assets. */
    destroy(): void;
}
