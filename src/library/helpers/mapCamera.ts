/** TODO This code make sures the ThreeJS camerea has proper metadata despite the custom projections, allowing raycasting to work properly.
 * It was found by ChatGPT sol 5.6. Are there better solutions? I did not carefully research alternatives or correctness,
 * but it empirically works. -Saf 
 */
import { MathUtils, Matrix4, PerspectiveCamera, Vector3 } from 'three';
import type { CustomRenderMethodInput } from 'maplibre-gl';

/** Maintains a rigid Three.js camera while preserving MapLibre's complete clip transform. */
export class MapCameraSync {
    // These are just an optimization. A reused memory area.
    private combined = new Matrix4();
    private view = new Matrix4();
    private scale = new Vector3();

    update(camera: PerspectiveCamera, args: CustomRenderMethodInput, localToMap: Matrix4): void {
        this.combined.fromArray(args.defaultProjectionData.mainMatrix).multiply(localToMap);
        this.view.fromArray(args.projectionMatrix).invert().multiply(this.combined);

        // MapLibre's view includes a meters-to-pixels scale. Three.js cameras
        // strip scale when updating their view matrix, so absorb it (and any
        // custom projection anisotropy) into the projection instead.
        this.view.invert().decompose(camera.position, camera.quaternion, this.scale);
        camera.quaternion.normalize();
        camera.scale.set(1, 1, 1);
        camera.updateMatrix();
        camera.updateMatrixWorld(true);
        camera.projectionMatrix.multiplyMatrices(this.combined, camera.matrixWorld);

        // Normalize homogeneous scale for PerspectiveCamera and tile SSE calculations.
        const normalization = -camera.projectionMatrix.elements[11];
        if (normalization !== 0) camera.projectionMatrix.multiplyScalar(1 / normalization);
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

        const p = camera.projectionMatrix.elements;
        camera.fov = MathUtils.radToDeg(2 * Math.atan(1 / p[5]));
        camera.aspect = p[5] / p[0];
        camera.near = p[14] / (p[10] - 1);
        camera.far = p[14] / (p[10] + 1);
    }
}
