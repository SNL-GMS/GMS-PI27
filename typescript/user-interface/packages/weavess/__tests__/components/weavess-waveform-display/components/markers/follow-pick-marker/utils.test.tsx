import { fireEvent, render } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import React from 'react';

import { useMousePosition } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/follow-pick-marker/utils';

describe('useMousePosition', () => {
  test('is defined', () => {
    expect(useMousePosition).toBeDefined();
  });

  it('call useStationOnClickHandler responds to mouse movement', () => {
    function SimpleComp() {
      const position = useMousePosition();
      // eslint-disable-next-line react/jsx-no-useless-fragment
      return <>{position.x}</>;
    }
    const { container } = render(<SimpleComp />);
    act(() => {
      fireEvent.mouseMove(
        document,
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/MouseEvent
        {
          clientX: 200
        }
      );
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        200
      </div>
    `);
  });
});
