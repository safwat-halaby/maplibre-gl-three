import * as THREE from 'three';
import { TilesRenderer } from "3d-tiles-renderer";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import maplibregl from 'maplibre-gl';
import proj4 from 'proj4';


/** 
 * Important terminology and notes:
 * - Origin: the (0,0,0) point in the 3JS world.
 * - anchor4326: a geographical point close to the camera center, longitude and latitude in the maplibre world. 
 * - EcefAnchor: The point in the 3dTiles world which corresponds to the anchor.
 * 
 * 3dTiles uses the ECEF coordinate system. Rather than reprojecting all points in 3dtiles, we only reproject the anchor. 
 * This is very efficient, but it means the two worlds start losing sync as we travel away from the anchor.
 * So a new anchor is occasionally calculated. 
 * 
 * ECEF (EPSG:4978) coordinate system:
 * - [0,0,0] is the center point in earth's core.
 * - [1,0,0] points to null island (longitude 0, latitude 0).
 * - [0,0,1] points to the north pole.
 * - [0,1,0] points to (longitude 90, latitude 0).
 * - ECEF units are in meters. [0,0,3] is 3 meters towards the north pole and away from the center point in earth's core. 
 * 
 * 3JS coordinate system:
 * - [1,0,0] points "right" - we want this aligned with east
 * - [0,1,0] points up
 * - [0,0,1] points Z+ - we want this aligned with south.
 * - The units are whatever we want them to be. In this project we choose meters.
 * 
 * WGS84 (EPSG:4326) coordinate system:
 * - This is the universally used "GPS coordinate" format. [longitude, latitude] in degrees.
 * - Longitude is between -180 and +180
 * - Latitude is between -90 and +90
 * - Longitude 0 is the prime meridian crossing the royal observatory in london
 * - Latitude 0 is the equator
 * - [0,0] is known as "null island", and is a place on the equator in the pacific ocean.
 * - Maplibre uses this coordinate system in its API, but it is internally projection to web mercator (EPSG:3857)
 * 
 * Web mercator (EPSG:3857) coordinate system:
 * - WGS84 is not flat and a flat world is more convenient. WGS84 is therefore often projected to some flat plane. Web Mercator is such a flat plane.
 * - In maplibre, the web mercator plane a square whose units is "meters" (but not really. I call them pseudo-meters).
 * - It spans -20 037 508.3427892 to +20037508.3427892. Making it ~40,075,016 in width and height. This is earth's circumference. Some implementations treat it as a -1 to 1 span.
 * - On the equator, pseudometers equal meters. The higher north or south we go, the shorter the pseudometers get. Maplibre's meterInMercatorCoordinateUnits() converts between the two.
 * - The longitude is simply linearly mapped. Longitude 0 is 0, longitude 180 is +20037508.3427892. Null island sits in the middle of the square.
 * - The latitude mapping is complex. The farther from the equator we get, the more stretched the map gets. At latitude 90 the stretch spans infinity.
 *   To avoid this and to achieve a perfect square, web mercator is capped at about -85.05 to +85.05 latitude.
 * - Not to be confused with the VERY similar but more geodetically faithful EPSG:3395 mercator, used for maritime navigation among other things.
 */
proj4.defs("EPSG:4978", "+proj=geocent +datum=WGS84 +units=m +no_defs");
const DEFAULT_DRACO_PATH = "https://unpkg.com/three@0.183.2/examples/jsm/libs/draco/";
const DEFAULT_KTX2_PATH = "https://unpkg.com/three@0.183.2/examples/jsm/libs/basis/";


function markOriginPointForDebugging(sceneInst, size = 400) {

    const axes = new THREE.AxesHelper(size);
    axes.name = "debug-local-axes";
    axes.renderOrder = 999;
    axes.traverse((child) => {
        if (child.material) {
            child.material.depthTest = false;
            child.material.depthWrite = false;
        }
    });
    sceneInst.add(axes);
}



