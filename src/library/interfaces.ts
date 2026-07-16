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
