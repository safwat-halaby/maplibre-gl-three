// TODO these tests are unsupervised AI-GEN and could likely be improved. 

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import * as THREE from 'three';
import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl';
import type { Tileset } from '3d-tiles-renderer/core';
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ThreeDManagerImpl } from './core/ThreeDManagerImpl';
import { ThreeDManager as PublicManager } from './maplibre-gl-three';
import { getEcefOrientationMatrix } from './helpers/coordinates';
import type { GeographicRaster } from './core/internal-interfaces';
import type { LngLat, ThreeDManagerOptions, ThreeDTilesAsset } from './interfaces';

// Exercise real scenes, cameras, raycasting, tileset loading and bounding volumes.
// Only the browser/WebGL boundary is replaced.
vi.mock('three', async importOriginal => {
    const three = await importOriginal<typeof import('three')>();
    return {
        ...three,
        WebGLRenderer: class {
            autoClear = true;
            domElement: HTMLCanvasElement;
            extensions = { has: () => false };
            resetState = vi.fn();
            clearDepth = vi.fn();
            dispose = vi.fn();
            render = vi.fn((scene: THREE.Scene, camera: THREE.Camera) => {
                scene.updateMatrixWorld();
                camera.updateMatrixWorld();
            });
            constructor({ canvas }: { canvas: HTMLCanvasElement }) { this.domElement = canvas; }
            getSize(target: THREE.Vector2) { return target.set(this.domElement.width, this.domElement.height); }
        },
    };
});

class TestThreeDManager extends ThreeDManagerImpl {
    constructor(raster: GeographicRaster, options: ThreeDManagerOptions = {}) { super(raster, options); }
}

const managers: TestThreeDManager[] = [];

function createRaster(undulation = 0): GeographicRaster {
    return {
        init: vi.fn(async () => undefined),
        getPixelValue: vi.fn(() => undulation),
        wgs84ToPixels: vi.fn((point: LngLat): LngLat => [...point]),
    };
}

function createManager(raster = createRaster(), options: ThreeDManagerOptions = {}) {
    const manager = new TestThreeDManager(raster, options);
    managers.push(manager);
    return manager;
}

function createMap(initialCenter: LngLat = [0, 0]) {
    let center = initialCenter;
    const layers = new Map<string, CustomLayerInterface>();
    const moveHandlers = new Set<() => void>();
    const gl = {} as WebGL2RenderingContext;
    const canvas = { width: 800, height: 600 } as HTMLCanvasElement;
    const map = {
        getCanvas: () => canvas,
        getCenter: () => ({ lng: center[0], lat: center[1] }),
        getLayer: (id: string) => layers.get(id),
        addLayer: (layer: CustomLayerInterface) => {
            layer.onAdd?.(map, gl);
            layers.set(layer.id, layer);
        },
        removeLayer: vi.fn((id: string) => {
            const layer = layers.get(id);
            layers.delete(id);
            layer?.onRemove?.(map, gl);
        }),
        on: vi.fn((event: string, handler: () => void) => { if (event === 'move') moveHandlers.add(handler); }),
        off: vi.fn((event: string, handler: () => void) => { if (event === 'move') moveHandlers.delete(handler); }),
        triggerRepaint: vi.fn(),
    } as unknown as MapLibreMap;
    return {
        map, gl, canvas, moveHandlers,
        move(next: LngLat) {
            center = next;
            for (const handler of moveHandlers) handler();
        },
    };
}

function renderInput(): CustomRenderMethodInput {
    const camera = new THREE.PerspectiveCamera(50, 4 / 3, 0.1, 10000000);
    camera.position.set(0, 0, 100);
    camera.updateMatrixWorld();
    return {
        projectionMatrix: camera.projectionMatrix.toArray(),
        defaultProjectionData: {
            mainMatrix: camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse).toArray(),
        },
    } as unknown as CustomRenderMethodInput;
}

async function loadRoot(asset: ThreeDTilesAsset, boundingVolume: object, transform?: number[]) {
    const tiles = asset.getTilesRenderer();
    const tileset = {
        asset: { version: '1.0' }, geometricError: 0,
        root: { boundingVolume, geometricError: 0, refine: 'REPLACE', transform, children: [] },
    };
    tiles.registerPlugin({ fetchData: async () => tileset });
    const loaded = new Promise<void>(resolve => {
        const handler = () => {
            tiles.removeEventListener('load-root-tileset', handler);
            resolve();
        };
        tiles.addEventListener('load-root-tileset', handler);
    });
    tiles.update();
    await loaded;
}

