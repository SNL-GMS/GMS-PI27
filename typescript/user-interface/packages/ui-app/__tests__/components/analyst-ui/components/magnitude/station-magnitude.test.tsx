import { LegacyEventTypes } from '@gms/common-model';
import { render } from '@testing-library/react';
import React from 'react';

import { StationMagnitude } from '../../../../../src/ts/components/analyst-ui/components/magnitude/components/station-magnitude/station-magnitude-component';
import type {
  StationMagnitudeProps,
  StationMagnitudeSdData
} from '../../../../../src/ts/components/analyst-ui/components/magnitude/components/station-magnitude/types';
import { testMagTypes } from '../../../../__data__/test-util-data';
// Mock console.warn to remove warns from the test log
console.warn = jest.fn();

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

const locationSolution: LegacyEventTypes.LocationSolution = {
  id: '123',
  locationType: 'type',
  locationToStationDistances: [
    {
      azimuth: 1,
      distance: {
        degrees: 1,
        km: 2
      },
      stationId: '1'
    }
  ],
  location: {
    latitudeDegrees: 1,
    longitudeDegrees: 1,
    depthKm: 1,
    time: 1
  },
  featurePredictions: undefined,
  locationRestraint: undefined,
  locationBehaviors: undefined,
  networkMagnitudeSolutions: [
    {
      uncertainty: 1,
      magnitudeType: LegacyEventTypes.MagnitudeType.MB,
      magnitude: 1,
      networkMagnitudeBehaviors: []
    },
    {
      uncertainty: 1,
      magnitudeType: LegacyEventTypes.MagnitudeType.MS,
      magnitude: 1,
      networkMagnitudeBehaviors: []
    },
    {
      uncertainty: 1,
      magnitudeType: LegacyEventTypes.MagnitudeType.MBMLE,
      magnitude: 1,
      networkMagnitudeBehaviors: []
    },
    {
      uncertainty: 1,
      magnitudeType: LegacyEventTypes.MagnitudeType.MSMLE,
      magnitude: 1,
      networkMagnitudeBehaviors: []
    }
  ],
  snapshots: undefined
};

describe('when loading station Magnitude', () => {
  const validSignalDetectionForMagnitude = new Map<any, boolean>([
    [LegacyEventTypes.MagnitudeType.MB, true]
  ]);
  const magTypeToAmplitudeMap = new Map<any, StationMagnitudeSdData>([
    [
      LegacyEventTypes.MagnitudeType.MB,
      {
        channel: 'bar',
        phase: 'P',
        amplitudeValue: 1,
        amplitudePeriod: 1,
        signalDetectionId: '1',
        time: 1,
        stationName: '1',
        flagForReview: false
      }
    ]
  ]);

  const props: StationMagnitudeProps = {
    checkBoxCallback: jest.fn(),
    setSelectedSdIds: jest.fn(),
    selectedSdIds: ['123'],
    historicalMode: false,
    locationSolution,
    computeNetworkMagnitudeSolution: undefined,
    displayedMagnitudeTypes: testMagTypes,
    amplitudesByStation: [
      {
        stationName: 'foo',
        validSignalDetectionForMagnitude,
        magTypeToAmplitudeMap
      }
    ],
    openEventId: '1'
  };
  it('Network station magnitude table is defined', () => {
    expect(StationMagnitude).toBeDefined();
  });
  it('Network station magnitude table renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<StationMagnitude {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('Network station magnitude table rerenders when given a new open event', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const result = render(<StationMagnitude {...props} />);
    const { innerHTML } = result.container;
    const updatedProps = { ...props, openEventId: 'xyz' } as StationMagnitudeProps;
    // eslint-disable-next-line react/jsx-props-no-spreading
    result.rerender(<StationMagnitude {...updatedProps} />);
    expect(result.container.innerHTML).not.toEqual(innerHTML);
  });
});
