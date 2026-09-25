import * as maplibregl from 'maplibre-gl';
import { ThreeDManager, PlateCarreeTools } from 'maplibre-gl-three';


function alignGeoJSONWithPlateCarree(geojson) {
    geojson.features.forEach((feature) => {
        // assumes a LineString
        feature.geometry.coordinates.forEach(coordinate => {
            const aligned = PlateCarreeTools.alignWithEquirectangularProjection(coordinate);
            coordinate[0] = aligned[0];
            coordinate[1] = aligned[1];
        })
    })
}

const map = await (async () => {
    const style = await fetchJson('./style.json');
    alignGeoJSONWithPlateCarree(style.sources['osm-vectors'].data);
    const mapInstance = new maplibregl.Map({
        terrainSkirtLength: 'none',
        container: 'map',
        zoom: 12,
        center: PlateCarreeTools.alignWithEquirectangularProjection([-75.596, 40.038]),
        pitch: 55,
        bearing: -20,
        maxPitch: 85,
        style
    });

    mapInstance.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));

    return mapInstance;
})();

map.on('load', async () => {
    const threeDManager = new ThreeDManager({
        dracoPath: "/dependencies/three@0.186.1/examples/jsm/libs/draco/",
        ktx2Path: "/dependencies/three@0.186.1/examples/jsm/libs/basis/",
        verticalDatum: {
            path: "/datasets/vertical-datum/us_nga_egm96_15.tif",
        },
        calculateAnchorPoint: PlateCarreeTools.calculatePlateCarreeAnchorPoint,
        getTransformParameters: PlateCarreeTools.getPlateCarreeTransformParameters,
    });
    await threeDManager.init();
    const layer = threeDManager.createLayer({ id: 'agi-hq-3d' });
    await layer.load3dTiles({
        tilesetUrl: '/datasets/agi-hq/tileset.json',
        offset: { east: 0, up: -234, south: 0 },
        maxDepth: 5
    });

    map.addLayer(layer, 'rivers');
    map.on('remove', () => threeDManager.destroy());
});

async function fetchJson(url) {
    const response = await fetch(url);
    const json = await response.json();
    return json;
}
