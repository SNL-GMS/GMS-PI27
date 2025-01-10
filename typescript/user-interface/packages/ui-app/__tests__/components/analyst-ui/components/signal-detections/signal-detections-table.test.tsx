/* eslint-disable no-promise-executor-return */

import {
  eventData,
  eventData2,
  eventStatusInfoComplete,
  openIntervalName,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type {
  AsyncFetchResult,
  EventStatus,
  SignalDetectionFetchResult,
  StationGroupsByNamesQuery
} from '@gms/ui-state';
import { getStore, SignalDetectionColumn } from '@gms/ui-state';
import { render } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import type { CellClickedEvent, CellEditRequestEvent } from 'ag-grid-community';
import type Immutable from 'immutable';
import cloneDeep from 'lodash/cloneDeep';
import * as React from 'react';
import { Provider } from 'react-redux';
import * as toastify from 'react-toastify';

import { getSignalDetectionStatus } from '~analyst-ui/common/utils/event-util';

import type { CellEditParams } from '../../../../../src/ts/components/analyst-ui/components/signal-detections/table/signal-detections-table';
import {
  onCellDoubleClicked,
  onCellEditCallback,
  sdPanelMemoCheck,
  SignalDetectionsTable
} from '../../../../../src/ts/components/analyst-ui/components/signal-detections/table/signal-detections-table';
import {
  buildSignalDetectionRow,
  signalDetectionsColumnsToDisplay
} from '../../../../../src/ts/components/analyst-ui/components/signal-detections/table/signal-detections-table-utils';
import type {
  SignalDetectionRow,
  SignalDetectionsTableProps
} from '../../../../../src/ts/components/analyst-ui/components/signal-detections/types';
import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display';
import { eventsStatusRecord } from '../events/event-table-mock-data';

const sdQueryResult: SignalDetectionFetchResult = {
  data: signalDetectionsData,
  isLoading: false,
  pending: 0,
  isError: false,
  fulfilled: 0,
  rejected: 0
};

const eventStatusQuery: AsyncFetchResult<Record<string, EventStatus>> = {
  data: eventsStatusRecord,
  isLoading: false,
  pending: 0,
  isError: false,
  fulfilled: 0,
  rejected: 0
};
const allMockEvents = [eventData, eventData2];

const eventStatusesComplete: Record<string, EventStatus> = {
  [eventData2.id]: {
    stageId: { name: openIntervalName },
    eventId: eventData2.id,
    eventStatusInfo: eventStatusInfoComplete
  }
};
const currentIntervalMock = {
  startTimeSecs: 6000,
  endTimeSecs: 7000
};

const stationGroupQuery = {
  data: [],
  isError: false
} as unknown as StationGroupsByNamesQuery;

const rowData = signalDetectionsData.map(sd => {
  const associationStatus = getSignalDetectionStatus(
    sd,
    allMockEvents,
    eventData2.id,
    eventStatusesComplete,
    openIntervalName
  );
  return buildSignalDetectionRow(
    {
      sd,
      associationStatus,
      sdInConflict: false,
      sdIsActionTarget: false,
      validActionTargetSignalDetectionIds: []
    },
    currentIntervalMock
  );
});

const mockShortcuts = {
  hotkeys: {
    currentPhaseLabel: {
      category: 'Waveform Display',
      combos: ['shift+e'],
      description: 'Set Selected Signal Detections Phase Label to Current Phase',
      helpText: 'Set phase label for selected signal detection(s) to the current phase.',
      tags: ['set', 'update', 'phase label', 'current phase']
    }
  }
};
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useKeyboardShortcutConfigurations: jest.fn(() => mockShortcuts)
  };
});

