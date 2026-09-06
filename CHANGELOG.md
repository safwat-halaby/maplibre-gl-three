## 0.0.9 - 2026-09-06

- Migration to maplibre-gl 6

## 0.0.8 - 2026-07-29

- Rendering depth updates. The default behavior is now exactly Maplibre-style-like where the layer order in the style dictates the depth. Exposed depth controls; The user can now optionally render "interlaced" layers if the want to:
  - on `getLayer`, one can optionally specify whether to clear the depth before/after the current layer (both default to true).
  - exposed a "separator" custom layer that renders nothing and clears the depth. 

## 0.0.7 - 2026-07-22

- renamed `preprocessUrl` to `preprocessURL` and fixed a bug which caused this parameter to be ignored.

## 0.0.6 - 2026-07-19

- Exposed `maxDepth` in `load3dTiles`.
- Fixed typos in "Plate Carree".
- Various DX tweaks
  - Restrict OSM maxzoom in examples
  - Rename mislabeled natural-earth layer
  - CDN consistency - all URLs now use https://jsdelivr.net
  - Inlined a 3dtiles + natural earth dataset up to zoom 3 for complete offline development.

## 0.0.5 - 2026-07-16

- Typescript support.
- Exposed an optional `preprocessUrl` callback for `load3dTiles`, allowing the user to modify the URLs before 3dtile resources are requested.
- Added some support for plate carree slippy tiles, with some caveats that will be better documented later. 
- Internally, we now call `clearDepth` before rendering to resolve some visual artifacts.