beforeEach(() => {
    vi.stubGlobal('window', { location: { href: 'https://example.test/' } });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
    for (const manager of managers.splice(0)) manager.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

test('initialization is explicit and converts sea-level altitude using the object location', async () => {
    const raster = createRaster(30);
    const manager = createManager(raster);
    expect(() => manager.createLayer({ id: 'early' })).toThrow('manager.init()');
    expect(() => manager.lngLatAltToEcef({ point: [0, 0], height: 20 })).toThrow('manager.init()');
    const first = manager.init();
    await expect(manager.init()).rejects.toThrow('Double-initializing a manager');
    await first;
    expect(raster.init).toHaveBeenCalledOnce();
    expect(manager.lngLatAltToEcef({ point: [0, 0], height: 20 })).toEqual(new THREE.Vector3(6378187, 0, 0));
    const point = manager.lngLatAltToEcef({ point: [-75.596, 40.038], height: 20 });
    expect(raster.wgs84ToPixels).toHaveBeenLastCalledWith([-75.596, 40.038]);
    const result = manager.ecefToLngLatAlt(point);
    expect(result.point[0]).toBeCloseTo(-75.596, 9);
    expect(result.point[1]).toBeCloseTo(40.038, 9);
    expect(result.height).toBeCloseTo(20, 5);
});

test('disabled datum works through the public bilinear raster composition without fetching', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const manager = new PublicManager({ verticalDatum: { enabled: false } });
    managers.push(manager);
    await manager.init();
    expect(manager.lngLatAltToEcef({ point: [0, 0], height: 20 })).toEqual(new THREE.Vector3(6378157, 0, 0));
    expect(fetch).not.toHaveBeenCalled();
});

test('initialization failures propagate', async () => {
    const failure = createManager({ ...createRaster(), init: async () => { throw new Error('raster unavailable'); } });
    await expect(failure.init()).rejects.toThrow('raster unavailable');
    expect(() => failure.lngLatAltToEcef({ point: [0, 0], height: 0 })).toThrow('manager.init()');
});

test('multiple assets share one scene, renderer, camera and depth pass', async () => {
    const manager = createManager();
    await manager.init();
    const layer = manager.createLayer({ id: 'shared' });
    const [a, b] = await Promise.all([
        layer.load3dTiles({ tilesetUrl: 'https://example.test/a.json', maxDepth: 3 }),
        layer.load3dTiles({ tilesetUrl: 'https://example.test/b.json' }),
    ]);
    expect(layer.getRenderer()).toBeNull();
    expect(a.getObject3D().parent?.parent).toBe(layer.getScene());
    expect(b.getObject3D().parent?.parent).toBe(layer.getScene());
    expect(a.getTilesRenderer().maxDepth).toBe(3);
    const { map, gl } = createMap();
    map.addLayer(layer);
    const renderer = layer.getRenderer()!;
    const updateA = vi.spyOn(a.getTilesRenderer(), 'update').mockImplementation(() => {});
    const updateB = vi.spyOn(b.getTilesRenderer(), 'update').mockImplementation(() => {});
    layer.render(gl, renderInput());
    expect(updateA).toHaveBeenCalledOnce();
    expect(updateB).toHaveBeenCalledOnce();
    expect(a.getTilesRenderer().cameras).toEqual([layer.getCamera()]);
    expect(b.getTilesRenderer().cameras).toEqual([layer.getCamera()]);
    const loaderA = a.getTilesRenderer().manager.getHandler('model.glb') as GLTFLoader;
    const loaderB = b.getTilesRenderer().manager.getHandler('model.glb') as GLTFLoader;
    expect(loaderA).not.toBe(loaderB);
    expect(loaderA.manager).toBe(a.getTilesRenderer().manager);
    expect(loaderB.manager).toBe(b.getTilesRenderer().manager);
    expect(loaderA.dracoLoader).not.toBe(loaderB.dracoLoader);
    expect(loaderA.ktx2Loader).not.toBe(loaderB.ktx2Loader);
    expect(renderer.render).toHaveBeenCalledExactlyOnceWith(layer.getScene(), layer.getCamera());
    expect(renderer.clearDepth).toHaveBeenCalledTimes(2);
    expect(updateA.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(renderer.render).mock.invocationCallOrder[0]);
});

test('loading into an already-mounted empty layer initializes loaders before tile traversal', async () => {
    const manager = createManager();
    await manager.init();
    const layer = manager.createLayer({ id: 'late-assets', separatorBefore: false, separatorAfter: false });
    const { map, gl, canvas } = createMap();
    map.addLayer(layer);
    const asset = await layer.load3dTiles({ tilesetUrl: 'https://example.test/tiles.json' });
    vi.spyOn(asset.getTilesRenderer(), 'update').mockImplementation(() => {});
    const resolution = vi.spyOn(asset.getTilesRenderer(), 'setResolution');
    canvas.width = 1600;
    layer.render(gl, renderInput());
    expect(asset.getTilesRenderer().hasCamera(layer.getCamera())).toBe(true);
    expect(asset.getTilesRenderer().manager.getHandler('model.glb?token=value')).not.toBeNull();
    expect(resolution).toHaveBeenLastCalledWith(layer.getCamera(), 1600, 600);
    expect(layer.getRenderer()!.clearDepth).not.toHaveBeenCalled();
});

test('all layers rebase together with one listener, including ordinary ECEF objects', async () => {
    const raster = createRaster(30);
    const manager = createManager(raster, { debugMode: true });
    await manager.init();
    const a = manager.createLayer({ id: 'a' });
    const b = manager.createLayer({ id: 'b' });
    const object = new THREE.Object3D();
    const ecef = manager.lngLatAltToEcef({ point: [0, 0], height: 20 });
    object.position.copy(ecef);
    a.getScene().add(object);
    const { map, gl, move, moveHandlers } = createMap();
    map.addLayer(a);
    map.addLayer(b);
    expect(moveHandlers.size).toBe(1);
    expect(map.on).toHaveBeenCalledOnce();
    expect(object.getWorldPosition(new THREE.Vector3()).y).toBeCloseTo(20, 6);
    const before = a.getScene().matrix.clone();
    const samples = vi.mocked(raster.getPixelValue).mock.calls.length;
    move([0.01, 0.02]);
    move([0.02, 0.03]);
    a.render(gl, renderInput());
    b.render(gl, renderInput());
    expect(vi.mocked(raster.getPixelValue).mock.calls.length).toBe(samples + 1);
    expect(a.getScene().matrix.equals(before)).toBe(false);
    expect(b.getScene().matrix.equals(a.getScene().matrix)).toBe(true);
    expect(object.position.equals(ecef)).toBe(true);
    const world = object.getWorldPosition(new THREE.Vector3());
    expect(manager.ecefToLocalVector(ecef).distanceTo(world)).toBeLessThan(1e-8);
    const roundTrip = manager.localVectorToEcef(world);
    expect(roundTrip.distanceTo(object.position)).toBeLessThan(1e-7);
    const axes = a.getScene().getObjectByName('debug-local-axes')!;
    expect(axes.getWorldPosition(new THREE.Vector3()).length()).toBeLessThan(1e-7);
    map.removeLayer(a.id);
    expect(moveHandlers.size).toBe(1);
    map.removeLayer(b.id);
    expect(moveHandlers.size).toBe(0);
});

test('caches the inverse anchor matrix for repeated local-to-ECEF conversions', async () => {
    const manager = createManager();
    await manager.init();
    const layer = manager.createLayer({ id: 'cached-inverse' });
    const invert = vi.spyOn(THREE.Matrix4.prototype, 'invert');
    const { map } = createMap();
    map.addLayer(layer);

    const point = new THREE.Vector3(1, 2, 3);
    manager.localVectorToEcef(point);
    manager.localVectorToEcef(point);

    expect(invert).toHaveBeenCalledOnce();
});

test('asset references use the manager vertical datum conversion', async () => {
    const manager = createManager(createRaster(30));
    await manager.init();
    const layer = manager.createLayer({ id: 'reference' });
    const asset = await layer.load3dTiles({ tilesetUrl: 'https://example.test/tiles.json' });

    await loadRoot(
        asset,
        { sphere: [0, 0, 0, 10] },
        new THREE.Matrix4().makeTranslation(0, 6378137, 0).toArray(),
    );

    const reference = asset.getReference();
    expect(reference).not.toBeNull();
    expect(reference!.point[0]).toBeCloseTo(90, 9);
    expect(reference!.point[1]).toBeCloseTo(0, 9);
    expect(reference!.height).toBeCloseTo(-30, 5);
});

test('offset directions use the transformed root sphere and remain stable across anchor movement', async () => {
    const manager = createManager();
    await manager.init();
    const layer = manager.createLayer({ id: 'offsets' });
    const asset = await layer.load3dTiles({
        tilesetUrl: 'https://example.test/tiles.json', offset: { east: 10, up: 20, south: 30 },
    });
    const transform = new THREE.Matrix4().makeTranslation(0, 6378137, 0).toArray();
    await loadRoot(asset, { sphere: [0, 0, 0, 10] }, transform);
    const offsetGroup = asset.getObject3D().parent!;
    expect(offsetGroup.position.distanceTo(new THREE.Vector3(-10, 20, -30))).toBeLessThan(1e-8);
    expect(asset.getObject3D().matrix.equals(new THREE.Matrix4())).toBe(true);
    const initial = offsetGroup.position.clone();
    const { map, gl, move } = createMap();
    map.addLayer(layer);
    vi.spyOn(asset.getTilesRenderer(), 'update').mockImplementation(() => {});
    move([120, 40]);
    layer.render(gl, renderInput());
    expect(offsetGroup.position.equals(initial)).toBe(true);
    asset.getTilesRenderer().dispatchEvent({ type: 'load-tileset', tileset: {} as Tileset, url: 'nested.json' });
    expect(offsetGroup.position.equals(initial)).toBe(true);
    asset.setOffset({ east: 0, up: 50, south: 0 });
    expect(offsetGroup.position.distanceTo(new THREE.Vector3(0, 50, 0))).toBeLessThan(1e-8);
    const copy = asset.getOffset();
    copy.up = 999;
    expect(asset.getOffset().up).toBe(50);
});

test.each(['box', 'region'])('offsets resolve a root %s bounding volume in ECEF', async kind => {
    const manager = createManager();
    await manager.init();
    const layer = manager.createLayer({ id: kind });
    const asset = await layer.load3dTiles({
        tilesetUrl: `https://example.test/${kind}.json`, offset: { east: 10, up: 20, south: 30 },
    });
    const boundingVolume = kind === 'box'
        ? { box: [0, 0, 0, 10, 0, 0, 0, 20, 0, 0, 0, 30] }
        : { region: [-0.0001, -0.0001, 0.0001, 0.0001, 0, 20] };
    // Region coordinates ignore root.transform per the 3D Tiles specification.
    const transform = new THREE.Matrix4().makeTranslation(6378137, 0, 0).toArray();
    await loadRoot(asset, boundingVolume, transform);
    expect(asset.getObject3D().parent!.position.distanceTo(new THREE.Vector3(20, 10, -30))).toBeLessThan(1e-5);
});

test('asset destruction is isolated; detachment preserves content and permits reattachment', async () => {
    const manager = createManager();
    await manager.init();
    const layer = manager.createLayer({ id: 'lifecycle' });
    const a = await layer.load3dTiles({ tilesetUrl: 'https://example.test/a.json' });
    const b = await layer.load3dTiles({ tilesetUrl: 'https://example.test/b.json' });
    const disposeA = vi.spyOn(a.getTilesRenderer(), 'dispose');
    const disposeB = vi.spyOn(b.getTilesRenderer(), 'dispose');
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    const geometryDispose = vi.spyOn(mesh.geometry, 'dispose');
    const materialDispose = vi.spyOn(mesh.material, 'dispose');
    layer.getScene().add(mesh);
    const scene = layer.getScene();
    const { map, move, moveHandlers } = createMap();
    map.addLayer(layer);
    const loaderA = a.getTilesRenderer().manager.getHandler('model.glb') as GLTFLoader;
    const loaderB = b.getTilesRenderer().manager.getHandler('model.glb') as GLTFLoader;
    const disposeDracoA = vi.spyOn(loaderA.dracoLoader!, 'dispose');
    const disposeKtxA = vi.spyOn(loaderA.ktx2Loader!, 'dispose');
    const disposeDracoB = vi.spyOn(loaderB.dracoLoader!, 'dispose');
    const disposeKtxB = vi.spyOn(loaderB.ktx2Loader!, 'dispose');
    a.destroy();
    a.destroy();
    expect(disposeA).toHaveBeenCalledOnce();
    expect(disposeDracoA).toHaveBeenCalledOnce();
    expect(disposeKtxA).toHaveBeenCalledOnce();
    expect(disposeDracoB).not.toHaveBeenCalled();
    expect(disposeKtxB).not.toHaveBeenCalled();
    expect(map.getLayer(layer.id)).toBe(layer);
    expect(b.isDestroyed()).toBe(false);
    expect(a.getObject3D().parent).toBeNull();
    const renderer = layer.getRenderer()!;
    map.removeLayer(layer.id);
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(layer.getRenderer()).toBeNull();
    expect(disposeB).not.toHaveBeenCalled();
    expect(b.getTilesRenderer().cameras).toEqual([]);
    expect(layer.isDestroyed()).toBe(false);
    move([10, 20]);
    map.addLayer(layer);
    expect(layer.getScene()).toBe(scene);
    expect(scene.children).toContain(mesh);
    expect(layer.getRenderer()).not.toBe(renderer);
    expect(b.getTilesRenderer().cameras).toEqual([layer.getCamera()]);
    expect(b.getTilesRenderer().manager.getHandler('model.glb')).toBe(loaderB);
    manager.destroy();
    expect(moveHandlers.size).toBe(0);
    expect(layer.isDestroyed()).toBe(true);
    expect(b.isDestroyed()).toBe(true);
    expect(disposeB).toHaveBeenCalledOnce();
    expect(disposeDracoB).toHaveBeenCalledOnce();
    expect(disposeKtxB).toHaveBeenCalledOnce();
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).not.toHaveBeenCalled();
    await expect(layer.load3dTiles({ tilesetUrl: 'late.json' })).rejects.toThrow('destroyed');
    expect(() => map.addLayer(layer)).toThrow('destroyed');
    mesh.geometry.dispose();
    mesh.material.dispose();
});