describe('signal detections table', () => {
  const { container: withDataUnsynced } = render(
    <Provider store={getStore()}>
      <BaseDisplayContext.Provider
        value={{
          glContainer: {} as any,
          widthPx: 100,
          heightPx: 100
        }}
      >
        <SignalDetectionsTable
          signalDetectionResults={sdQueryResult}
          columnsToDisplay={signalDetectionsColumnsToDisplay}
          isSynced={false}
          data={rowData}
          setPhaseMenuVisibility={jest.fn()}
          stationsGroupsByNamesQuery={stationGroupQuery}
        />
      </BaseDisplayContext.Provider>
    </Provider>
  );

  const { container: withDataSynced } = render(
    <Provider store={getStore()}>
      <BaseDisplayContext.Provider
        value={{
          glContainer: {} as any,
          widthPx: 100,
          heightPx: 100
        }}
      >
        <SignalDetectionsTable
          signalDetectionResults={sdQueryResult}
          columnsToDisplay={signalDetectionsColumnsToDisplay}
          isSynced
          data={rowData}
          setPhaseMenuVisibility={jest.fn()}
          stationsGroupsByNamesQuery={stationGroupQuery}
        />
      </BaseDisplayContext.Provider>
    </Provider>
  );

  test('can mount', () => {
    expect(withDataUnsynced).toBeDefined();
    expect(SignalDetectionsTable).toBeDefined();
  });

  test('matches snapshot given data unsynced', () => {
    expect(withDataUnsynced).toMatchSnapshot();
  });
  test('matches snapshot given data synced', () => {
    expect(withDataSynced).toMatchSnapshot();
  });

  test('sets up correctly', async () => {
    await act(async () => {
      const waitDurationMs = 2000;
      await new Promise(resolve => setTimeout(resolve, waitDurationMs));
    });
    const { container: mountWithDataSynced } = render(
      <Provider store={getStore()}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: {} as any,
            widthPx: 100,
            heightPx: 100
          }}
        >
          <SignalDetectionsTable
            signalDetectionResults={sdQueryResult}
            columnsToDisplay={signalDetectionsColumnsToDisplay}
            isSynced
            data={rowData}
            setPhaseMenuVisibility={jest.fn()}
            stationsGroupsByNamesQuery={stationGroupQuery}
          />
        </BaseDisplayContext.Provider>
      </Provider>
    );

    expect(mountWithDataSynced).toBeDefined();
  });

  describe('non-ideal state', () => {
    const SDQueryResultNoData: SignalDetectionFetchResult = {
      data: [],
      isLoading: false,
      pending: 0,
      isError: false,
      fulfilled: 0,
      rejected: 0
    };

    const SDQueryResultNoDataLoadingPending: SignalDetectionFetchResult = {
      data: [],
      isLoading: true,
      pending: 5,
      isError: false,
      fulfilled: 0,
      rejected: 0
    };

    const SDQueryResultNoDataLoading: SignalDetectionFetchResult = {
      data: [],
      isLoading: true,
      pending: 0,
      isError: false,
      fulfilled: 0,
      rejected: 0
    };
    const SDQueryResultError: SignalDetectionFetchResult = {
      data: [],
      isLoading: false,
      pending: 0,
      isError: true,
      fulfilled: 0,
      rejected: 0
    };

    const { container: SDQueryResultNoDataLoadingPendingWrapper } = render(
      <Provider store={getStore()}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: {} as any,
            widthPx: 100,
            heightPx: 100
          }}
        >
          <SignalDetectionsTable
            signalDetectionResults={SDQueryResultNoDataLoadingPending}
            columnsToDisplay={signalDetectionsColumnsToDisplay}
            isSynced={false}
            data={rowData}
            setPhaseMenuVisibility={jest.fn()}
            stationsGroupsByNamesQuery={stationGroupQuery}
          />
        </BaseDisplayContext.Provider>
      </Provider>
    );
    const { container: SDQueryResultNoDataLoadingWrapper } = render(
      <Provider store={getStore()}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: {} as any,
            widthPx: 100,
            heightPx: 100
          }}
        >
          <SignalDetectionsTable
            signalDetectionResults={SDQueryResultNoDataLoading}
            columnsToDisplay={signalDetectionsColumnsToDisplay}
            isSynced={false}
            data={rowData}
            setPhaseMenuVisibility={jest.fn()}
            stationsGroupsByNamesQuery={stationGroupQuery}
          />
        </BaseDisplayContext.Provider>
      </Provider>
    );
    const { container: SDQueryResultErrorWrapper } = render(
      <Provider store={getStore()}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: {} as any,
            widthPx: 100,
            heightPx: 100
          }}
        >
          <SignalDetectionsTable
            signalDetectionResults={SDQueryResultError}
            columnsToDisplay={signalDetectionsColumnsToDisplay}
            isSynced={false}
            data={rowData}
            setPhaseMenuVisibility={jest.fn()}
            stationsGroupsByNamesQuery={stationGroupQuery}
          />
        </BaseDisplayContext.Provider>
      </Provider>
    );

    const { container: noDataUnsyncedWrapper } = render(
      <Provider store={getStore()}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: {} as any,
            widthPx: 100,
            heightPx: 100
          }}
        >
          <SignalDetectionsTable
            signalDetectionResults={SDQueryResultNoData}
            columnsToDisplay={signalDetectionsColumnsToDisplay}
            isSynced={false}
            data={rowData}
            setPhaseMenuVisibility={jest.fn()}
            stationsGroupsByNamesQuery={stationGroupQuery}
          />
        </BaseDisplayContext.Provider>
      </Provider>
    );
    const { container: noDataSyncedWrapper } = render(
      <Provider store={getStore()}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: {} as any,
            widthPx: 100,
            heightPx: 100
          }}
        >
          <SignalDetectionsTable
            signalDetectionResults={SDQueryResultNoData}
            columnsToDisplay={signalDetectionsColumnsToDisplay}
            isSynced
            data={rowData}
            setPhaseMenuVisibility={jest.fn()}
            stationsGroupsByNamesQuery={stationGroupQuery}
          />
        </BaseDisplayContext.Provider>
      </Provider>
    );
    test('no data Synced', () => {
      expect(noDataSyncedWrapper).toMatchSnapshot();
    });
    test('no data UNSynced', () => {
      expect(noDataUnsyncedWrapper).toMatchSnapshot();
    });
    test('no data loading and pending', () => {
      expect(SDQueryResultNoDataLoadingPendingWrapper).toMatchSnapshot();
    });

    test('no data loading not pending', () => {
      expect(SDQueryResultNoDataLoadingWrapper).toMatchSnapshot();
    });
    test('no data error', () => {
      expect(SDQueryResultErrorWrapper).toMatchSnapshot();
    });
  });

  it('onRowDoubleClicked is defined and can be called with mocked data', () => {
    render(
      <Provider store={getStore()}>
        <SignalDetectionsTable
          signalDetectionResults={sdQueryResult}
          columnsToDisplay={signalDetectionsColumnsToDisplay}
          isSynced={false}
          data={rowData}
          setPhaseMenuVisibility={jest.fn()}
          stationsGroupsByNamesQuery={stationGroupQuery}
        />
      </Provider>
    );
    expect(onCellDoubleClicked).toBeDefined();
    const params: any = {
      signalDetectionResults: sdQueryResult,
      eventStatusQuery,
      currentOpenEvent: eventData,
      currentOpenEventId: eventData.id,
      currentOpenInterval: currentIntervalMock,
      associateSignalDetectionFn: jest.fn(),
      unassociateSignalDetectionFn: jest.fn(),
      event: {
        data: {
          id: signalDetectionsData[0].id
        },
        colDef: {
          editable: true
        },
        newValue: 1.11
      } as Partial<CellClickedEvent>
    };

    // Double click on cells timeStandardDeviation or time does not call associate/unassociate
    expect(() => onCellDoubleClicked(params)).not.toThrow();
    expect(params.associateSignalDetectionFn).not.toHaveBeenCalled();
    expect(params.unassociateSignalDetectionFn).not.toHaveBeenCalled();

    // Double click on any other cells calls unassociate
    params.event.colDef.editable = false;
    expect(() => onCellDoubleClicked(params)).not.toThrow();
    expect(params.associateSignalDetectionFn).not.toHaveBeenCalled();
    expect(params.unassociateSignalDetectionFn).toHaveBeenCalledTimes(1);
    params.unassociateSignalDetectionFn.mockClear();

    // Double click on any other cells calls associate
    params.currentOpenEventId = eventData2.id;
    expect(() => onCellDoubleClicked(params)).not.toThrow();
    expect(params.associateSignalDetectionFn).toHaveBeenCalledTimes(1);
    expect(params.unassociateSignalDetectionFn).not.toHaveBeenCalled();

    // Can handle null currentOpenEventId
    params.currentOpenEventId = null;
    params.associateSignalDetectionFn.mockClear();
    expect(() => onCellDoubleClicked(params)).not.toThrow();
    expect(params.associateSignalDetectionFn).not.toHaveBeenCalled();
    expect(params.unassociateSignalDetectionFn).not.toHaveBeenCalled();
  });
});

