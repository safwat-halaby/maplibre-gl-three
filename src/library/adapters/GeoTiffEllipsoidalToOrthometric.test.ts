import { expect, test } from 'vitest';
import { GeoTiffEllipsoidalToOrthometric } from './GeoTiffEllipsoidalToOrthometric';

test('returns the orthometric height for the supplied WGS-84 point', async () => {
	const ellipsoidalToOrthometric = new GeoTiffEllipsoidalToOrthometric();
	await ellipsoidalToOrthometric.init();

	expect(
		ellipsoidalToOrthometric.getOrthometricHeight([35.049, 31.703]),
	).toBeCloseTo(19.7542, 4);
});
