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
    style: '../../basic/maplibreGlThree-selfhost-example/style.json'
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));

map.on('load', async () => {
    const threeDManager = new ThreeDManager({
        dracoPath: "/dependencies/three@0.186.1/examples/jsm/libs/draco/",
        ktx2Path: "/dependencies/three@0.186.1/examples/jsm/libs/basis/",
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

    const model = await new GLTFLoader().loadAsync(
        '/datasets/3dmodels/fox/Fox.glb'
    );
    const placement = new THREE.Group();
    placement.applyMatrix4(threeDManager.getEcefMatrix({
        point: [-75.595, 40.040],
        height: 140
    }));
    placement.add(model.scene);
    layer.getScene().add(placement);

    const mixer = new THREE.AnimationMixer(model.scene);
    const clip = model.animations.find(({ name }) => name === 'Walk') ?? model.animations[0];
    let animationFrame;
    if (clip) {
        mixer.clipAction(clip).play();
        const clock = new THREE.Clock();
        const animate = () => {
            mixer.update(clock.getDelta());
            layer.requestRepaint();
            animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    map.addLayer(layer, 'rivers');
    map.on('remove', () => {
        cancelAnimationFrame(animationFrame);
        mixer.stopAllAction();
        threeDManager.destroy();
        model.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                object.material.dispose();
            }
        });
    });
});