function calculateAnchorMatrices(anchor4326, offset) {
    // Translate the EcefAnchor to sit on 0,0,0
    // In some sense we have moved the entire 3dtiles model from the earth's shell into earth's core and the anchor is now on 0,0,0 in the ecef world.
    const matrix_translateEcefAnchorToOrigin = translateEcefAnchorToOrigin(anchor4326);
    // Rotate the whole 3dtiles model so that its UP is the same as the threeJS up.
    // We have now aligned 3js with ECEF. 0,0,0 is the anchor point. (0,1,0) is up, (1,0,0) is east, (0,0,1) is south.
    // In some sense we have made the up side of the 3d tiles model point to the north pole (it is sitting at earth's core)
    const matrix_rotateEcefTo3JS = rotateEcefUpTo3jsUp(anchor4326);
    // TODO this moved it sideways:
    const matrix_ecefAnchorToOrigin_beforeOffset = new THREE.Matrix4().multiplyMatrices(matrix_rotateEcefTo3JS, matrix_translateEcefAnchorToOrigin);
    let matrix_ecefAnchorToOrigin;
    if (!offset) {
        matrix_ecefAnchorToOrigin = matrix_ecefAnchorToOrigin_beforeOffset;
    }
    else {
        matrix_ecefAnchorToOrigin = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().makeTranslation(offset.east, offset.up, offset.south), matrix_ecefAnchorToOrigin_beforeOffset);
    }
    // Make the threeJS origin (0,0,0) (which is now also the ecefAnchor) sit on the geographical anchor4326 point in the web mercator world.
    const matrixOriginToAnchor = originToAnchor(anchor4326);
    return {matrix_ecefAnchorToOrigin, matrixOriginToAnchor};
}

/** See calculateAnchorMatrices for a description. */
function translateEcefAnchorToOrigin(anchor4326) {
    const ecefOrigin = proj4("EPSG:4326", "EPSG:4978", anchor4326)
    return new THREE.Matrix4().makeTranslation(-ecefOrigin[0], -ecefOrigin[1], -ecefOrigin[2]);
}


/** Given a longitude and latitude, returns the vectors pointing east, up, south in the ECEF (EPSG:4978) space.
 *  For example at longitude=0, latitude=0, the UP vector is (1,0,0), the SOUTH vector is (0,0,-1), the East vector is (0,1,0)
 *  At the north pole (longitude=0, latitude=90), the UP vector is (0,0,1). SOUTH vector is (1,0,0), EAST vector is (0,1,0)
 */
function getEcefCompassVectors([lng, lat]) {
    const lonRad = THREE.MathUtils.degToRad(lng);
    const latRad = THREE.MathUtils.degToRad(lat);

    const east = new THREE.Vector3(-Math.sin(lonRad), Math.cos(lonRad), 0);
    const up = new THREE.Vector3(
        Math.cos(latRad) * Math.cos(lonRad),
        Math.cos(latRad) * Math.sin(lonRad),
        Math.sin(latRad)
    );
    const south = new THREE.Vector3(
        Math.sin(latRad) * Math.cos(lonRad),
        Math.sin(latRad) * Math.sin(lonRad),
        -Math.cos(latRad)
    );

    return {east, up, south};
}

/** See calculateAnchorMatrices for a description. */
function rotateEcefUpTo3jsUp(anchor4326) {
    const {east, up, south} = getEcefCompassVectors(anchor4326);

    return new THREE.Matrix4().set(
        east.x, east.y, east.z, 0,
        up.x, up.y, up.z, 0,
        south.x, south.y, south.z, 0,
        0, 0, 0, 1
    );
}

/** See calculateAnchorMatrices for a description. */
function originToAnchor(anchor4326) {
    const modelTransform = getWebMercatorTransformParameters(anchor4326);
    const axisX = new THREE.Vector3(1, 0, 0);
    const axisY = new THREE.Vector3(0, 1, 0);
    const axisZ = new THREE.Vector3(0, 0, 1);
    const rotationX = new THREE.Matrix4().makeRotationAxis(axisX, modelTransform.rotateX);
    const rotationY = new THREE.Matrix4().makeRotationAxis(axisY, modelTransform.rotateY);
    const rotationZ = new THREE.Matrix4().makeRotationAxis(axisZ, modelTransform.rotateZ);
    const scaleVec = new THREE.Vector3(modelTransform.scaleEast, -modelTransform.scaleSouth, modelTransform.scaleUp);
    return new THREE.Matrix4()
        .makeTranslation(modelTransform.translateX, modelTransform.translateY, modelTransform.translateZ)
        .scale(scaleVec)
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);
}


