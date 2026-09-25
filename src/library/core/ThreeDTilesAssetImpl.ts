import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { getEcefCompassVectors } from '../helpers/coordinates';
import { Asset, type AssetServices } from './asset';
import type { LngLat, Load3dTilesOptions, ThreeDTilesAsset, MetersOffset, LngLatAlt } from '../interfaces';

export class ThreeDTilesAssetImpl extends Asset implements ThreeDTilesAsset {
    placementRoot = new THREE.Group();
    private tiles: TilesRenderer;
    private dracoLoader: DRACOLoader | null = null;
    private ktx2Loader: KTX2Loader | null = null;
    private gltfLoader: GLTFLoader | null = null;
    private abortController = new AbortController();
    private loaderPattern = /\.(gltf|glb)(\?.*)?$/i;
    /** A single point representing the location of the 3D Tiles. Currently the center of the containing sphere. */
    private reference: LngLatAlt | null = null;
    /** Configurable offset from the original reference point */
    private offset: MetersOffset;
    private destroyed = false;

    constructor(
        options: Load3dTilesOptions,
        services: AssetServices,
        private requestRepaint: () => void,
        private onDestroy: (asset: ThreeDTilesAssetImpl) => void,
    ) {
        super(services);
        this.offset = { ...(options.offset ?? { east: 0, up: 0, south: 0 }) };
        this.tiles = new TilesRenderer(options.tilesetUrl);
        this.tiles.fetchOptions.signal = this.abortController.signal;
        if (options.maxDepth !== undefined) this.tiles.maxDepth = options.maxDepth;
        if (options.preprocessURL) this.tiles.registerPlugin({ preprocessURL: options.preprocessURL });
        this.placementRoot.name = 'tiles-offset';
        // Add the 3D Tiles as children of placementRoot. This allows us to offset the 3D Tiles by moving placementRoot.
        this.placementRoot.add(this.tiles.group);
        this.tiles.addEventListener('load-root-tileset', this.rootLoaded);
        this.tiles.addEventListener('needs-update', this.requestRepaint);
    }

    isDestroyed(): boolean { return this.destroyed; }
    getObject3D(): THREE.Object3D { return this.tiles.group; }
    getTilesRenderer(): TilesRenderer { return this.tiles; }
    getOffset(): MetersOffset { return { ...this.offset }; }
    getReference(): LngLatAlt | null { return this.reference; }
    
    setOffset(offset: MetersOffset): void {
        if (this.destroyed) throw new Error('ThreeDTilesAsset has been destroyed');
        this.offset = { ...offset };
        this.applyOffset();
    }

    /** Called by ThreeDTilesAssetImpl */
    attach(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void {
        if (!this.gltfLoader) {
            this.dracoLoader = new DRACOLoader(this.tiles.manager).setDecoderPath(this.services.dracoPath);
            this.ktx2Loader = new KTX2Loader(this.tiles.manager).setTranscoderPath(this.services.ktx2Path);
            this.gltfLoader = new GLTFLoader(this.tiles.manager)
                .setDRACOLoader(this.dracoLoader)
                .setKTX2Loader(this.ktx2Loader);
        }
        this.ktx2Loader!.detectSupport(renderer);
        this.tiles.manager.removeHandler(this.loaderPattern);
        this.tiles.manager.addHandler(this.loaderPattern, this.gltfLoader);
        this.tiles.setCamera(camera);
        this.tiles.setResolutionFromRenderer(camera, renderer);
    }

    /** Called by ThreeDTilesAssetImpl */
    detach(camera: THREE.PerspectiveCamera): void {
        this.tiles.deleteCamera(camera);
    }

    /** Called by ThreeDTilesAssetImpl's "render" function. */
    update(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void {
        if (this.destroyed) return;
        const canvas = renderer.domElement;
        this.tiles.setResolution(camera, canvas.width, canvas.height);
        this.tiles.update();
    }

    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        this.tiles.removeEventListener('load-root-tileset', this.rootLoaded);
        this.tiles.removeEventListener('needs-update', this.requestRepaint);
        this.abortController.abort();
        this.onDestroy(this);
        this.placementRoot.removeFromParent();
        this.tiles.dispose();
        this.tiles.manager.removeHandler(this.loaderPattern);
        this.dracoLoader?.dispose();
        this.ktx2Loader?.dispose();
        this.dracoLoader = null;
        this.ktx2Loader = null;
        this.gltfLoader = null;
    }

    private rootLoaded = (): void => {
        if (this.destroyed || this.reference) return;
        // calculate bounding sphere and designated its center as our reference point.
        const sphere = new THREE.Sphere();
        if (!this.tiles.getBoundingSphere(sphere)) {
            throw new Error('Failed to calculate 3D Tiles bounding sphere');
        }
        this.reference = this.services.ecefToLngLatAlt(sphere.center);
        // apply offset (if needed) relative to the reference point.
        this.applyOffset();
    };

    private applyOffset(): void {
        if (!this.reference) return;
        const { east, up, south } = getEcefCompassVectors(...this.reference.point);
        this.placementRoot.position.set(0, 0, 0)
            .addScaledVector(east, this.offset.east)
            .addScaledVector(up, this.offset.up)
            .addScaledVector(south, this.offset.south);
        this.placementRoot.updateWorldMatrix(true, true);
        this.requestRepaint();
    }
}
