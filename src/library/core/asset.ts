import type { Object3D, Vector3 } from 'three';
import type { Asset as AssetInterface, LngLatAlt } from '../interfaces';

export interface AssetServices {
    dracoPath: string;
    ktx2Path: string;
    ecefToLngLatAlt(point: Vector3): LngLatAlt;
}

export abstract class Asset implements AssetInterface {
    protected constructor(protected services: AssetServices) {}

    abstract isDestroyed(): boolean;
    abstract getObject3D(): Object3D;
    abstract destroy(): void;
}