// TODO: revise this test as validation for SD list improves
it('onCellEditCallback is defined and can be called with mocked data', () => {
  expect(onCellEditCallback).toBeDefined();

  // Test uncertainty first
  const mockToasterWarn = jest.spyOn(toastify.toast, 'warn');
  const cellEditParams: CellEditParams = {
    updateSignalDetectionArrivalTime: jest.fn(),
    viewableInterval: {
      startTimeSecs: 1636502400,
      endTimeSecs: 1636504200
    },
    signalDetectionResults: sdQueryResult,
    event: {
      data: {
        id: signalDetectionsData[0].id
      },
      colDef: {
        field: SignalDetectionColumn.timeStandardDeviation
      },
      newValue: 0.001
    } as CellEditRequestEvent
  };
  expect(() => onCellEditCallback(cellEditParams)).not.toThrow();
  expect(cellEditParams.updateSignalDetectionArrivalTime).toHaveBeenCalledTimes(1);
  // Give it a bogus value
  (cellEditParams.updateSignalDetectionArrivalTime as jest.Mock).mockClear();
  cellEditParams.event.newValue = '1.3foo';
  expect(() => onCellEditCallback(cellEditParams)).not.toThrow();
  expect(mockToasterWarn).toHaveBeenCalledTimes(2);
  expect(cellEditParams.updateSignalDetectionArrivalTime).not.toHaveBeenCalled();

  // Now try changing the arrival time
  (cellEditParams.updateSignalDetectionArrivalTime as jest.Mock).mockClear();
  cellEditParams.event.colDef.field = SignalDetectionColumn.time;
  cellEditParams.event.newValue = '2023-04-26 01:00:00.000';
  expect(() => onCellEditCallback(cellEditParams)).not.toThrow();
  expect(cellEditParams.updateSignalDetectionArrivalTime).toHaveBeenCalledTimes(0);

  // Give it a bad time string
  (cellEditParams.updateSignalDetectionArrivalTime as jest.Mock).mockClear();
  cellEditParams.event.newValue = 'FOO_TIME';
  expect(() => onCellEditCallback(cellEditParams)).not.toThrow();
  expect(cellEditParams.updateSignalDetectionArrivalTime).not.toHaveBeenCalled();

  // Give it a value outside the viewable interval
  (cellEditParams.updateSignalDetectionArrivalTime as jest.Mock).mockClear();
  mockToasterWarn.mockClear();
  cellEditParams.event.newValue = '2023-04-26 02:00:00.000';
  expect(() => onCellEditCallback(cellEditParams)).not.toThrow();
  expect(mockToasterWarn).toHaveBeenCalledTimes(1);
  expect(cellEditParams.updateSignalDetectionArrivalTime).not.toHaveBeenCalled();
});

