import type { CustomLayerInterface, Map as MapLibreMap } from 'maplibre-gl';

export type LngLatAltitude = [longitude: number, latitude: number, altitude: number];

export interface TransformParameters {
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

export interface ThreeDTilesOffset {
    east: number;
    up: number;
    south: number;
}

export type calculateAnchorPoint = (mapInstance: MapLibreMap) => LngLatAltitude;
export type GetTransformParameters = (anchor4326: LngLatAltitude) => TransformParameters;

export interface VerticalDatumOptions {
    /**
     * URL of the GeoTIFF vertical datum file.
     * @defaultValue `https://cdn.proj.org/us_nga_egm96_15.tif`
     */
    path?: string;
    /**
     * Whether to load and apply the vertical datum.
     * @defaultValue true
     */
    enabled?: boolean;
}

export interface ThreeDManagerOptions {
    /**
     * If true, renders the 3JS anchor point for debugging.
     * @defaultValue false
     */
    debugMode?: boolean;
    /**
     * Path to the Draco loader to be lazy loaded if needed.
     * This is used internally by 3d-tiles-rendrer to decompress draco-compressed 3dtiles.
     * @defaultValue `https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/draco/`
     */
    dracoPath?: string;
    /**
     * Path to the KTX2 loader to be lazy loaded if needed.
     * * This is used internally by 3d-tiles-rendrer.
     * @defaultValue `https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/basis/`
     */
    ktx2Path?: string;
    /**
     * Configuration for loading and applying a vertical datum.
     */
    verticalDatum?: VerticalDatumOptions;
    /**
     * Advanced callback for overriding the calculation of the anchor point.
     */
    calculateAnchorPoint?: calculateAnchorPoint;
    /**
     * Advanced callback for overriding the internal transform parameters.
     */
    getTransformParameters?: GetTransformParameters;
}

export interface Load3dTilesOptions {
    tilesetUrl: string;
    layerId?: string;
    /**
     * Optional `{ east, up, south }` translation applied to the 3d tiles in meters.
     */
    offset?: ThreeDTilesOffset;
    /**
     * Optional callback used to transform URLs before 3d-tiles-renderer fetches them. useful for authorization tokens.
     */
    preprocessURL?: (url: string) => string;
    /**
     * Optional maximum traversal depth for the loaded tileset.
     */
    maxDepth?: number;
}

export interface GetLayerOptions {
    separatorBefore?: boolean;
    separatorAfter?: boolean;
}

export interface Asset {
    readonly destroyed: boolean;
    /**
     * Returns the MapLibre custom layer for this tileset.
     *
     * @param options - Layer options.
     * @param options.separatorBefore - Clears depth before rendering the layer. Defaults to `true`.
     * @param options.separatorAfter - Clears depth after rendering the layer. Defaults to `true`.
     */
    getLayer(options?: GetLayerOptions): CustomLayerInterface;
    destroy(): void;
}

export interface ThreeDTilesAsset extends Asset {

}

export interface SeparatorAsset extends Asset {

}

/** INTERNAL INTERFACES */
export interface EllipsoidalToOrthometric {
    init(): Promise<void>;
    getOrthometricHeight(point: [number, number]): number;
}
