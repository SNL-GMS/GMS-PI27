import { FkTypes, SignalDetectionTypes } from '@gms/common-model';
import {
  defaultStations,
  featurePredictionsASAR,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type { AppState } from '@gms/ui-state';
import { FkQueryStatus, FkThumbnailsFilterType, getStore } from '@gms/ui-state';
import { getTestFkData, getTestFkFrequencyThumbnailRecord } from '@gms/ui-state/__tests__/__data__';
import { testFilterList } from '@gms/ui-state/__tests__/filter-list-data';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { render } from '@testing-library/react';
import produce from 'immer';
import React from 'react';
import { Provider } from 'react-redux';

import type { FkDisplayProps } from '~analyst-ui/components/azimuth-slowness/components/fk-display/fk-display';
import { WeavessContext } from '~analyst-ui/components/waveform/weavess-context';

import { FkDisplay } from '../../../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-display';
import { processingAnalystConfigurationQuery } from '../../../workflow/processing-analyst-configuration';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useAllStations: jest.fn(() => defaultStations),
    useGetFkQueryStatus: jest.fn().mockReturnValue(() => FkQueryStatus.SUCCESS),
    useGetAllStationsQuery: jest.fn(() => ({
      status: 'fulfilled',
      isUninitialized: false,
      isSuccess: true,
      data: defaultStations
    })),
    useGetSignalDetections: jest.fn(() => ({
      data: signalDetectionsData,
      isLoading: false
    })),
    useGetProcessingAnalystConfigurationQuery: jest.fn(() => processingAnalystConfigurationQuery),
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state = produce(appState, draft => {
        draft.data.fkFrequencyThumbnails = getTestFkFrequencyThumbnailRecord(signalDetectionsData);
        draft.app.fks.currentFkThumbnailFilter = FkThumbnailsFilterType.KEYACTIVITYPHASES;
        draft.app.workflow.openActivityNames = ['AL1 Event Review'];
      });
      return stateFunc(state);
    }),
    useSelectedFilterList: jest.fn(() => testFilterList),
    useViewableInterval: () => [{ startTimeSecs: 0, endTimeSecs: 1000 }, jest.fn()]
  };
});

jest.mock('~analyst-ui/components/azimuth-slowness/components/fk-util', () => {
  const actual = jest.requireActual('~analyst-ui/components/azimuth-slowness/components/fk-util');
  return {
    ...actual,
    determineArrivalTimeSpectrumIndex: jest.fn(() => 0)
  };
});

const mockResetAmplitudes = jest.fn();

const arrivalTimeFmValue = SignalDetectionTypes.Util.findArrivalTimeFeatureMeasurementValue(
  SignalDetectionTypes.Util.getCurrentHypothesis(signalDetectionsData[0].signalDetectionHypotheses)
    .featureMeasurements
);

const fkDisplayProps: FkDisplayProps = {
  displayedSignalDetection: signalDetectionsData[0],
  featurePredictionsForDisplayedSignalDetection: featurePredictionsASAR,
  fkDisplayWidthPx: 100,
  selectedFkUnit: FkTypes.FkUnits.FSTAT,
  currentMovieSpectrumIndex: 0,
  displayedFk: getTestFkData(arrivalTimeFmValue.arrivalTime.value),
  colorMap: 'turbo',
  setCurrentMovieSpectrumIndex: jest.fn(),
  setSelectedFkUnit: jest.fn(),
  setPhaseMenuVisibility: jest.fn()
};
describe('FkDisplay', () => {
  it('FkDisplay renders & matches snapshot', () => {
    const { container } = render(
      <Provider store={getStore()}>
        <WeavessContext.Provider
          value={{
            weavessRef: {
              resetSelectedWaveformAmplitudeScaling: mockResetAmplitudes
            } as any,
            setWeavessRef: jest.fn(x => x)
          }}
        >
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <FkDisplay {...fkDisplayProps} />
        </WeavessContext.Provider>
      </Provider>
    );

    expect(container).toMatchSnapshot();
  });
});
