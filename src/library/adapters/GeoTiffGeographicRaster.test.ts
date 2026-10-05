import { beforeAll, expect, test } from 'vitest';
import { GeoTiffGeographicRaster } from './GeoTiffGeographicRaster';
import { LocalFetcher } from './LocalFetcher';

// URL is converted to a local fs call internally
const mockUrl = 'http://localhost:6153/datasets/vertical-datum/us_nga_egm96_15.tif';
const localFetcher = new LocalFetcher();

let raster: GeoTiffGeographicRaster;

beforeAll(async () => {
	raster = new GeoTiffGeographicRaster(localFetcher, { path: mockUrl });
	await raster.init();
});

test('reads the raster pixel for a supplied WGS84 point', async () => {
	const [x, y] = raster.wgs84ToPixels([35.049, 31.703]);

	expect(
		raster.getPixelValue([Math.floor(x), Math.floor(y)]),
	).toBeCloseTo(19.7542, 4);
});

test('wraps longitude at the east/west edges', async () => {
	const [eastX, eastY] = raster.wgs84ToPixels([180, 0]).map(Math.floor);
	const [westX] = raster.wgs84ToPixels([-180, 0]).map(Math.floor);
	const westEdge = raster.getPixelValue([westX, eastY]);
	const eastEdge = raster.getPixelValue([eastX - 1, eastY]);

	expect(raster.getPixelValue([eastX, eastY])).toEqual(westEdge);     // east wraps to west
	expect(raster.getPixelValue([westX - 1, eastY])).toEqual(eastEdge); // west wraps to east
});

test('clamps latitude at the raster edges', async () => {
	// north pole
	const [northX, northY] = raster.wgs84ToPixels([0, 90]).map(Math.floor);
	const northEdge = raster.getPixelValue([northX, northY]);
	expect(raster.getPixelValue([northX, northY - 1])).toEqual(northEdge);

	// south pole
	const [southX, southY] = raster.wgs84ToPixels([0, -90]).map(Math.floor);
	const southEdge = raster.getPixelValue([southX, southY]);
	expect(raster.getPixelValue([southX, southY + 1])).toEqual(southEdge);
});
