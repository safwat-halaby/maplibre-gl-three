import { expect, test } from 'vitest';
import { GeoTiffGeographicRaster } from './GeoTiffGeographicRaster';

test('reads the raster pixel for a supplied WGS-84 point', async () => {
	const raster = new GeoTiffGeographicRaster();
	await raster.init();
	const [x, y] = raster.wgs84ToPixels([35.049, 31.703]);

	expect(
		raster.getPixelValue([Math.floor(x), Math.floor(y)]),
	).toBeCloseTo(19.7542, 4);
});
