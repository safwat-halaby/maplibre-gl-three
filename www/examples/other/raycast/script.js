import * as maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ThreeDManager } from 'maplibre-gl-three';

const map = new maplibregl.Map({
	container: 'map',
	zoom: 16,
	center: [-75.596, 40.038],
	pitch: 55,
	bearing: -20,
	maxPitch: 60,
	style: './style.json',
	terrainSkirtLength: 'none'
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
	const layer = threeDManager.createLayer({ id: 'agi-hq-3d' });
	const tilesAsset = await layer.load3dTiles({
		tilesetUrl: '/datasets/agi-hq/tileset.json',
		offset: { east: 0, up: -234, south: 0 },
		maxDepth: 5
	});
	map.addLayer(layer, 'rivers');

	// #### Setup raycasting
	const scene = layer.getScene();
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	const camera = layer.getCamera();
	const renderer = layer.getRenderer();
	const statusElement = document.getElementById('status');
	const rayArrow = new THREE.ArrowHelper(
		new THREE.Vector3(0, 0, -1),
		camera.position,
		1,
		0xffcc33,
		0,
		0
	);
	rayArrow.visible = false;
	scene.add(rayArrow);
	const rayImpact = new THREE.Mesh(
		new THREE.SphereGeometry(6, 16, 8),
		new THREE.MeshBasicMaterial({ color: 0xff5533, transparent: true, opacity: 0.4})
	);
	rayImpact.visible = false;
	scene.add(rayImpact);
	
	// #### raycast!
	// keep raycasting on each tile load, until we hit something.
	tilesAsset.getTilesRenderer().addEventListener('load-model', topDownRayCast);
	function topDownRayCast() {
		// The raycast destination is the reference point of the 3D Tiles, which is the center of the tiles' enclosing circle.
		const destination = tilesAsset.getReference();
		if (!destination) {
			throw new Error("could not obtain the 3D Tiles reference")
		}
		// The ray starts 10 meters above the reference point, heading straight down.
		const origin = { 
			point: destination.point,
			height: destination.height + 10
		};
		// Convert to the ECEF coordinate system.
		const ecef_origin = threeDManager.lngLatAltToEcef(origin);
		const ecef_destination = threeDManager.lngLatAltToEcef(destination);
		const ecef_impactPoint = raycast_originDestination(ecef_origin, ecef_destination);
		if (ecef_impactPoint) {
			// we hit something. Render it...
			renderHit(ecef_origin, ecef_impactPoint);
			// Stop trying to raycast top-down
			tilesAsset.getTilesRenderer().removeEventListener('load-model', topDownRayCast);
			// Enable raycasting via mouse click
			renderer.domElement.addEventListener('click', function (event) {
				const result = raycast_pointer(event);
				if (result) {
					const {ecef_cameraOrigin, ecef_impactPoint} = result;
					renderHit(ecef_cameraOrigin, ecef_impactPoint);
				}
			});
		}
	}

	function renderHit(ecef_origin, ecef_impactPoint) {
		const ecef_direction = ecef_impactPoint.clone().sub(ecef_origin);
		const ecef_rayLength = ecef_direction.length();
		ecef_direction.normalize();
	
        drawArrow(ecef_origin, ecef_direction, ecef_rayLength);
        drawImpact(ecef_impactPoint);

		// Display the more familiar lngLatAlt WGS84 format in the GUI along with ECEF.
		const lngLatAlt_impactPoint = threeDManager.ecefToLngLatAlt(ecef_impactPoint);
        updateHtmlImpactText(lngLatAlt_impactPoint, ecef_impactPoint);
	}

	// RAYCASTING FUNCTIONS
	function raycast_originDestination(ecef_origin, ecef_destination) {
		const direction = ecef_destination.clone().sub(ecef_origin);
		return raycast_originDirection(ecef_origin, direction);
	}
	function raycast_originDirection(ecef_origin, ecef_direction) {
		ecef_direction = ecef_direction.clone();
		if (ecef_direction.lengthSq() === 0) {
			statusElement.textContent = 'Cannot cast a ray with a zero direction.';
			return;
		}
		ecef_direction.normalize();
		raycaster.set(ecef_origin, ecef_direction);
		// The raycaster works internally in LocalSpace; this converts ECEF to LocalSpace.
		raycaster.ray.applyMatrix4(threeDManager.getAnchorEcefToLocalMatrix());
        const intersections = raycaster.intersectObject(tilesAsset.getObject3D(), true);
        const hit = intersections.length === 0 ? null : intersections[0];

		if (!hit) return null;
		// Convert LocalSpace back to ECEF.
		hit.point.applyMatrix4(threeDManager.getAnchorLocalToEcefMatrix());
		return hit.point;
	}
	function raycast_pointer(event) {
        const bounds = renderer.domElement.getBoundingClientRect();

        // From pixels (MapLibre) to normalized device coordinates as expected by Three.js.
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

		// The camera ray is in LocalSpace, so we change it to ECEF space.
		// This is a bit of a redundant calculation and we could have implemented a separate LocalSpace raycaster. But this is less code.
		raycaster.ray.applyMatrix4(threeDManager.getAnchorLocalToEcefMatrix());

		const ecef_cameraOrigin = raycaster.ray.origin.clone();
        const ecef_impactPoint = raycast_originDirection(raycaster.ray.origin, raycaster.ray.direction);
		if (!ecef_impactPoint) {
			return null;
		}
		return {
			ecef_cameraOrigin,
			ecef_impactPoint
		}
      }
	
	// DRAW FUNCTIONS
	function drawArrow(origin, direction, length) {
		rayArrow.position.copy(origin);
		rayArrow.setDirection(direction);
		rayArrow.setLength(
			length,
			4,
			1
		);
		rayArrow.visible = true;
	}
	function drawImpact(impactPoint) {
		rayImpact.position.copy(impactPoint);
		rayImpact.visible = true;
	}
	function updateHtmlImpactText(lngLatAlt_impactPoint, ecef_impactPoint) {
		const str = 
		`Raycasting impact Point (WGS84)\n\n` +
		`lngLatAlt EPSG:4326/EPSG:9707: (lon: ${lngLatAlt_impactPoint.point[0].toFixed(6)}°, lat: ${lngLatAlt_impactPoint.point[1].toFixed(6)}°, alt: ${lngLatAlt_impactPoint.height.toFixed(1)}m orthometric)\n` + 
		`ECEF EPSG:4978:                (${ecef_impactPoint.x.toFixed(1)}m, ${ecef_impactPoint.y.toFixed(1)}m, ${ecef_impactPoint.z.toFixed(1)}m)`;
		console.log(str);
		statusElement.textContent = str;
	}
	
});
