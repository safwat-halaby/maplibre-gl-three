import { fromArrayBuffer, type GeoTIFFImage, type TypedArray } from "geotiff";
import type { Fetcher, GeographicRaster } from '../core/internal-interfaces';
import type { LngLat, VerticalDatumOptions } from '../interfaces';

const DEFAULT_VERTICAL_DATUM_PATH = 'https://cdn.proj.org/us_nga_egm96_15.tif';

export class GeoTiffGeographicRaster implements GeographicRaster {
	private enabled: boolean;
	private path: string;
	private image: GeoTIFFImage | undefined;
	private wgs84ToPixelMatrix: number[] = [];
	private raster: TypedArray | null = null;
	private width: number = 0;
	private height: number = 0;
	constructor(
		private fetcher: Fetcher,
		{ path = DEFAULT_VERTICAL_DATUM_PATH, enabled = true }: VerticalDatumOptions = {},
	) {
		this.path = path;
		this.enabled = enabled;
	}
	async init() {
		if (!this.enabled) return;
		// TODO Range-based alternative that would need an async getPixelValue and some more refactors
		// const tiff = await fromUrl(this.path);
		const response = await this.fetcher.fetch(this.path);
		if (!response.ok) {
			throw new Error(`Failed to fetch GeoTIFF: ${response.status} ${response.statusText}`);
		}
		const tiff = await fromArrayBuffer(await response.arrayBuffer());
		const image = await tiff.getImage();
		// Construct the WGS84 forward affine matrix.
		// The matrix construction is adopted from the geotiff usage example without much modification or understanding:
		// https://geotiffjs.github.io/geotiff.js/#example-usage
		const s = image.fileDirectory.getValue('ModelPixelScale');
		const t = image.fileDirectory.getValue('ModelTiepoint');
		if (!s) throw new Error('Expected ModelPixelScale');
		if (!t) throw new Error('Expected ModelTiepoint');
		const sx = s[0];
		const sy = -s[1];
		const gx = t[3];
		const gy = t[4];
		this.wgs84ToPixelMatrix = [-gx / sx, 1 / sx, 0, -gy / sy, 0, 1 / sy];
		const rasters = await image.readRasters(); 
		const { width, height, [0]: raster } = rasters;
		this.image = image;
		this.raster = raster;
		this.width = width;
		this.height = height;
		// todo - consider reading tiles instead of whole image
		// const width = image.getWidth();
		// const height = image.getHeight();
		// const tileWidth = image.getTileWidth();
		// const tileHeight = image.getTileHeight();
		// console.log({width, height, tileWidth, tileHeight});

	}
	public getPixelValue([x, y]: [number, number]): number {
		if (!this.enabled) return 0;
		if (!this.image || !this.raster) throw new Error('init() must succeed before calling getPixelValue');
		const pixelX = ((Math.floor(x) % this.width) + this.width) % this.width;
		const pixelY = Math.max(0, Math.min(this.height - 1, Math.floor(y)));
		return this.raster[pixelX + pixelY * this.width];
	}
	public wgs84ToPixels([lon, lat]: LngLat): [number, number] {
		if (!this.enabled) return [0, 0];
		const matrix = this.wgs84ToPixelMatrix
		return [
			matrix[0] + matrix[1] * lon + matrix[2] * lat,
			matrix[3] + matrix[4] * lon + matrix[5] * lat,
		];
	}
}
