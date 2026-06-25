import maplibregl from 'maplibre-gl';
import { ThreeDManager } from 'maplibre-gl-three';

const map = new maplibregl.Map({
    container: 'map',
    zoom: 16,
    center: [-75.596, 40.038],
    pitch: 55,
    bearing: -20,
    maxPitch: 85,
    style: {
        version: 8,
        sources: {
            osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap contributors',
            },
        },
        layers: [
            {
                id: 'osm',
                type: 'raster',
                source: 'osm',
            },
        ],
    },
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));

map.on('load', () => {
    const threeDManager = new ThreeDManager({
        dracoPath: "/dependencies/three@0.183.2/examples/jsm/libs/draco/",
        ktx2Path: "/dependencies/three@0.183.2/examples/jsm/libs/basis/"
    });
    const agiHqTiles = threeDManager.load3dTiles({
        tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
        layerId: 'agi-hq-3d-tiles',
    });

    map.addLayer(agiHqTiles.getLayer());
});
