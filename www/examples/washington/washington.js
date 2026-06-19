import {ThreeDManager} from 'maplibre-gl-three';

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
    const threeDManager = new ThreeDManager({
        dracoPath: "/dependencies/three@0.183.0/examples/jsm/libs/draco/",
        ktx2Path: "/dependencies/three@0.183.0/examples/jsm/libs/basis/"
    });
    const washingtonTiles = threeDManager.load3dTiles({
        tilesetUrl: "/datasets/local_only/cache/cesium-ion-washington/us-east-1/asset_depot/57590/Vricon/WashingtonState/v1/tileset.json",
        layerId: "washington-3d-tiles"
    });
    map.addLayer(washingtonTiles.getLayer(), "washington-lines");
});
