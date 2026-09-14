import { expect, test, vi } from 'vitest';
import { ThreeDManager } from './core';
import type { GeographicRaster, LngLat } from './interfaces';

class TestThreeDManager extends ThreeDManager {
    constructor(geographicRaster: GeographicRaster) {
        super(geographicRaster);
    }
}

test('initializes the geographic raster before loading tiles', async () => {
    const raster: GeographicRaster = {
        init: vi.fn(async () => undefined),
        getPixelValue: vi.fn(([longitude, latitude]) => longitude + latitude),
        wgs84ToPixels: vi.fn(([longitude, latitude]): LngLat => [longitude, latitude]),
    };
    const manager = new TestThreeDManager(raster);

    const tiles = await manager.load3dTiles({ tilesetUrl: 'tileset.json' });

    expect(raster.init).toHaveBeenCalledOnce();
    expect(manager.getGeoidUndulation([35.049, 31.703])).toBeCloseTo(66.752, 3);
    expect(raster.wgs84ToPixels).toHaveBeenLastCalledWith([35.049, 31.703]);
    expect(raster.getPixelValue).toHaveBeenLastCalledWith([35.049, 31.703]);

    tiles.destroy();
});
