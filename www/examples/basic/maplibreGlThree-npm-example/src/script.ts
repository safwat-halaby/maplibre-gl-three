import { Map, NavigationControl, setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import { ThreeDManager } from 'maplibre-gl-three';

import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import style from './style.json';

setWorkerUrl('dist/maplibre-gl-worker.mjs');

const mapStyle = style as StyleSpecification;

const map = new Map({
    container: 'map',
    zoom: 16,
    center: [-75.596, 40.038],
    pitch: 55,
    bearing: -20,
    maxPitch: 85,
    style: mapStyle,
});

map.addControl(new NavigationControl({ visualizePitch: true }));

map.on('load', () => {
    const threeDManager = new ThreeDManager();
    const agiHqTiles = threeDManager.load3dTiles({
        tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
        layerId: 'agi-hq-3d-tiles',
        offset: { east: 0, up: -310, south: 0 },
    });

    map.addLayer(agiHqTiles.getLayer(), "rivers");
});
