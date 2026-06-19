// This allows maplibreGL to work with an import map.
// It is used by the direct browser method and unused in the NPM installation method.
const maplibregl = globalThis.maplibregl;

if (!maplibregl) {
    throw new Error("maplibre-gl-wrapper.js requires maplibre-gl to be loaded first");
}

export default maplibregl;
