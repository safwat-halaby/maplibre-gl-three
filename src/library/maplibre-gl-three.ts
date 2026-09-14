import { ThreeDManager as CoreThreeDManager, Separator } from './core';
import { PlateCarreeTools } from './plateCarreeTools';
import { GeoTiffGeographicRaster } from './adapters/GeoTiffGeographicRaster';
import { BilinearGeographicRaster } from './adapters/BilinearGeographicRaster';
import type {
    Asset,
    GetLayerOptions,
    GetTransformParameters,
    Load3dTilesOptions,
    LngLatAltitude,
    SeparatorAsset,
    ThreeDManagerOptions,
    ThreeDTilesAsset,
    ThreeDTilesOffset,
    TransformParameters,
    VerticalDatumOptions,
    calculateAnchorPoint,
} from './interfaces';

export { PlateCarreeTools, Separator };
export type {
    Asset,
    GetLayerOptions,
    GetTransformParameters,
    Load3dTilesOptions,
    LngLatAltitude,
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
