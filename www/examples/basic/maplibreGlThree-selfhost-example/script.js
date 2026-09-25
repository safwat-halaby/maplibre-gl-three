import * as maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ThreeDManager } from 'maplibre-gl-three';

const map = new maplibregl.Map({
    terrainSkirtLength: 'none',
    container: 'map',
    zoom: 16,
    center: [-75.596, 40.038],
    pitch: 55,
    bearing: -20,
    maxPitch: 60,
    style: './style.json'
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));

map.on('load', async () => {
    const threeDManager = new ThreeDManager({
        dracoPath: "/dependencies/three@0.183.2/examples/jsm/libs/draco/",
        ktx2Path: "/dependencies/three@0.183.2/examples/jsm/libs/basis/",
        verticalDatum: {
            path: "/datasets/vertical-datum/us_nga_egm96_15.tif",
        }
    });
    await threeDManager.init();
    const layer = threeDManager.createLayer();
    await layer.load3dTiles({
        tilesetUrl: '/datasets/agi-hq/tileset.json',
        offset: { east: 0, up: -234, south: 0 },
        maxDepth: 5
    });

    // an individual pink sphere.
    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(10, 32, 16),
        new THREE.MeshStandardMaterial({ color: 0xff00ff }),
    );
    marker.applyMatrix4(threeDManager.getEcefMatrix({ point: [-75.598, 40.040], height: 130 }));
    layer.getScene().add(marker);

    // A group of four spheres. Their offset is in meters relative to a single geographical placement.
    const placement = new THREE.Group();
    const lngLatAlt = { point: [-75.595, 40.040], height: 140 };
    placement.applyMatrix4(threeDManager.getEcefMatrix(lngLatAlt));
    const geometry = new THREE.SphereGeometry(10, 32, 16);
    const north = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    );
    const south = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
    );
    const east = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0x0000ff }),
    );
    const west = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0xffff00 }),
    );
    north.position.set(0, 0, -30);
    south.position.set(0, 0, 30);
    east.position.set(30, 0, 0);
    west.position.set(-30, 0, 0);

    // Public sample model, centered between the four spheres.
    const model = await new GLTFLoader().loadAsync(
        '/datasets/3dmodels/fox/Fox.glb'
    );

    placement.add(north);
    placement.add(south);
    placement.add(east);
    placement.add(west);
    placement.add(model.scene);
    layer.getScene().add(placement);
    map.addLayer(layer, 'rivers');
});
