import { renderHook } from '@testing-library/react';

import { useFollowMouse } from '../../src/ts/util/custom-hooks';

describe('Custom Hooks', () => {
  it('exists', () => {
    expect(useFollowMouse).toBeDefined();
  });

  it('useFollowMouse', () => {
    const result = renderHook(() => useFollowMouse());
    expect(result.result.current).toMatchInlineSnapshot(`
      {
        "initialMouseX": 0,
        "mouseX": 0,
        "mouseY": 0,
        "onMouseMove": [Function],
        "setMouseX": [Function],
      }
    `);
  });
});
