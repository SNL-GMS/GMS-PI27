import { fireEvent, render } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import React from 'react';

// import React from 'react';
import { FollowPickMarker } from '../../../../../../src/ts/components/weavess-waveform-display/components/markers/follow-pick-marker/follow-pick-marker';

describe('FollowPickMarker', () => {
  test('is defined', () => {
    expect(FollowPickMarker).toBeDefined();
  });

  it('creates a follow marker when given the correct props', () => {
    const props = {
      displayInterval: {
        startTimeSecs: 10,
        endTimeSecs: 100
      },
      offsetSecs: 10,
      position: 1,
      label: 'P',
      color: 'red',
      parentWidthPx: 100,
      filter: undefined,
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      getTimeSecsForClientX: jest.fn(() => 10)
    };
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<FollowPickMarker {...props} />);
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
        <div
          class="follow-pick-marker"
          role="presentation"
          style="--follow-pick-marker-color: red; transform: translateX(0px); position: relative; height: 100%;"
        >
          <div
            class="follow-pick-marker__vertical"
          />
          <div
            class="follow-pick-marker__label"
            style="left: 4px;"
          >
            P
          </div>
        </div>
      </div>
    `);
  });
});
