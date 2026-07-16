// This allows maplibreGL to work with an import map.
// It is used by the direct browser method and unused in the NPM installation method.
import type maplibregl from 'maplibre-gl';

const maplibreglGlobal = (globalThis as { maplibregl?: typeof maplibregl }).maplibregl;

if (!maplibreglGlobal) {
    throw new Error("maplibre-gl-wrapper.js requires maplibre-gl to be loaded first");
}

export default maplibreglGlobal;
