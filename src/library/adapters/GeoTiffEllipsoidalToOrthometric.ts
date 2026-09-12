import { fromUrl, type GeoTIFFImage, type TypedArray } from "geotiff";
import type { EllipsoidalToOrthometric, VerticalDatumOptions } from '../interfaces';

const DEFAULT_VERTICAL_DATUM_PATH = 'https://cdn.proj.org/us_nga_egm96_15.tif';

export class GeoTiffEllipsoidalToOrthometric implements EllipsoidalToOrthometric {
	private readonly enabled: boolean;
	private readonly path: string;
	private image: GeoTIFFImage | undefined;
	private wgs84ToPixelMatrix: number[] = [];
	private raster: TypedArray | null = null;
	private width: number = 0;
	constructor({ path = DEFAULT_VERTICAL_DATUM_PATH, enabled = true }: VerticalDatumOptions = {}) {
		this.path = path;
		this.enabled = enabled;
	}
	async init() {
		if (!this.enabled) return;
		const tiff = await fromUrl(this.path);
		const image = await tiff.getImage();
		// Construct the WGS-84 forward affine matrix.
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
		const { width, [0]: raster } = rasters;
		this.image = image;
		this.raster = raster;
		this.width = width;
		// todo - consider reading tiles instead of whole image
		// const width = image.getWidth();
		// const height = image.getHeight();
		// const tileWidth = image.getTileWidth();
		// const tileHeight = image.getTileHeight();
		// console.log({width, height, tileWidth, tileHeight});

	}
	public getOrthometricHeight(point: [number, number]): number {
		if (!this.enabled) return 0;
		if (!this.image || !this.raster) throw new Error('init() must succeed before calling getOrthometricHeight');
		const [x, y] = this.wgs84ToPixels(point);
		const elevation = this.raster[x + y * this.width];
		console.log(`getOrthometricHeight elevation: ${elevation}`)
		return elevation;
	}
	public wgs84ToPixels([lon, lat]: [number, number]): [number, number] {
		const matrix = this.wgs84ToPixelMatrix
		return [
			(matrix[0] + matrix[1] * lon + matrix[2] * lat) | 0,
			(matrix[3] + matrix[4] * lon + matrix[5] * lat) | 0,
		];
	}
}
