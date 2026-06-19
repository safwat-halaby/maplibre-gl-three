import {loadThreeJS} from 'maplibre-gl-three';

const map = new maplibregl.Map({
    container: 'map',
    zoom: 12,
    center: [-121.7357995, 46.8676532],
    pitch: 40,
    hash: true,
    style: 'washington.style.json',
    maxZoom: 18,
    maxPitch: 85
});


map.addControl(
    new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: true
    })
);

map.on('load', async () => {
    loadThreeJS(map, "/datasets/local_only/cache/cesium-ion-washington/us-east-1/asset_depot/57590/Vricon/WashingtonState/v1/tileset.json", 0);
    // loadThreeJS(map, "https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json", -300);
});

