import { expect, test, vi } from 'vitest';
import { ThreeDManager } from './core';
import type { EllipsoidalToOrthometric } from './interfaces';

class TestThreeDManager extends ThreeDManager {
    constructor(ellipsoidalToOrthometric: EllipsoidalToOrthometric) {
        super(ellipsoidalToOrthometric);
    }
}

test('initializes the vertical datum adapter before loading tiles', async () => {
    const adapter: EllipsoidalToOrthometric = {
        init: vi.fn(async () => undefined),
        getOrthometricHeight: vi.fn(([longitude, latitude]) => longitude + latitude),
    };
    const manager = new TestThreeDManager(adapter);

    const tiles = await manager.load3dTiles({ tilesetUrl: 'tileset.json' });

    expect(adapter.init).toHaveBeenCalledOnce();
    expect(manager.getVerticalDatumOffset([35.049, 31.703, 0])).toBeCloseTo(66.752, 3);
    expect(adapter.getOrthometricHeight).toHaveBeenLastCalledWith([35.049, 31.703]);

    tiles.destroy();
});
