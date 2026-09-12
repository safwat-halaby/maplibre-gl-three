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
        container: 'map',
        zoom: 16,
        center: PlateCarreeTools.alignWithEquirectangularProjection([-75.596, 40.038]),
        pitch: 55,
        bearing: -20,
        maxPitch: 85,
        style,
    });

    mapInstance.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));

    return mapInstance;
})();

map.on('load', async () => {
    const threeDManager = new ThreeDManager({
        dracoPath: "/dependencies/three@0.183.2/examples/jsm/libs/draco/",
        ktx2Path: "/dependencies/three@0.183.2/examples/jsm/libs/basis/",
        calculateAnchorPoint: PlateCarreeTools.calculatePlateCarreeAnchorPoint,
        getTransformParameters: PlateCarreeTools.getPlateCarreeTransformParameters,

    });
    const agiHqTiles = await threeDManager.load3dTiles({
        tilesetUrl: 'https://pelican-public.s3.amazonaws.com/3dtiles/agi-hq/tileset.json',
        layerId: 'agi-hq-3d-tiles',
        offset: { east: 0, up: -310, south: 0 },
    });

    map.addLayer(agiHqTiles.getLayer(), "rivers");
});

async function fetchJson(url) {
    const response = await fetch(url);
    const json = await response.json();
    return json;
}
