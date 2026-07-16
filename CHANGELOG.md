## 0.0.5 - 2026-07-16

- Typescript support.
- Exposed an optional `preprocessUrl` callback for `load3dTiles`, allowing the user to modify the URLs before 3dtile resources are requested.
- Added some support for plate carree slippy tiles, with some caveats that will be better documented later. 
- Internally, we now call `clearDepth` before rendering to resolve some visual artifacts.

