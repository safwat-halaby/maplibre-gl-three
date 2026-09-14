import { expect, test, vi } from 'vitest';
import type { GeographicRaster } from '../interfaces';
import { BilinearGeographicRaster } from './BilinearGeographicRaster';

test('initializes the underlying raster and bilinearly interpolates its neighboring pixels', async () => {
	const raster: GeographicRaster = {
		init: vi.fn(async () => undefined),
		wgs84ToPixels: vi.fn(([x, y]) => [x, y]),
		getPixelValue: vi.fn(([x, y]) => x + y * 10),
	};
	const interpolatedRaster = new BilinearGeographicRaster(raster);

	await interpolatedRaster.init();

	expect(interpolatedRaster.getPixelValue([35.5, 34.3])).toBeCloseTo(378.5);
	expect(raster.init).toHaveBeenCalledOnce();
	expect(raster.getPixelValue).toHaveBeenNthCalledWith(1, [35, 34]);
	expect(raster.getPixelValue).toHaveBeenNthCalledWith(2, [36, 34]);
	expect(raster.getPixelValue).toHaveBeenNthCalledWith(3, [35, 35]);
	expect(raster.getPixelValue).toHaveBeenNthCalledWith(4, [36, 35]);
});
