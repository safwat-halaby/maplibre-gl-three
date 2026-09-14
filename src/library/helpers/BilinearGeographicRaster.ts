import type { GeographicRaster, LngLat } from '../interfaces';

/** Prevents rough jumps when transitioning from one pixel to the next via bilinear interpolation. */
export class BilinearGeographicRaster implements GeographicRaster {
	constructor(private readonly raster: GeographicRaster) {}

	public init(): Promise<void> {
		return this.raster.init();
	}

	public getPixelValue([x, y]: [number, number]): number {
		const x0 = Math.floor(x);
		const y0 = Math.floor(y);
		const x1 = x0 + 1;
		const y1 = y0 + 1;
		const xWeight = x - x0;
		const yWeight = y - y0;

		const topLeft = this.raster.getPixelValue([x0, y0]);
		const topRight = this.raster.getPixelValue([x1, y0]);
		const bottomLeft = this.raster.getPixelValue([x0, y1]);
		const bottomRight = this.raster.getPixelValue([x1, y1]);

		return (
			topLeft * (1 - xWeight) * (1 - yWeight) +
			topRight * xWeight * (1 - yWeight) +
			bottomLeft * (1 - xWeight) * yWeight +
			bottomRight * xWeight * yWeight
		);
	}

	public wgs84ToPixels(point: LngLat): [number, number] {
		return this.raster.wgs84ToPixels(point);
	}
}
