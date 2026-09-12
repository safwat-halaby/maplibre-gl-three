// This allows geotiff to work with an import map.
// It is used by the direct browser method and unused in the NPM installation method.
type GeoTiffModule = typeof import('geotiff');

const geotiffGlobal = (globalThis as { GeoTIFF?: GeoTiffModule }).GeoTIFF;

if (!geotiffGlobal) {
    throw new Error('geotiff-wrapper.js requires geotiff to be loaded first');
}

export const fromUrl = geotiffGlobal.fromUrl;
