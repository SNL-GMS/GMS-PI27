import type { CommonTypes } from '@gms/common-model';
import { EventTypes } from '@gms/common-model';
import {
  defaultStations,
  eventData,
  locationSolution,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type GoldenLayout from '@gms/golden-layout';
import type {
  AnalystWorkspaceTypes,
  ChannelSegmentFetchResult,
  EventsFetchResult,
  UseQueryStateResult
} from '@gms/ui-state';
import { defaultSpectraTemplate, uiChannelSegmentRecord } from '@gms/ui-state/__tests__/__data__';
import type { Point } from '@gms/ui-util';
import cloneDeep from 'lodash/cloneDeep';
import uniq from 'lodash/uniq';

import type { AzimuthSlownessProps } from '../../src/ts/components/analyst-ui/components/azimuth-slowness/types';

// 11:59:59 05/19/2010
export const startTimeSeconds = 1274313599;

// 02:00:01 05/20/2010
export const endTimeSeconds = 1274320801;

// time block 2 hours = 7200 seconds
export const timeBlock = 7200;

export const timeInterval: CommonTypes.TimeRange = {
  startTimeSecs: startTimeSeconds,
  endTimeSecs: endTimeSeconds
};

export const currentProcStageIntId = '3';

export const analystCurrentFk: Point = {
  x: 10,
  y: 11
};

const sdIdsFullMap: string[] = signalDetectionsData.map(sd => sd.id);

export const signalDetectionsIds = uniq(sdIdsFullMap);
export const eventId = eventData.id;

export const selectedSignalDetectionID = signalDetectionsIds[0];
export const testMagTypes: AnalystWorkspaceTypes.DisplayedMagnitudeTypes = {};
testMagTypes[EventTypes.MagnitudeType.MB] = true;
testMagTypes[EventTypes.MagnitudeType.MB_MLE] = true;
testMagTypes[EventTypes.MagnitudeType.MS] = true;
testMagTypes[EventTypes.MagnitudeType.MS_MLE] = true;

export const useQueryStateResult: UseQueryStateResult<any> = {
  isError: false,
  isFetching: false,
  isLoading: false,
  isSuccess: true,
  isUninitialized: true,
  currentData: undefined,
  data: undefined,
  endpointName: undefined,
  error: undefined,
  fulfilledTimeStamp: undefined,
  originalArgs: undefined,
  requestId: undefined,
  startedTimeStamp: undefined,
  status: undefined
};

export const eventResults: EventsFetchResult = {
  fulfilled: 1,
  isError: true,
  isLoading: false,
  pending: 0,
  rejected: 0,
  data: [eventData]
};

export const channelSegmentResults: ChannelSegmentFetchResult = {
  fulfilled: 1,
  isError: true,
  isLoading: false,
  pending: 0,
  rejected: 0,
  data: uiChannelSegmentRecord
};

const stationsQuery = cloneDeep(useQueryStateResult);
stationsQuery.data = defaultStations;

const eventStatusQuery = cloneDeep(useQueryStateResult);
eventStatusQuery.data = {};

export const location: AnalystWorkspaceTypes.LocationSolutionState = {
  selectedPreferredLocationSolutionId: locationSolution.id,
  selectedLocationSolutionId: locationSolution.id,
  selectedLocationSolutionSetId: 'testSelectedLocationSolutionSetId',
  selectedPreferredLocationSolutionSetId: 'testSelectedPreferredLocationSolutionSetId'
};
const fkSpectraTemplates = {};

export const reviewablePhasesRecord = {};
defaultStations.forEach(station => {
  reviewablePhasesRecord[station.name] = ['P', 'Pg', 'Pn'];
  fkSpectraTemplates[station.name] = {};
  ['P', 'Pg', 'Pn'].forEach(phase => {
    fkSpectraTemplates[station.name][phase] = {
      ...defaultSpectraTemplate,
      phaseType: phase,
      station: {
        name: station.name
      }
    };
  });
});

export const locationToStationDistances: EventTypes.LocationDistance[] = [
  {
    distance: {
      degrees: 10,
      km: 10
    },
    azimuth: 1,
    id: 'ASAR'
  }
];

const glContainer: GoldenLayout.Container = {
  height: 500,
  width: 1000,
  emit: undefined,
  isHidden: false,
  layoutManager: undefined,
  off: jest.fn(),
  on: jest.fn(),
  parent: undefined,
  tab: undefined,
  title: undefined,
  trigger: undefined,
  unbind: undefined,
  setState: jest.fn(),
  extendState: jest.fn(),
  getState: jest.fn(),
  getElement: jest.fn(),
  hide: jest.fn(),
  show: jest.fn(),
  setSize: jest.fn(),
  setTitle: jest.fn(),
  close: jest.fn()
};

export const azSlowProps: AzimuthSlownessProps = {
  glContainer
};
