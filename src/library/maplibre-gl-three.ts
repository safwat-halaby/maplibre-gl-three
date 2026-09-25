import { ThreeDManagerImpl } from './core/ThreeDManagerImpl';
import { PlateCarreeTools } from './helpers/plateCarreeTools';
import { GeoTiffGeographicRaster } from './adapters/GeoTiffGeographicRaster';
import { BilinearGeographicRaster } from './helpers/BilinearGeographicRaster';
import type {
    Asset,
    CreateLayerOptions,
    GetTransformParameters,
    Load3dTilesOptions,
    LngLat,
    LngLatAlt,
    ThreeDManagerOptions,
    ThreeDTilesAsset,
    MetersOffset,
    ThreeLayer,
    AffineTransformation,
    VerticalDatumOptions,
    calculateAnchorPoint,
} from './interfaces';

export { PlateCarreeTools };
export { getEcefOrientationMatrix } from './helpers/coordinates';
export type {
    Asset,
    CreateLayerOptions,
    GetTransformParameters,
    Load3dTilesOptions,
    LngLat,
    LngLatAlt,
    ThreeDManagerOptions,
    ThreeDTilesAsset,
    MetersOffset as ThreeDTilesOffset,
    ThreeLayer,
    AffineTransformation as TransformParameters,
    VerticalDatumOptions,
    calculateAnchorPoint,
};

export class ThreeDManager extends ThreeDManagerImpl {
    /** @see {@link ThreeDManagerOptions} */
    constructor(options: ThreeDManagerOptions = {}) {
        super(
            new BilinearGeographicRaster(
                new GeoTiffGeographicRaster(options.verticalDatum),
            ),
            options,
        );
    }
}
