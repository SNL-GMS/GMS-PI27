/* eslint-disable react/jsx-props-no-spreading */
import type { CommonTypes, StationTypes } from '@gms/common-model';
import { ConfigurationTypes, UserProfileTypes, WorkflowTypes } from '@gms/common-model';
import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import { toEpochSeconds } from '@gms/common-util';
import type { StationGroupsByNamesQuery } from '@gms/ui-state';
import {
  analystActions,
  AnalystWaveformOperations,
  AnalystWorkspaceOperations,
  AnalystWorkspaceTypes,
  commonActions,
  getStore,
  waveformActions
} from '@gms/ui-state';
import { useQueryStateResult } from '@gms/ui-state/__tests__/__data__';
import { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import { act, render } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';
import * as React from 'react';
import { Provider } from 'react-redux';

import type { WaveformComponentProps } from '../../../../../src/ts/components/analyst-ui/components/waveform/types';
import { buildWeavessHotkeys } from '../../../../../src/ts/components/analyst-ui/components/waveform/utils';
import { WaveformComponent } from '../../../../../src/ts/components/analyst-ui/components/waveform/waveform-component';

const currentTimeInterval: CommonTypes.TimeRange = {
  startTimeSecs: toEpochSeconds('2010-05-20T22:00:00.000Z'),
  endTimeSecs: toEpochSeconds('2010-05-20T23:59:59.000Z')
};
const currentStageName = 'AL1';

const operationalTimePeriodConfigurationQuery = cloneDeep(useQueryStateResult);
const operationalTimeRange: CommonTypes.TimeRange = {
  startTimeSecs: 0,
  endTimeSecs: 2000
};
operationalTimePeriodConfigurationQuery.data = operationalTimeRange;

const stationGroupQuery = {
  data: [],
  isError: false
} as unknown as StationGroupsByNamesQuery;

jest.mock('@gms/ui-workers', () => {
  const actual = jest.requireActual('@gms/ui-workers');
  return {
    ...actual,
    axiosBaseQuery: jest.fn(() => async () => Promise.resolve({ data: {} }))
  };
});
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  const mockUserProfile = {
    userId: '1',
    defaultAnalystLayoutName: 'default',
    currentTheme: 'GMS Dark Theme',
    workspaceLayouts: [
      {
        name: 'default',
        layoutConfiguration: 'test',
        supportedUserInterfaceModes: [UserProfileTypes.UserMode.IAN]
      }
    ]
  };
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actual,
    useAppDispatch: mockUseAppDispatch,
    useWorkflowQuery: jest.fn(),
    useStageIntervalsQuery: jest.fn(),
    processingConfigurationApiSlice: jest.fn(() => {
      return {
        endpoints: {
          getOperationalTimePeriodConfiguration: {
            select: () => {
              return [];
            }
          }
        }
      };
    }),
    useGetAllUiThemes: jest.fn(() => [{ name: 'dark' }]),
    useKeyboardShortcutsDisplayVisibility: jest.fn(() => ({ openKeyboardShortcuts: jest.fn() })),
    useUiTheme: jest.fn(() => {
      const currentTheme = {};
      const setUiTheme = jest.fn();
      return [currentTheme, setUiTheme];
    }),
    useGetOperationalTimePeriodConfigurationQuery: jest.fn(
      () => operationalTimePeriodConfigurationQuery
    ),
    getProcessingAnalystConfiguration: jest.fn(() => {
      return { data: mockUserProfile };
    }),
    useGetUserProfileQuery: jest.fn(() => ({ data: mockUserProfile }))
  };
});
jest.mock(
  '../../../../../../ui-state/src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../../../../ui-state/src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );
    return {
      ...actual,
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        ...useQueryStateResult,
        data: processingAnalystConfigurationData
      }))
    };
  }
);

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useKeyboardShortcutConfigurations: jest.fn(
      () => processingAnalystConfigurationData.keyboardShortcuts
    )
  };
});

jest.mock('@gms/ui-core-components', () => {
  const actual = jest.requireActual('@gms/ui-core-components');
  return {
    ...actual,
    WithNonIdealStates: jest.fn(() => {
      return function TestComponent() {
        return <div>Test</div>;
      };
    })
  };
});

