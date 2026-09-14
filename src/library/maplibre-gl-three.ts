import { ThreeDManager as CoreThreeDManager } from './core';
import { PlateCarreeTools } from './helpers/plateCarreeTools';
import { GeoTiffGeographicRaster } from './adapters/GeoTiffGeographicRaster';
import { BilinearGeographicRaster } from './helpers/BilinearGeographicRaster';
import type {
    Asset,
    GetLayerOptions,
    GetTransformParameters,
    Load3dTilesOptions,
    LngLat,
    SeparatorAsset,
    ThreeDManagerOptions,
    ThreeDTilesAsset,
    ThreeDTilesOffset,
    TransformParameters,
    VerticalDatumOptions,
    calculateAnchorPoint,
} from './interfaces';

export { PlateCarreeTools };
export type {
    Asset,
    GetLayerOptions,
    GetTransformParameters,
    Load3dTilesOptions,
    LngLat,
    SeparatorAsset,
    ThreeDManagerOptions,
    ThreeDTilesAsset,
    ThreeDTilesOffset,
    TransformParameters,
    VerticalDatumOptions,
    calculateAnchorPoint,
};

export class ThreeDManager extends CoreThreeDManager {
    constructor(options: ThreeDManagerOptions = {}) {
        super(
            new BilinearGeographicRaster(
                new GeoTiffGeographicRaster(options.verticalDatum),
            ),
            options,
        );
    }
}
