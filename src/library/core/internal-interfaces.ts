import type { Matrix4 } from 'three';
import type { LngLat } from '../interfaces';

export interface AnchorMatrices {
    ecefToLocal: Matrix4;
    localToEcef: Matrix4;
    localToMap: Matrix4;
}

/** Represents a raster that has geographic awareness. */
export interface GeographicRaster {
    init(): Promise<void>;
    /** Given a pixel coordinate, reads the pixel and returns the value */
    getPixelValue(pixel: [number, number]): number;
    /** Given a wgs84 (EPSG:4326) longitude and a latiude, returns the corresponding pixel coordinates. Note that depending on resolution
     * a pixel may be a square spanning a large area. The returned coordinates are therefore not rounded
     * Example:  1042.5, 1322.5 means the coordinate is right in the middle of the pixel's square while 1042.0, 1322.0 is top left corner of the pixel's square. 
     */
    wgs84ToPixels(point: LngLat): [number, number];
}
