import * as THREE from 'three';
import type { CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl';
import { MapCameraSync } from '../helpers/mapCamera';
import { ThreeDTilesAssetImpl } from './ThreeDTilesAssetImpl';
import type { AssetServices } from './asset';
import type { AnchorMatrices } from './internal-interfaces';
import type { CreateLayerOptions, Load3dTilesOptions, LngLatAlt, ThreeDTilesAsset, ThreeLayer } from '../interfaces';

/** Dependency inversion interface for the layer.
 * Manager knows layer.
 * Manager supplies LayerServices to layer.
 * Layer calls layerServices and does not know manager directly.
 */
export interface LayerServices {
    debugMode: boolean;
    dracoPath: string;
    ktx2Path: string;
    notifyAttach(layer: ThreeLayerImpl, map: MapLibreMap): void;
    notifyDetach(layer: ThreeLayerImpl): void;
    notifyDestroy(layer: ThreeLayerImpl): void;
    updateAnchor(): void;
    ecefToLngLatAlt(point: THREE.Vector3): LngLatAlt;
}

export class ThreeLayerImpl implements ThreeLayer {
    private static idAutoIncrement = 0;

    id: string;
    readonly type = 'custom';
    readonly renderingMode = '3d';
    private destroyed = false;
    private scene = new THREE.Scene();
    private camera = new THREE.PerspectiveCamera();
    private cameraSync = new MapCameraSync();
    private localToMap = new THREE.Matrix4();
    private assets = new Set<ThreeDTilesAssetImpl>();
    private separatorBefore: boolean;
    private separatorAfter: boolean;
    private renderer: THREE.WebGLRenderer | null = null;
    private mapInstance: MapLibreMap | null = null;
    private debugAxes: THREE.AxesHelper | null;

    constructor(options: CreateLayerOptions, private services: LayerServices) {
        this.id = options.id || ThreeLayerImpl.autoGenerateId();
        this.separatorBefore = options.separatorBefore ?? true;
        this.separatorAfter = options.separatorAfter ?? true;
        this.scene.matrixAutoUpdate = false;
        this.camera.matrixAutoUpdate = false;
        this.scene.add(new THREE.AmbientLight(0xffffff, 3));
        this.debugAxes = services.debugMode ? new THREE.AxesHelper(400) : null;
        if (this.debugAxes) {
            this.debugAxes.name = 'debug-local-axes';
            this.debugAxes.renderOrder = 999;
            this.debugAxes.matrixAutoUpdate = false;
            const materials = Array.isArray(this.debugAxes.material) ? this.debugAxes.material : [this.debugAxes.material];
            for (const material of materials) {
                material.depthTest = false;
                material.depthWrite = false;
            }
            this.scene.add(this.debugAxes);
        }
    }

    isDestroyed(): boolean { return this.destroyed; }
    getScene(): THREE.Scene { return this.scene; }
    getCamera(): THREE.PerspectiveCamera { return this.camera; }
    getRenderer(): THREE.WebGLRenderer | null { return this.renderer; }

    async load3dTiles(options: Load3dTilesOptions): Promise<ThreeDTilesAsset> {
        this.assertAlive();
        const assetServices: AssetServices = {
            dracoPath: this.services.dracoPath,
            ktx2Path: this.services.ktx2Path,
            ecefToLngLatAlt: this.services.ecefToLngLatAlt,
        };
        const asset = new ThreeDTilesAssetImpl(options, assetServices, this.requestRepaint, asset => {
            asset.detach(this.camera);
            this.assets.delete(asset);
            this.requestRepaint();
        });
        this.assets.add(asset);
        this.scene.add(asset.placementRoot);
        if (this.renderer) asset.attach(this.camera, this.renderer); 
        // else, we'll attach the asset later, when we're added to the map, in onAdd.
        this.requestRepaint();
        return asset;
    }

    requestRepaint = (): void => { this.mapInstance?.triggerRepaint(); };

    /** Called by ThreeDManager's updateAnchor */
    applyAnchor(anchor: AnchorMatrices): void {
        this.scene.matrix.copy(anchor.ecefToLocal);
        this.localToMap.copy(anchor.localToMap);
        // Keep the debug axes in LocalSpace despite the ECEF scene. The scene will call ecefToLocal on these coordinates, cancelling this out and putting them back to (0,0,0)
        this.debugAxes?.matrix.copy(anchor.localToEcef);
        this.scene.updateMatrixWorld(true);
    }

    /** Called by MapLibre once the layer is added to the map */
    onAdd(map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
        this.assertAlive();
        if (this.mapInstance) throw new Error(`Layer "${this.id}" is already attached`);
        try {
            this.services.notifyAttach(this, map);
            this.mapInstance = map;
            this.renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
            this.renderer.autoClear = false;
            for (const asset of this.assets) asset.attach(this.camera, this.renderer);
            this.requestRepaint();
        } catch (error) {
            this.onRemove();
            throw error;
        }
    }

    /** Called by MapLibre once the layer is removed from the map */
    onRemove(): void {
        for (const asset of this.assets) asset.detach(this.camera);
        this.renderer?.dispose();
        this.renderer = null;
        this.mapInstance = null;
        this.services.notifyDetach(this);
    }

    render(_gl: WebGLRenderingContext | WebGL2RenderingContext, args: CustomRenderMethodInput): void {
        if (this.destroyed || !this.renderer || !this.mapInstance) return;
        this.services.updateAnchor(); // triggers threeDManager's updateAnchor which in turn may trigger this.applyAnchor
        this.cameraSync.update(this.camera, args, this.localToMap);
        this.scene.updateMatrixWorld(true);

        for (const asset of this.assets) asset.update(this.camera, this.renderer);

        this.renderer.resetState();
        if (this.separatorBefore) this.renderer.clearDepth();
        this.renderer.render(this.scene, this.camera);
        if (this.separatorAfter) this.renderer.clearDepth();
        // Preserve continuous rendering for streaming and user animation callbacks.
        this.requestRepaint();
    }

    destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        const map = this.mapInstance;
        if (map?.getLayer(this.id)) map.removeLayer(this.id);
        else this.onRemove();
        for (const asset of [...this.assets]) asset.destroy();
        if (this.debugAxes) {
            this.debugAxes.geometry.dispose();
            const materials = Array.isArray(this.debugAxes.material) ? this.debugAxes.material : [this.debugAxes.material];
            for (const material of materials) material.dispose();
        }
        this.scene.clear();
        this.services.notifyDestroy(this);
    }

    private assertAlive(): void {
        if (this.destroyed) throw new Error(`Layer "${this.id}" has been destroyed`);
    }

    private static autoGenerateId(): string {
        ThreeLayerImpl.idAutoIncrement += 1;
        return 'maplibre-gl-three-' + ThreeLayerImpl.idAutoIncrement;
    }
}