describe('signal detections memo check', () => {
  const prevProps: SignalDetectionsTableProps = {
    isSynced: false,
    signalDetectionResults: sdQueryResult,
    data: rowData,
    columnsToDisplay: signalDetectionsColumnsToDisplay,
    setPhaseMenuVisibility: jest.fn(),
    stationsGroupsByNamesQuery: stationGroupQuery
  };
  it('is defined', () => {
    const newProps = cloneDeep(prevProps);
    expect(sdPanelMemoCheck(prevProps, newProps)).toBeDefined();
  });
  it('isError has changed', () => {
    expect(
      sdPanelMemoCheck(prevProps, {
        isSynced: false,
        signalDetectionResults: {
          data: signalDetectionsData,
          isLoading: false,
          pending: 0,
          isError: true,
          fulfilled: 0,
          rejected: 0
        },
        data: rowData,
        columnsToDisplay: signalDetectionsColumnsToDisplay,
        setPhaseMenuVisibility: jest.fn(),
        stationsGroupsByNamesQuery: stationGroupQuery
      })
    ).toBeFalsy();
  });

  it('isLoading has changed', () => {
    expect(
      sdPanelMemoCheck(prevProps, {
        isSynced: false,
        signalDetectionResults: {
          data: signalDetectionsData,
          isLoading: true,
          pending: 0,
          isError: false,
          fulfilled: 0,
          rejected: 0
        },
        data: rowData,
        columnsToDisplay: signalDetectionsColumnsToDisplay,
        setPhaseMenuVisibility: jest.fn(),
        stationsGroupsByNamesQuery: stationGroupQuery
      })
    ).toBeFalsy();
  });
  //
  it('pending has changed', () => {
    expect(
      sdPanelMemoCheck(prevProps, {
        isSynced: false,
        signalDetectionResults: {
          data: signalDetectionsData,
          isLoading: false,
          pending: 1,
          isError: false,
          fulfilled: 0,
          rejected: 0
        },
        data: rowData,
        columnsToDisplay: signalDetectionsColumnsToDisplay,
        setPhaseMenuVisibility: jest.fn(),
        stationsGroupsByNamesQuery: stationGroupQuery
      })
    ).toBeFalsy();
  });
  it('query data length has changed', () => {
    expect(
      sdPanelMemoCheck(prevProps, {
        isSynced: false,
        signalDetectionResults: {
          data: [],
          isLoading: false,
          pending: 0,
          isError: false,
          fulfilled: 0,
          rejected: 0
        },
        data: rowData,
        columnsToDisplay: signalDetectionsColumnsToDisplay,
        setPhaseMenuVisibility: jest.fn(),
        stationsGroupsByNamesQuery: stationGroupQuery
      })
    ).toBeFalsy();
  });
  it('rowData has changed', () => {
    expect(
      sdPanelMemoCheck(prevProps, {
        isSynced: false,
        signalDetectionResults: sdQueryResult,
        data: [] as SignalDetectionRow[],
        columnsToDisplay: signalDetectionsColumnsToDisplay,
        setPhaseMenuVisibility: jest.fn(),
        stationsGroupsByNamesQuery: stationGroupQuery
      })
    ).toBeFalsy();
  });
  it('synced state has changed', () => {
    expect(
      sdPanelMemoCheck(prevProps, {
        isSynced: true,
        signalDetectionResults: sdQueryResult,
        data: rowData,
        columnsToDisplay: signalDetectionsColumnsToDisplay,
        setPhaseMenuVisibility: jest.fn(),
        stationsGroupsByNamesQuery: stationGroupQuery
      })
    ).toBeFalsy();
  });
  it('columnsToDisplay has changed', () => {
    expect(
      sdPanelMemoCheck(prevProps, {
        isSynced: false,
        signalDetectionResults: sdQueryResult,
        data: rowData,
        columnsToDisplay: {} as Immutable.Map<SignalDetectionColumn, boolean>,
        setPhaseMenuVisibility: jest.fn(),
        stationsGroupsByNamesQuery: stationGroupQuery
      })
    ).toBeFalsy();
  });
});
