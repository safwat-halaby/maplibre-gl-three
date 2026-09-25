// TODO these tests are unsupervised AI-GEN and could likely be improved. 

import { expect, test } from 'vitest';
import { Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, SphereGeometry, Vector2, Vector3 } from 'three';
import type { CustomRenderMethodInput } from 'maplibre-gl';
import { MapCameraSync } from './mapCamera';

function expectIdentity(matrix: Matrix4) {
    const expected = new Matrix4().elements;
    matrix.elements.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 8));
}

test.each([false, true])('camera preserves clip coordinates and raycasting with nonuniform scale=%s', nonuniform => {
    const mapCamera = new PerspectiveCamera(55, 1.5, 0.5, 10000);
    mapCamera.position.set(120, 80, 300);
    mapCamera.lookAt(0, 0, 0);
    mapCamera.updateMatrixWorld(true);
    const scale = new Matrix4().makeScale(2.5, nonuniform ? 3.5 : 2.5, 2.5);
    const view = mapCamera.matrixWorldInverse.clone().multiply(scale);
    const combined = mapCamera.projectionMatrix.clone().multiply(view);
    const localToMap = new Matrix4().makeTranslation(0.2, 0.3, 0)
        .scale(new Vector3(1e-5, -1e-5, 1e-5)).multiply(new Matrix4().makeRotationX(Math.PI / 2));
    const args = {
        projectionMatrix: mapCamera.projectionMatrix.toArray(),
        defaultProjectionData: { mainMatrix: combined.clone().multiply(localToMap.clone().invert()).toArray() },
    } as unknown as CustomRenderMethodInput;
    const camera = new PerspectiveCamera();
    camera.matrixAutoUpdate = false;
    new MapCameraSync().update(camera, args, localToMap);

    // Include updates invoked by WebGLRenderer and Object3D.getWorldPosition.
    camera.updateMatrixWorld(true);
    camera.getWorldPosition(new Vector3());
    expectIdentity(camera.matrixWorld.clone().multiply(camera.matrixWorldInverse));
    expectIdentity(camera.projectionMatrix.clone().multiply(camera.projectionMatrixInverse));
    expect(camera.scale.toArray()).toEqual([1, 1, 1]);
    const expectedPosition = new Vector3().setFromMatrixPosition(view.clone().invert());
    expect(camera.position.distanceTo(expectedPosition)).toBeLessThan(1e-7);

    for (const point of [new Vector3(), new Vector3(10, 15, -25), new Vector3(-20, 5, 12)]) {
        expect(point.clone().project(camera).distanceTo(point.clone().applyMatrix4(combined))).toBeLessThan(1e-8);
    }

    const mesh = new Mesh(new SphereGeometry(5, 32, 16), new MeshBasicMaterial());
    mesh.updateMatrixWorld(true);
    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(0, 0), camera);
    const intersections = raycaster.intersectObject(mesh);
    expect(intersections.length).toBeGreaterThan(0);
    expect(intersections[0].point.length()).toBeCloseTo(5, 1);
    expect(raycaster.ray.origin.distanceTo(expectedPosition)).toBeLessThan(1e-7);
    const farPoint = new Vector3(0, 0, 0.5).applyMatrix4(combined.clone().invert());
    expect(raycaster.ray.direction.distanceTo(farPoint.sub(expectedPosition).normalize())).toBeLessThan(1e-8);
    mesh.geometry.dispose();
    mesh.material.dispose();
});
