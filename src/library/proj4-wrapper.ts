// This allows proj4 to work with an import map.
// It is used by the direct browser method and unused in the NPM installation method.
import type proj4 from 'proj4';

const proj4Global = (globalThis as { proj4?: typeof proj4 }).proj4;

if (!proj4Global) {
    throw new Error("proj4-wrapper.js requires proj4 to be loaded first");
}

export default proj4Global;