function getWebMercatorTransformParameters(anchor4326) {
    const webMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat([anchor4326[0], anchor4326[1]], anchor4326[2]);
    const scale = webMercatorCoordinate.meterInMercatorCoordinateUnits();
    return {
        translateX: webMercatorCoordinate.x,
        translateY: webMercatorCoordinate.y,
        translateZ: webMercatorCoordinate.z,
        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,
        scaleEast: scale,
        scaleSouth: scale,
        scaleUp: scale
    };
}

function getPlateCarreeMeterScales([lng, lat]) {
    const a = 6378137.0;
    const e2 = 6.69437999014e-3;
    const latRad = THREE.MathUtils.degToRad(lat);
    const sinLat = Math.sin(latRad);
    const cosLat = Math.cos(latRad);
    const w = Math.sqrt(1 - e2 * sinLat * sinLat);
    const n = a / w;
    const m = (a * (1 - e2)) / (w * w * w);
    const metersPerDegreeLng = THREE.MathUtils.degToRad(1) * n * cosLat;
    const metersPerDegreeLat = THREE.MathUtils.degToRad(1) * m;

    // maplibre MercatorCoordinate lives in a 0 to 1 space.
    // Todo elaborate this consideration more.
    const scaleEast = 1 / metersPerDegreeLng / 360;
    const scaleSouth = 1 / metersPerDegreeLat / 360;

    return {
        scaleEast,
        scaleSouth,
        scaleUp: scaleEast, // just a convention
    };
}
class ThreeDManager {
    constructor({ debugMode = false, dracoPath = DEFAULT_DRACO_PATH, ktx2Path = DEFAULT_KTX2_PATH } = {}) {
        this.debugMode = debugMode;
        this.dracoPath = dracoPath;
        this.ktx2Path = ktx2Path;

        this.activeTiles = null;
    }

    load3dTiles({ tilesetUrl, layerId = "3d-tiles", offset } = {}) {
        if (this.activeTiles && !this.activeTiles.destroyed) {
            throw new Error("concurrent loading of more than 1 3dtiles is currently unsupported");
        }

        this.activeTiles = new ThreeDTilesAsset({
            tilesetUrl,
            layerId,
            offset,
            debugMode: this.debugMode,
            dracoPath: this.dracoPath,
            ktx2Path: this.ktx2Path,
            onDestroy: (tiles) => {
                if (this.activeTiles === tiles) {
                    this.activeTiles = null;
                }
            },
        });

        return this.activeTiles;
    }

    destroy() {
        this.activeTiles?.destroy();
        this.activeTiles = null;
    }
}

class ThreeDTilesAsset {
    constructor({ tilesetUrl, layerId, offset, debugMode, dracoPath, ktx2Path, onDestroy }) {
        this.tilesetUrl = tilesetUrl;
        this.layerId = layerId;
        this.offset = offset;
        this.debugMode = debugMode;
        this.dracoPath = dracoPath;
        this.ktx2Path = ktx2Path;
        this.onDestroy = onDestroy;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mapInstance = null;
        this.tiles = null;
        this.tilesCamera = null;
        this.matrixOriginToAnchor = originToAnchor([0, 0, 0]);
        this.throttleTimeout = null;
        this.moveHandler = null;
        this.loadTilesetHandler = null;
        this.customLayer = null;
        this.destroyed = false;
    }

    getLayer() {
        if (!this.customLayer) {
            this.customLayer = {
                id: this.layerId,
                type: "custom",
                renderingMode: "3d",
                onAdd: (mapArg, gl) => this.onAdd(mapArg, gl),
                render: (gl, args) => this.render(gl, args),
                onRemove: () => this.onRemove(),
            };
        }

        return this.customLayer;
    }

