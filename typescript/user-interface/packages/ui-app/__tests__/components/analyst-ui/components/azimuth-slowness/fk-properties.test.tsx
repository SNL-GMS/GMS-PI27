/* eslint-disable react/jsx-props-no-spreading */
import { FkTypes } from '@gms/common-model';
import { defaultStations, signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import type { AppState } from '@gms/ui-state';
import { FkQueryStatus, getStore } from '@gms/ui-state';
import { getTestFkData, getTestFkFrequencyThumbnailRecord } from '@gms/ui-state/__tests__/__data__';
import { appState } from '@gms/ui-state/__tests__/test-util';
import type { RenderResult } from '@testing-library/react';
import { act, render } from '@testing-library/react';
import produce from 'immer';
import React from 'react';
import { Provider } from 'react-redux';
import * as util from 'util';

import { BaseDisplay } from '~common-ui/components/base-display';

import type { FkPropertiesProps } from '../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-properties/fk-properties';
import { FkProperties } from '../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/components/fk-properties/fk-properties';
import { glContainer } from '../workflow/gl-container';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();
console.warn = jest.fn();

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
    useAllStations: jest.fn(() => defaultStations),
    useGetFkQueryStatus: jest.fn().mockReturnValue(() => FkQueryStatus.SUCCESS),
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state = produce(appState, draft => {
        draft.data.fkFrequencyThumbnails = getTestFkFrequencyThumbnailRecord(signalDetectionsData);
      });
      return stateFunc(state);
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

const buildFkProperties = async (props: FkPropertiesProps): Promise<RenderResult> => {
  let result: RenderResult;
  await act(async () => {
    // wait for all the state calls to come back
    // eslint-disable-next-line @typescript-eslint/await-thenable
    result = await render(
      <Provider store={getStore()}>
        <BaseDisplay glContainer={glContainer} />
        <FkProperties {...props} />
      </Provider>
    );
  });
  return result;
};

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

const fk = getTestFkData(1000);
const props: FkPropertiesProps = {
  displayedSignalDetection: signalDetectionsData[0],
  featurePredictionsForDisplayedSignalDetection: [],
  selectedFkUnit: FkTypes.FkUnits.FSTAT,
  fkRenderingWidth: 393,
  currentMovieSpectrumIndex: 0,
  displayedFk: fk,
  fkDisplayWidthPx: 600
};
describe('FKProperties', () => {
  test('properties to be defined', () => {
    expect(FkProperties).toBeDefined();
  });

  test('fk data changes on input', async () => {
    const result = await buildFkProperties(props);
    expect(result.container).toMatchSnapshot();
  });
});
