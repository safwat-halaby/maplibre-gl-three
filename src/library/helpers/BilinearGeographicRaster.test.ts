import { expect, test, vi } from 'vitest';
import type { GeographicRaster, LngLat } from '../interfaces';
import { BilinearGeographicRaster } from './BilinearGeographicRaster';

test('initializes the underlying raster and bilinearly interpolates its neighboring pixels', async () => {
	const raster: GeographicRaster = {
		init: vi.fn(async () => undefined),
		wgs84ToPixels: vi.fn(([x, y]: LngLat): [number, number] => [x, y]),
		getPixelValue: vi.fn(([x, y]) => x + y * 10),
	};
	const interpolatedRaster = new BilinearGeographicRaster(raster);

	await interpolatedRaster.init();

	const topLeft = 35 + 34 * 10;
	const topRight = 36 + 34 * 10;
	const bottomLeft = 35 + 35 * 10;
	const bottomRight = 36 + 35 * 10;
	expect(interpolatedRaster.getPixelValue([35, 34])).toBeCloseTo(topLeft);
	expect(interpolatedRaster.getPixelValue([36, 34])).toBeCloseTo(topRight);
	expect(interpolatedRaster.getPixelValue([35, 35])).toBeCloseTo(bottomLeft);
	expect(interpolatedRaster.getPixelValue([36, 35])).toBeCloseTo(bottomRight);
	expect(interpolatedRaster.getPixelValue([35.5, 34.5])).toBeCloseTo((topLeft + topRight + bottomLeft + bottomRight) / 4);
	expect(interpolatedRaster.getPixelValue([35.4, 34.3])).toBeCloseTo(
			topLeft * 0.6 * 0.7 + 
			topRight * 0.4 * 0.7 +
			bottomLeft * 0.6 * 0.3 + 
			bottomRight * 0.4 * 0.3
	);
	expect(raster.init).toHaveBeenCalledOnce();
	expect(raster.getPixelValue).toHaveBeenNthCalledWith(1, [35, 34]);
	expect(raster.getPixelValue).toHaveBeenNthCalledWith(2, [36, 34]);
	expect(raster.getPixelValue).toHaveBeenNthCalledWith(3, [35, 35]);
	expect(raster.getPixelValue).toHaveBeenNthCalledWith(4, [36, 35]);
});
