import { H1 } from '@blueprintjs/core';
import { act, fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import { HorizontalDivider } from '../../../../src/ts/components/divider/horizontal-divider/horizontal-divider';
import type * as HorizontalDividerTypes from '../../../../src/ts/components/divider/horizontal-divider/types';

const topHeightPixValue = 100;
const minBottomHeightPixValue = 100;
const horDivSizeRange: HorizontalDividerTypes.HorizontalDividerSizeRange = {
  minimumTopHeightPx: 100,
  minimumBottomHeightPx: 100
};

const topElement = <H1>Hello</H1>;
const bottomElement = <H1>World</H1>;
const onResize = jest.fn();
const onResizeEnd = jest.fn();
const props: HorizontalDividerTypes.HorizontalDividerProps = {
  topHeightPx: topHeightPixValue,
  sizeRange: horDivSizeRange,
  minimumBottomHeightPx: minBottomHeightPixValue,
  setFocusToDisplay: jest.fn(),
  top: topElement,
  bottom: bottomElement,
  onResize,
  onResizeEnd
};

describe('Horizontal Divider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('to be defined', () => {
    expect(HorizontalDivider).toBeDefined();
  });

  it('renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<HorizontalDivider {...props} />);
    expect(result.container).toMatchSnapshot();
  });

  it('renders with functions and click and drag', async () => {
    const mouse = [
      { clientX: 10, clientY: 10 },
      { clientX: 100, clientY: 100 }
    ];
    let result;
    await act(() => {
      // eslint-disable-next-line react/jsx-props-no-spreading
      result = render(<HorizontalDivider {...props} />);
    });
    const element = result.getByTitle('Resize');
    fireEvent.mouseDown(element, mouse[0]);
    fireEvent.mouseMove(element, mouse[1]);
    fireEvent.mouseUp(element);
    expect(onResizeEnd).toHaveBeenCalledWith(100);
  });
  it('can re-render with new boundries', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<HorizontalDivider {...props} />);
    // eslint-disable-next-line react/jsx-props-no-spreading
    result.rerender(<HorizontalDivider {...({ ...props, topHeightPx: 200 } as any)} />);
    expect(result.container).toMatchSnapshot();
  });
});
