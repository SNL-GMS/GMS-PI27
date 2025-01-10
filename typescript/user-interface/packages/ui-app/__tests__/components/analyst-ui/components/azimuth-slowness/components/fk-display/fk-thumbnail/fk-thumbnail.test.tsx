import { FkTypes } from '@gms/common-model';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { sleep } from '@gms/common-util';
import { getStore } from '@gms/ui-state';
import { getTestFkData } from '@gms/ui-state/__tests__/__data__';
import type { Queries, RenderResult } from '@testing-library/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import type { FkThumbnailProps } from '../../../../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-thumbnail';
import { FkThumbnail } from '../../../../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-thumbnail';

console.warn = jest.fn();

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const pixelSize: any = 200;
const mockClick = jest.fn();
const mockDoubleClick = jest.fn();
const mockContextMenu = jest.fn();

const fkThumbProps: FkThumbnailProps = {
  fkData: getTestFkData(1000),
  signalDetectionFeaturePredictions: undefined,
  signalDetection: signalDetectionsData[0],
  sizePx: pixelSize,
  label: 'USRK P',
  isSelected: false,
  fkUnit: FkTypes.FkUnits.FSTAT,
  onClick: mockClick,
  onDoubleClick: mockDoubleClick,
  onContextMenu: mockContextMenu,
  showButtons: false,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  constantVelocityRings: [8, 10, 20],
  needsReview: true,
  isDisplayed: true
};

jest.mock('@gms/ui-workers', () => {
  const actual = jest.requireActual('@gms/ui-workers');
  return {
    ...actual,
    axiosBaseQuery: jest.fn(() => async () => Promise.resolve({ data: {} }))
  };
});

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useGetFkQueryStatus: jest.fn().mockReturnValue(() => {
      return 'SUCCESS';
    })
  };
});

jest.mock('~analyst-ui/components/azimuth-slowness/components/fk-util', () => {
  const actual = jest.requireActual('~analyst-ui/components/azimuth-slowness/components/fk-util');
  return {
    ...actual,
    determineArrivalTimeSpectrumIndex: jest.fn(() => 0)
  };
});

function TestReduxWrapper({ children }) {
  const store = getStore();
  return <Provider store={store}>{children}</Provider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('FkThumbnail', () => {
  it('FkThumbnails renders without buttons & matches snapshot', async () => {
    let result: RenderResult<Queries, HTMLElement, HTMLElement>;
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable, react/jsx-props-no-spreading
      result = await render(<FkThumbnail {...fkThumbProps} />, {
        wrapper: TestReduxWrapper
      });
    });

    expect(result.container).toMatchSnapshot();
  });

  it('FkThumbnails renders with buttons & matches snapshot', async () => {
    let result: RenderResult<Queries, HTMLElement, HTMLElement>;
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable, react/jsx-props-no-spreading
      result = await render(<FkThumbnail {...fkThumbProps} showButtons />, {
        wrapper: TestReduxWrapper
      });
    });

    expect(result.container).toMatchSnapshot();
  });

  it('Fires contextMenu handler', async () => {
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable, react/jsx-props-no-spreading
      await render(<FkThumbnail {...fkThumbProps} showButtons />, {
        wrapper: TestReduxWrapper
      });
    });

    const thumbnail = screen.getByTestId('fk-thumbnail');

    fireEvent.contextMenu(thumbnail);
    expect(mockContextMenu).toHaveBeenCalled();
  });

  it('Fires click handler', async () => {
    const waitDurationMs = 250;
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable, react/jsx-props-no-spreading
      await render(<FkThumbnail {...fkThumbProps} showButtons />, {
        wrapper: TestReduxWrapper
      });
    });

    const thumbnail = screen.getByTestId('fk-thumbnail');

    fireEvent.click(thumbnail);

    // Click is on a 200ms delay to prevent conflicts with double-click
    await sleep(waitDurationMs);

    expect(mockClick).toHaveBeenCalled();
  });

  it('Fires double click handler', async () => {
    const waitDurationMs = 250;
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable, react/jsx-props-no-spreading
      await render(<FkThumbnail {...fkThumbProps} showButtons />, {
        wrapper: TestReduxWrapper
      });
    });

    const thumbnail = screen.getByTestId('fk-thumbnail');

    fireEvent.dblClick(thumbnail);

    // Click is on a 200ms delay to prevent conflicts with single-click
    await sleep(waitDurationMs);

    expect(mockDoubleClick).toHaveBeenCalled();
    expect(mockClick).not.toHaveBeenCalled();
  });
});
