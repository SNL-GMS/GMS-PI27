/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { ConfigurationTypes } from '@gms/common-model';
import { StationTypes } from '@gms/common-model';
import React from 'react';
import { Provider } from 'react-redux';
import { create } from 'react-test-renderer';

import { useGetAllStationsQuery } from '../../../src/ts/app/hooks/station-definition-hooks';
import { getStore } from '../../../src/ts/app/store';

const defaultMockStationGroup: StationTypes.StationGroup[] = [
  {
    description: 'test group',
    effectiveAt: 123,
    effectiveUntil: 456,
    name: 'test group name',
    stations: [
      {
        name: 'station name',
        description: 'station description',
        type: StationTypes.StationType.HYDROACOUSTIC,
        effectiveAt: 123,
        effectiveUntil: 456,
        relativePositionsByChannel: {},
        location: { depthKm: 3, elevationKm: 3, latitudeDegrees: 1, longitudeDegrees: 3 },
        allRawChannels: [],
        channelGroups: []
      }
    ]
  }
];

const defaultMockStation: StationTypes.Station[] = [
  {
    name: 'station name',
    description: 'station description',
    type: StationTypes.StationType.HYDROACOUSTIC,
    effectiveAt: 123,
    effectiveUntil: 456,
    relativePositionsByChannel: {},
    location: { depthKm: 3, elevationKm: 3, latitudeDegrees: 1, longitudeDegrees: 3 },
    allRawChannels: [],
    channelGroups: []
  }
];

const defaultMockAnalystConfiguration: Partial<ConfigurationTypes.ProcessingAnalystConfiguration> =
  {
    defaultInteractiveAnalysisStationGroup: 'test'
  };

const defaultMockStationGroupNamesConfiguration: Partial<ConfigurationTypes.StationGroupNamesConfiguration> =
  {
    stationGroupNames: ['test']
  };

let mockStationGroup = defaultMockStationGroup;
let mockStation = defaultMockStation;
let mockAnalystConfiguration = defaultMockAnalystConfiguration;
let mockStationGroupNamesConfiguration = defaultMockStationGroupNamesConfiguration;

jest.mock(
  '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );
    return {
      ...actual,
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        data: mockAnalystConfiguration
      })),
      useGetProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
        data: mockStationGroupNamesConfiguration
      }))
    };
  }
);

jest.mock('../../../src/ts/app/api/station-definition/station-definition-api-slice', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/api/station-definition/station-definition-api-slice'
  );
  return {
    ...actual,
    useGetStationGroupsByNamesQuery: jest.fn(() => ({
      data: mockStationGroup
    })),
    useGetStationsQuery: jest.fn(() => ({
      data: mockStation
    })),
    useGetStationsWithChannelsQuery: jest.fn(() => ({
      data: mockStation
    }))
  };
});

describe('station definition hooks', () => {
  it('exists', () => {
    expect(useGetAllStationsQuery).toBeDefined();
  });

  it('can use get all stations query', () => {
    mockStationGroup = defaultMockStationGroup;
    mockStation = defaultMockStation;
    mockAnalystConfiguration = defaultMockAnalystConfiguration;
    mockStationGroupNamesConfiguration = defaultMockStationGroupNamesConfiguration;

    const store = getStore();

    function Component() {
      const result = useGetAllStationsQuery(123456789);
      return <div>{JSON.stringify(result.data)}</div>;
    }

    expect(
      create(
        <Provider store={store}>
          <Component />
        </Provider>
      ).toJSON()
    ).toMatchSnapshot();
  });
});
