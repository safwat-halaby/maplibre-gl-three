# Features & Limitations

## Features

- Load a geographically synced Three.js scene as a layer in MapLibre.
- 3D Tiles in MapLibre.
- Full depth control, allowing for "interlaced" mode or layering based on layer order.
- Full vertical datum support. True height above sea level (orthometric) can be calculated. The ground/terrain of a 3D Tiles model can closely match the ground layer of MapLibre, assuming you've loaded suitable terrain into MapLibre.
- Convenience helpers for coordinate conversion, placement, and lifecycle management
- Supports anything MapLibre/Three.js/3d-tiles-renderer natively support, including but not limited to:
    - Three.js raycasting
    - Three.js models, lighting, etc.
    - MapLibre Style Spec
    - MapLibre 3D Terrain
    - MapLibre globe

## Known issues / bugs

- On extreme zoom-outs from a 3D Tiles model or Three.js scene, once the map center leaves the scene boundaries, the scene will become progressively more misaligned with MapLibre the more you pan away from it.
- Globe projections are supported partially. The `ThreeLayer` is hidden on low zoom levels but is shown correctly on high zoom.

## Inherent limitations

Except for camera and height synchronization, Three.js and MapLibre do not interact. MapLibre is not aware of the positioning of Three.js primitives (like 3D Tiles or models), and Three.js is not aware of the position of MapLibre features. Syncing those requires app-level code and depends on use case.
