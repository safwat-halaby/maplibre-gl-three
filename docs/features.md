## Features

- Load a geographically synced Three.js scene as a layer in MapLibre.
- 3D Tiles in MapLibre.
- Full depth control, allowing for "interlaced" mode or layering based on layer order.
- Full vertical datum support. True height above sea level (orthometric) can be calculated. The ground/terrain of a 3D Tiles model can closely match the ground layer of MapLibre, assuming you've loaded suitable terrain into MapLibre.
- Supports anything MapLibre or Three.js natively support, including but not limited to:
  - Three.js raycasting
  - Three.js models, lighting, etc.
  - MapLibre Style Spec
  - MapLibre GL JS
- Convenience helpers for coordinate conversion, placement, and lifecycle management.

## Limitations

- The 3D Tiles become misaligned if the camera pans away and zooms out far enough from the scene. This is related to the anchoring algorithm and will be improved later.
- Except for camera and height synchronization, Three.js and MapLibre do not interact. MapLibre is not aware of the positioning of Three.js primitives (like 3D Tiles or models), and Three.js is not aware of the position of MapLibre features. Syncing those requires app-level code and depends on use case.
- Lacking good demos. The current demos do not show the full power of the library!

