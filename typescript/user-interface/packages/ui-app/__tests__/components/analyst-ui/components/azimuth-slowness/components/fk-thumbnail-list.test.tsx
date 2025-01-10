/* eslint-disable react/jsx-props-no-spreading */
import type { EventTypes } from '@gms/common-model';
import { FkTypes } from '@gms/common-model';
import {
  defaultStations,
  processingAnalystConfigurationData,
  signalDetectionsData,
  signalDetectionsRecord
} from '@gms/common-model/__tests__/__data__';
import { sleep } from '@gms/common-util';
import type { AppState } from '@gms/ui-state';
import { getStore } from '@gms/ui-state';
import {
  getTestFkChannelSegmentRecord,
  useQueryStateResult
} from '@gms/ui-state/__tests__/__data__';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { HotkeyListener } from '@gms/ui-util';
import type { Queries, RenderResult } from '@testing-library/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import cloneDeep from 'lodash/cloneDeep';
import * as React from 'react';
import { Provider } from 'react-redux';
import * as util from 'util';

import * as sdDetails from '~analyst-ui/common/dialogs/signal-detection-details/signal-detection-details';

import type { FkThumbnailListProps } from '../../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-thumbnail-list/fk-thumbnail-list';
import { FkThumbnailList } from '../../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-thumbnail-list/fk-thumbnail-list';
import { reviewablePhasesRecord } from '../../../../../__data__/test-util-data';

Object.defineProperty(window, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(window, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});
Object.defineProperty(global, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(global, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});

jest.mock(
  '../../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-util',
  () => {
    const actual = jest.requireActual(
      '../../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-util'
    );
    return {
      ...actual,
      filterSignalDetections: jest.fn().mockReturnValue([signalDetectionsData[0]]),
      determineArrivalTimeSpectrumIndex: jest.fn(() => 0)
    };
  }
);

const mockSetSelectedSdIds = jest.fn();
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = appState;
      state.app.workflow.openIntervalName = 'AL1';
      return stateFunc(state);
    }),
    useGetFkChannelSegments: jest.fn().mockReturnValue(() => {
      return getTestFkChannelSegmentRecord(signalDetectionsData[0]);
    }),
    useAllStations: jest.fn(() => defaultStations),
    useFkReviewablePhasesQuery: jest.fn(() => reviewablePhasesRecord),
    useColorMap: jest.fn(() => 'turbo'),
    useGetProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
      data: { stationGroupNames: ['test'] }
    })),
    useGetProcessingAnalystConfigurationQuery: jest.fn(() => {
      const processingConfig = {
        ...cloneDeep(useQueryStateResult),
        data: processingAnalystConfigurationData
      };
      return processingConfig;
    }),
    useKeyboardShortcutConfigurations: jest
      .fn()
      .mockReturnValue(processingAnalystConfigurationData.keyboardShortcuts),
    useSignalDetections: jest.fn(() => {
      return signalDetectionsRecord;
    }),
    useSetSelectedSdIds: jest.fn(() => mockSetSelectedSdIds),
    // Can't directly use FkQueryStatus enum because it's part of the UI state package being mocked
    useGetFkQueryStatus: jest.fn().mockReturnValue(() => {
      return 'SUCCESS';
    })
  };
});

function TestReduxWrapper({ children }) {
  const store = getStore();
  return <Provider store={store}>{children}</Provider>;
}

describe('FK thumbnails tests', () => {
  const mockProps: FkThumbnailListProps = {
    signalDetectionIdToFeaturePredictionsMap: new Map<string, EventTypes.FeaturePrediction[]>(),
    thumbnailSizePx: 300,
    selectedFkUnit: FkTypes.FkUnits.FSTAT,
    fkThumbnailColumnSizePx: 20,
    setPhaseMenuVisibility: jest.fn(),
    setFkThumbnailSizePx: jest.fn()
  };
  const waitDurationMs = 250;
  let result: RenderResult<Queries, HTMLElement, HTMLElement>;
  let subscriptionId;
  beforeEach(async () => {
    subscriptionId = HotkeyListener.subscribeToGlobalHotkeyListener();
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      result = await render(<FkThumbnailList {...mockProps} />, { wrapper: TestReduxWrapper });
    });
  });
  afterEach(() => {
    HotkeyListener.unsubscribeFromGlobalHotkeyListener(subscriptionId);
  });
  it('matches snapshot', () => {
    expect(result).toMatchSnapshot();
  });
  it('single click is fired', async () => {
    const thumbnailCanvas = screen.getByTestId('fk-thumbnail');
    fireEvent.click(thumbnailCanvas);

    // Click is on a 200ms delay to prevent conflicts with double-click
    await sleep(waitDurationMs);

    expect(mockSetSelectedSdIds).toHaveBeenCalledTimes(1);
  });
  it('alt click is fired', async () => {
    const thumbnailCanvas = screen.getByTestId('fk-thumbnail');
    const spyShowSignalDetectionDetails = jest.spyOn(sdDetails, 'showSignalDetectionDetails');
    fireEvent(
      thumbnailCanvas,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        altKey: true
      })
    );

    // Click is on a 200ms delay to prevent conflicts with double-click
    await sleep(waitDurationMs);

    expect(spyShowSignalDetectionDetails).toHaveBeenCalledTimes(1);
  });
});