test('layer ids are unique and a manager stays bound to one map', async () => {
    const manager = createManager();
    await manager.init();
    const generated = manager.createLayer();
    expect(generated.id).toMatch(/^maplibre-gl-three-\d+$/);
    expect(() => manager.createLayer({ id: generated.id })).toThrow('already exists');
    const layer = manager.createLayer({ id: 'a' });
    expect(() => manager.createLayer({ id: 'a' })).toThrow('already exists');
    const first = createMap();
    first.map.addLayer(layer);
    const other = manager.createLayer({ id: 'b' });
    expect(() => createMap().map.addLayer(other)).toThrow('one MapLibre map');
    expect(first.moveHandlers.size).toBe(1);
    layer.destroy();
    expect(() => manager.createLayer({ id: 'a' })).not.toThrow();
});

test('late root metadata cannot reattach a destroyed asset or trigger its callbacks', async () => {
    const manager = createManager();
    await manager.init();
    const layer = manager.createLayer({ id: 'late-root' });
    const asset = await layer.load3dTiles({ tilesetUrl: 'https://example.test/late.json' });
    const tiles = asset.getTilesRenderer();
    const bounds = vi.spyOn(tiles, 'getBoundingSphere');
    let complete!: (tileset: object) => void;
    tiles.registerPlugin({ fetchData: () => new Promise(resolve => { complete = resolve; }) });
    const loaded = new Promise<void>(resolve => tiles.addEventListener('load-root-tileset', () => resolve()));
    tiles.update();
    asset.destroy();
    expect(tiles.fetchOptions.signal!.aborted).toBe(true);
    complete({
        asset: { version: '1.0' }, geometricError: 0,
        root: { boundingVolume: { sphere: [6378137, 0, 0, 10] }, geometricError: 0, children: [] },
    });
    await loaded;
    expect(bounds).not.toHaveBeenCalled();
    expect(layer.getScene().children).toHaveLength(1); // Default ambient light only.
    expect(asset.getObject3D().parent).toBeNull();
});

test('orientation aligns model X/Y/Z to east/up/south', () => {
    const orientation = getEcefOrientationMatrix([0, 0]);
    const orientationWithAltitude = getEcefOrientationMatrix({ point: [0, 0], height: 100 });
    expect(orientation.angleTo(orientationWithAltitude)).toBeLessThan(1e-12);
    expect(new THREE.Vector3(1, 0, 0).applyQuaternion(orientation).distanceTo(new THREE.Vector3(0, 1, 0))).toBeLessThan(1e-12);
    expect(new THREE.Vector3(0, 1, 0).applyQuaternion(orientation).distanceTo(new THREE.Vector3(1, 0, 0))).toBeLessThan(1e-12);
    expect(new THREE.Vector3(0, 0, 1).applyQuaternion(orientation).distanceTo(new THREE.Vector3(0, 0, -1))).toBeLessThan(1e-12);
});
