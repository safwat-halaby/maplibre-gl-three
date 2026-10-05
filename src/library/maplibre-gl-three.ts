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
    TilesRendererConfig,
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
    TilesRendererConfig,
    ThreeDTilesAsset,
    MetersOffset,
    ThreeLayer,
    AffineTransformation as TransformParameters,
    VerticalDatumOptions,
    calculateAnchorPoint,
};

/** This class is the entry point of this library. It manages a MapLibre map's 3D layers.
 * If you have multiple MapLibre maps, you should use a separate ThreeDManager for each.
 * */
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
