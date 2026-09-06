import * as maplibregl from 'maplibre-gl';
import { ThreeDManager } from 'maplibre-gl-three';

const map = new maplibregl.Map({
    container: 'map',
    zoom: 16,
    center: [-75.596, 40.038],
    pitch: 55,
    bearing: -20,
    maxPitch: 85,
    style: './style.json',
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));

map.on('load', () => {
    const threeDManager = new ThreeDManager({
        dracoPath: "/dependencies/three@0.183.2/examples/jsm/libs/draco/",
        ktx2Path: "/dependencies/three@0.183.2/examples/jsm/libs/basis/"
    });
    const agiHqTiles = threeDManager.load3dTiles({
        tilesetUrl: '/datasets/agi-hq/tileset.json',
        layerId: 'agi-hq-3d-tiles',
        offset: { east: 0, up: -310, south: 0 },
    });

    map.addLayer(agiHqTiles.getLayer(), "rivers");
});