    onAdd(mapArg, gl) {
        if (this.destroyed) return;

        this.camera = new THREE.PerspectiveCamera();
        this.scene = new THREE.Scene();
        if (this.debugMode) {
            markOriginPointForDebugging(this.scene);
        }

        const ambientLight = new THREE.AmbientLight(0xffffff, 3);
        this.scene.add(ambientLight);

        this.mapInstance = mapArg;
        const canvas = mapArg.getCanvas();
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            context: gl,
            antialias: true,
        });
        this.renderer.autoClear = false;

        this.tilesCamera = new THREE.PerspectiveCamera();
        this.initTiles();
    }

    onRemove() {
        this.clearCallbacksAndTimeouts();
    }

    destroy() {
        if (this.destroyed) return;

        const mapInstance = this.mapInstance;
        if (mapInstance && this.layerId && mapInstance.getLayer?.(this.layerId)) {
            mapInstance.removeLayer(this.layerId); // will call onRemove which will call clearCallbacksAndTimeouts
        } else {
            this.clearCallbacksAndTimeouts();
        }

        if (this.tiles) {
            this.loadTilesetHandler && this.tiles.removeEventListener("load-tileset", this.loadTilesetHandler);
            this.scene?.remove(this.tiles.group);
            this.tiles.dispose?.();
        }

        this.tiles = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.tilesCamera = null;
        this.customLayer = null;
        this.destroyed = true;
        this.onDestroy?.(this);
    }

    clearCallbacksAndTimeouts() {
        if (this.moveHandler && this.mapInstance) {
            this.mapInstance.off("move", this.moveHandler);
        }
        if (this.throttleTimeout !== null) {
            clearTimeout(this.throttleTimeout);
            this.throttleTimeout = null;
        }
        this.moveHandler = null;
        this.mapInstance = null;
    }

    initTiles() {
        const gltfLoader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(this.dracoPath);
        gltfLoader.setDRACOLoader(dracoLoader);

        const ktx2Loader = new KTX2Loader();
        ktx2Loader.setTranscoderPath(this.ktx2Path);
        ktx2Loader.detectSupport(this.renderer);
        gltfLoader.setKTX2Loader(ktx2Loader);

        this.tiles = new TilesRenderer(this.tilesetUrl);
        this.tiles.group.name = "tiles";
        this.scene.add(this.tiles.group);

        this.tiles.setCamera(this.tilesCamera);
        this.tiles.setResolutionFromRenderer(this.tilesCamera, this.renderer);
        this.tiles.manager.addHandler(/\.(gltf|glb)$/g, gltfLoader);

        let loadedTileSetHandled = false;
        const updateAnchorPoint = (anchor4326) => {
            const newMatrices = calculateAnchorMatrices(anchor4326, this.offset);
            this.matrixOriginToAnchor = newMatrices.matrixOriginToAnchor;
            this.tiles.group.matrix.copy(newMatrices.matrix_ecefAnchorToOrigin);
            this.tiles.group.matrixAutoUpdate = false;
            this.tiles.group.updateMatrixWorld(true);
        };

        const handleAnchorPointWebMercator = () => {
            const { lng, lat } = this.mapInstance.getCenter();
            updateAnchorPoint([lng, lat, 0]);
        };

        const handleAnchorPoint = () => this.throttle(handleAnchorPointWebMercator);
        const loadTileSet = () => {
            if (loadedTileSetHandled) {
                this.tiles?.removeEventListener("load-tileset", loadTileSet);
                return;
            }

            loadedTileSetHandled = true;
            this.moveHandler = () => handleAnchorPoint();
            this.mapInstance.on("move", this.moveHandler);
            handleAnchorPoint();
        };

        this.loadTilesetHandler = loadTileSet;
        this.tiles.addEventListener("load-tileset", this.loadTilesetHandler);
    }

    throttle(cb) {
        if (this.throttleTimeout !== null) return;
        this.throttleTimeout = setTimeout(() => {
            this.throttleTimeout = null;
            cb();
        }, 60);
    }

    render(_gl, args) {
        if (this.destroyed) return;
        if (!this.camera || !this.renderer || !this.scene || !this.tilesCamera) return;

        this.camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix);
        this.camera.projectionMatrix.multiply(this.matrixOriginToAnchor);

        const P = new THREE.Matrix4().fromArray(args.projectionMatrix);
        const invP = P.clone().invert();
        const V = new THREE.Matrix4().multiplyMatrices(invP, this.camera.projectionMatrix);

        this.tilesCamera.projectionMatrix.copy(P);
        this.tilesCamera.matrixWorldInverse.copy(V);
        this.tilesCamera.matrixWorld.copy(V).invert();

        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        if (this.tiles) this.tiles.update();
        this.mapInstance?.triggerRepaint();
    }
}

export { ThreeDManager };
