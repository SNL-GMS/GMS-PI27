/* eslint-disable react/jsx-props-no-spreading */
import type { CommonTypes } from '@gms/common-model';
import { WorkflowTypes } from '@gms/common-model';
import {
  eventData,
  processingAnalystConfigurationData,
  qcSegment
} from '@gms/common-model/__tests__/__data__';
import { toEpochSeconds } from '@gms/common-util';
import {
  AnalystWorkspaceOperations,
  AnalystWorkspaceTypes,
  defaultTheme,
  getStore,
  setOpenInterval
} from '@gms/ui-state';
import type { WeavessTypes } from '@gms/weavess-core';
import { WeavessConfiguration, WeavessConstants } from '@gms/weavess-core';
import type { Queries, RenderResult } from '@testing-library/react';
import { act, render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import type { SignalDetectionHandlers } from '~analyst-ui/common/hooks/signal-detection-hooks';
import { WeavessDisplayPanel } from '~analyst-ui/components/waveform/weavess-display/weavess-display-panel';

import { AmplitudeScalingOptions } from '../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls/scaling-options';
import { WeavessContext } from '../../../../../../src/ts/components/analyst-ui/components/waveform/weavess-context';
import type {
  WeavessDisplayPanelProps,
  WeavessDisplayProps
} from '../../../../../../src/ts/components/analyst-ui/components/waveform/weavess-display/types';
import { BaseDisplayContext } from '../../../../../../src/ts/components/common-ui/components/base-display';

// Mock console.warn to remove warns from the test log
console.warn = jest.fn();
console.error = jest.fn();

jest.mock('worker-rpc', () => ({
  RpcProvider: jest.fn().mockImplementation(() => {
    const mockRpc = jest.fn(async () => {
      return new Promise(resolve => {
        resolve([]);
      });
    });
    return { rpc: mockRpc };
  })
}));

jest.mock('@gms/ui-state', () => {
  const actualImport = jest.requireActual('@gms/ui-state');
  return {
    ...actualImport,
    getBoundaries: jest.fn(() => ({
      topMax: 100,
      bottomMax: -100,
      channelAvg: 0,
      offset: 100,
      channelSegmentId: 'TEST',
      samplesCount: 100
    }))
  };
});

const mockShowContextMenu = jest.fn();
const mockHideContextMenu = jest.fn();

jest.mock('@blueprintjs/core', () => {
  const actual = jest.requireActual('@blueprintjs/core');
  return {
    ...actual,
    showContextMenu: () => {
      mockShowContextMenu();
    },
    hideContextMenu: () => {
      mockHideContextMenu();
    }
  };
});

const configuration: WeavessTypes.Configuration = {
  ...WeavessConfiguration.defaultConfiguration,
  defaultChannel: {
    disableMeasureWindow: true,
    disableMaskModification: true
  },
  nonDefaultChannel: {
    disableMeasureWindow: true,
    disableMaskModification: false
  },
  hotKeys: {
    createSignalDetectionWithCurrentPhase:
      processingAnalystConfigurationData.keyboardShortcuts.clickEvents
        .createSignalDetectionWithCurrentPhase,
    createSignalDetectionWithDefaultPhase:
      processingAnalystConfigurationData.keyboardShortcuts.clickEvents
        .createSignalDetectionWithDefaultPhase
  }
};
const startTimeSecs = toEpochSeconds('2010-05-20T22:00:00.000Z');
const endTimeSecs = toEpochSeconds('2010-05-20T23:59:59.000Z');
const viewableInterval = {
  startTimeSecs,
  endTimeSecs
};

let updateMockSdIds;
const mockSetSelectedSdIds = jest.fn((selectedIds: string[]) => {
  updateMockSdIds(selectedIds);
});

// Add a mock function to set selectedStationIds for testing
let updateMockStationIds;
const mockSetSelectedStationIds = jest.fn((selectedIds: string[]) => {
  updateMockStationIds(selectedIds);
});

const mockAssociateSignalDetections = jest.fn();
const mockUnassociateSignalDetections = jest.fn();

const timeRange: CommonTypes.TimeRange = {
  startTimeSecs,
  endTimeSecs
};

const weavessEvents: WeavessTypes.Events = {
  ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS,
  stationEvents: {
    ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents,
    defaultChannelEvents: {
      ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.defaultChannelEvents,
      events: {
        ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.defaultChannelEvents?.events,
        onMeasureWindowUpdated: jest.fn()
      }
    },
    nonDefaultChannelEvents: {
      ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.nonDefaultChannelEvents,
      events: {
        ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.nonDefaultChannelEvents
          ?.events,
        onMeasureWindowUpdated: jest.fn()
      }
    }
  }
};

const signalDetectionHandlers: SignalDetectionHandlers = {
  signalDetectionDoubleClickHandler: jest.fn(),
  signalDetectionClickHandler: jest.fn(),
  onSignalDetectionContextMenuHandler: jest.fn(),
  onSignalDetectionDragEndHandler: jest.fn()
};
const mockCreateSignalDetection = jest.fn(async () => Promise.resolve());
const mockUpdateSelectedWaveforms = jest.fn(async () => Promise.resolve());
const openIntervalName = 'AL1';
const weavessProps: WeavessDisplayPanelProps = {
  openIntervalName,
  weavessProps: {
    activeSplitModeType: undefined,
    viewableInterval,
    displayInterval: viewableInterval,
    showMeasureWindow: false,
    stations: [],
    events: weavessEvents,
    measureWindowSelection: {
      channel: undefined,
      endTimeSecs: undefined,
      isDefaultChannel: undefined,
      startTimeSecs: undefined,
      stationId: undefined,
      waveformAmplitudeScaleFactor: undefined
    } as WeavessTypes.MeasureWindowSelection,
    initialConfiguration: configuration,
    flex: false
  },
  defaultStations: [],
  events: [eventData],
  signalDetections: [],
  measurementMode: {
    mode: AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT,
    entries: undefined
  } as AnalystWorkspaceTypes.MeasurementMode,
  currentPhase: 'PnP',
  defaultSignalDetectionPhase: 'P',
  setMeasurementModeEntries: AnalystWorkspaceOperations.setMeasurementModeEntries,
  analysisMode: undefined,
  createSignalDetection: mockCreateSignalDetection,
  showCreateSignalDetectionPhaseSelector: jest.fn(),
  currentOpenEventId: eventData.id,
  currentTimeInterval: timeRange,
  sdIdsToShowFk: [],
  selectedSdIds: [],
  signalDetectionActionTargets: [],
  selectedStationIds: [],
  setSdIdsToShowFk: jest.fn(),
  setSelectedSdIds: mockSetSelectedSdIds,
  setSelectedStationIds: mockSetSelectedStationIds,
  amplitudeScaleOption: AmplitudeScalingOptions.FIXED,
  fixedScaleVal: 26,
  eventStatuses: {},
  uiTheme: defaultTheme,
  qcSegmentsByChannelName: {
    'AAK.AAK.BHZ': {
      id: qcSegment
    }
  },
  processingMasks: [],
  maskVisibility: {},
  associateSignalDetections: mockAssociateSignalDetections,
  unassociateSignalDetections: mockUnassociateSignalDetections,
  phaseMenuVisibility: false,
  setSignalDetectionActionTargets: jest.fn(),
  setViewportVisibleStations: jest.fn(),
  channelFilters: {},
  updateSelectedWaveforms: mockUpdateSelectedWaveforms,
  activeSplitModeType: undefined,
  isSplitChannelOverlayOpen: false,
  closeSplitChannelOverlayCallback: jest.fn(),
  signalDetectionHandlers
};

let weavessRef: any = {
  waveformPanelRef: {
    stationComponentRefs: {
      values: () => [
        {
          props: { station: { name: 'AAK.BHZ' }, nonDefaultChannels: ['AAK.AAK.BHZ'] },
          state: {}
        },
        {
          props: { station: { name: 'AFI.BHZ', nonDefaultChannels: ['AFI.AFI.BHZ'] } },
          state: { expanded: true }
        }
      ]
    },
    getOrderedVisibleChannelNames: jest.fn(() => {
      return ['AAK.BHZ', 'AAK.AAK.BHZ', 'AFI.BHZ', 'AFI.AFI.BHZ'];
    }),
    getCurrentZoomInterval: jest.fn(() => ({ startTimeSecs: 0, endTimeSecs: 1000 }))
  },
  toggleMeasureWindowVisibility: jest.fn(),
  zoomToTimeWindow: jest.fn(),
  refresh: jest.fn()
};

const buildDisplayComponent = async (props: WeavessDisplayProps) => {
  const store = getStore();
  store.dispatch(
    setOpenInterval(timeRange, undefined, undefined, [], WorkflowTypes.AnalysisMode.SCAN) as any
  );
  let renderResult: RenderResult<Queries, HTMLElement, HTMLElement>;
  await act(async () => {
    // wait for all the state calls to come back
    // eslint-disable-next-line @typescript-eslint/await-thenable
    renderResult = await render(<WeavessDisplayPanel {...props} />, {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <BaseDisplayContext.Provider
            value={{
              glContainer: undefined,
              widthPx: 1920,
              heightPx: 1080
            }}
          >
            <WeavessContext.Provider
              value={{
                weavessRef,
                setWeavessRef: ref => {
                  weavessRef = ref;
                }
              }}
            >
              {children}
            </WeavessContext.Provider>
          </BaseDisplayContext.Provider>
        </Provider>
      )
    });
  });
  return renderResult;
};
describe('weavess display', () => {
  test('shows a none ideal state when rendered without station data', async () => {
    const renderResult = await buildDisplayComponent(weavessProps);
    expect(renderResult).toMatchSnapshot();
  });

  test('renders a display non ideal state with `No Waveform Data` when station data is applied to props but no waveform data', async () => {
    const updatedWeavessProps = {
      ...weavessProps,
      defaultStations: [
        {
          name: 'AAK.BHZ',
          allRawChannels: [{ name: 'AAK.BHZ' }, { name: 'AAK.AAK.BHZ' }]
        }
      ] as any
    };
    const renderResult = await buildDisplayComponent(updatedWeavessProps);
    expect(renderResult).toMatchSnapshot();
  });

  test('renders a display given default stations and weavess stations', async () => {
    const updatedWeavessProps = {
      ...weavessProps,
      defaultStations: [
        {
          name: 'AAK.BHZ',
          allRawChannels: [{ name: 'AAK.BHZ' }, { name: 'AAK.AAK.BHZ' }]
        }
      ] as any,
      weavessProps: {
        ...weavessProps.weavessProps,
        stations: [
          {
            name: 'AAK.BHZ',
            allRawChannels: [{ name: 'AAK.BHZ' }, { name: 'AAK.AAK.BHZ' }]
          }
        ] as any
      }
    };
    const renderResult = await buildDisplayComponent(updatedWeavessProps);
    expect(renderResult).toMatchSnapshot();
  });
});
