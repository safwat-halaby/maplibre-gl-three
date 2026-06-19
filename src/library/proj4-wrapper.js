// This allows proj4 to work with an import map.
// It is used by the direct browser method and unused in the NPM installation method.
const proj4 = globalThis.proj4;

if (!proj4) {
    throw new Error("proj4-wrapper.js requires proj4 to be loaded first");
}

export default proj4;