const waveformProps: WaveformComponentProps = {
  viewableInterval: {
    startTimeSecs: 1,
    endTimeSecs: 100
  },
  zoomInterval: {
    startTimeSecs: 1,
    endTimeSecs: 100
  },
  currentPhaseMenuVisibility: false,
  currentPhase: 'P',
  phaseHotkeys: [],
  setCurrentPhaseMenuVisibility: jest.fn(),
  setCurrentPhase: jest.fn(),
  loadData: jest.fn(),
  setZoomInterval: jest.fn(),
  setMaximumOffset: jest.fn(),
  maximumOffset: 0,
  setMinimumOffset: jest.fn(),
  minimumOffset: 0,
  baseStationTime: 0,
  currentTimeInterval,
  currentStageName,
  shouldShowTimeUncertainty: true,
  shouldShowPredictedPhases: true,
  featurePredictionQuery: undefined,
  stationsQuery: undefined,
  processingAnalystConfiguration: processingAnalystConfigurationData,
  setMode: AnalystWorkspaceOperations.setMode,
  setSelectedSdIds: analystActions.setSelectedSdIds,
  setDefaultSignalDetectionPhase: analystActions.setDefaultSignalDetectionPhase,
  setSelectedSortType: analystActions.setSelectedSortType,
  setKeyPressActionQueue: commonActions.setKeyPressActionQueue,
  isStationVisible: jest.fn().mockReturnValue(true),
  getVisibleStationsFromStationList: jest
    .fn()
    .mockImplementation((stations: StationTypes.Station[]) => stations),
  setStationVisibility: AnalystWaveformOperations.setStationVisibility,
  setStationExpanded: AnalystWaveformOperations.setStationExpanded,
  setChannelVisibility: AnalystWaveformOperations.setChannelVisibility,
  setBaseStationTime: waveformActions.setBaseStationTime,
  setShouldShowTimeUncertainty: jest.fn(),
  setShouldShowPredictedPhases: jest.fn(),
  showAllChannels: jest.fn(),
  location: {
    selectedLocationSolutionId: '',
    selectedPreferredLocationSolutionId: '',
    selectedPreferredLocationSolutionSetId: '',
    selectedLocationSolutionSetId: ''
  },
  defaultSignalDetectionPhase: 'P',
  currentOpenEventId: '1',
  selectedSdIds: [],
  selectedStationIds: [],
  selectedSortType: AnalystWorkspaceTypes.WaveformSortType.stationNameAZ,
  analysisMode: WorkflowTypes.AnalysisMode.EVENT_REVIEW,
  measurementMode: {
    mode: AnalystWorkspaceTypes.WaveformDisplayMode.DEFAULT,
    entries: undefined
  } as AnalystWorkspaceTypes.MeasurementMode,
  channelFilters: {},
  keyPressActionQueue: {},
  uiTheme: {
    name: 'mockTheme',
    isDarkMode: true,
    colors: ConfigurationTypes.defaultColorTheme,
    display: {
      edgeEventOpacity: 0.5,
      edgeSDOpacity: 0.2,
      predictionSDOpacity: 0.1
    }
  },
  distances: [],
  phaseToAlignOn: undefined,
  alignWaveformsOn: AlignWaveformsOn.TIME,
  setAlignWaveformsOn: jest.fn(),
  setPhaseToAlignOn: jest.fn(),
  waveformClientState: {
    isLoading: false,
    total: 0,
    completed: 0,
    percent: 0,
    description: ''
  },
  signalDetectionPhaseUpdate: jest.fn(),
  weavessHotkeyDefinitions: buildWeavessHotkeys(
    processingAnalystConfigurationData.keyboardShortcuts
  ),
  phaseMenuVisibility: false,
  setPhaseMenuVisibility: jest.fn(),
  setClickedSdId: jest.fn(),
  setSignalDetectionActionTargets: jest.fn(),
  clickedSdId: undefined,
  keyboardShortcuts: { ...processingAnalystConfigurationData.keyboardShortcuts },
  createSignalDetection: jest.fn(),
  showCreateSignalDetectionPhaseSelector: jest.fn(),
  createEventMenuState: { visibility: false },
  setCreateEventMenuState: jest.fn(),
  updateSelectedWaveforms: jest.fn(),
  populatedChannels: [],
  channelHeight: 30,
  setChannelHeight: jest.fn(),
  weavessStations: [],
  rotate: jest.fn(),
  setRotationDialogVisibility: jest.fn(),
  setEventBeamDialogVisibility: jest.fn(),
  splitStation: {
    activeSplitModeType: undefined,
    stationId: undefined,
    timeSecs: -1,
    phase: undefined
  },
  setSplitStation: jest.fn(),
  createPreconfiguredEventBeams: jest.fn(),
  beamformingTemplates: undefined,
  updateWaveformAlignment: jest.fn(),
  stationsGroupsByNamesQuery: stationGroupQuery
};

describe('Waveform Component', () => {
  test.skip('Can mount waveform component', async () => {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    jest.setTimeout(30000);
    let result = null;
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable
      result = await render(<WaveformComponent {...waveformProps} />, {
        wrapper: ({ children }) => <Provider store={getStore()}>{children}</Provider>
      });
    });
    expect(result.container.innerHTML).toMatchSnapshot();
  });
});
