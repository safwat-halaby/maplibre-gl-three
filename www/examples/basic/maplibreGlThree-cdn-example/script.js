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
    terrainSkirtLength: 'none'
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));

map.on('load', async () => {
    const threeDManager = new ThreeDManager();
    await threeDManager.init();
    const layer = threeDManager.createLayer({ id: 'agi-hq-3d' });
    await layer.load3dTiles({
        tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
        offset: { east: 0, up: -234, south: 0 },
    });

    map.addLayer(layer, 'rivers');
    map.on('remove', () => threeDManager.destroy());
});
