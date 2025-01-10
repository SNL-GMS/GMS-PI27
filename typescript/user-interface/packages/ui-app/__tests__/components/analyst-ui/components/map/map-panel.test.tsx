import { H1 } from '@blueprintjs/core';
import { signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';
import * as React from 'react';
import { Provider } from 'react-redux';

import type { MapPanelProps } from '../../../../../src/ts/components/analyst-ui/components/map/map-panel';
import {
  MapPanel,
  mapPanelMemoCheck
} from '../../../../../src/ts/components/analyst-ui/components/map/map-panel';
import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display';
import { I08BO, TIXI } from '../../../../__data__/geojson-data';
import {
  mockedNonPreferredEventsResult,
  mockedPreferredEventsResult
} from './map-events-mock-data';

jest.mock('../../../../../src/ts/components/common-ui/components/map', () => {
  function MockMap() {
    return <H1>Map</H1>;
  }
  return { Map: () => MockMap() };
});

const mockedStationsResult: any[] = [TIXI, I08BO];

describe('ui map', () => {
  it('is defined', () => {
    expect(MapPanel).toBeDefined();
  });

  it('can mount map', () => {
    const { container } = render(
      <Provider store={getStore()}>
        <BaseDisplayContext.Provider
          value={{ glContainer: {} as any, widthPx: 200, heightPx: 200 }}
        >
          <MapPanel
            stationsResult={mockedStationsResult}
            signalDetections={signalDetectionsData}
            preferredEventsResult={mockedPreferredEventsResult}
            nonPreferredEventsResult={mockedNonPreferredEventsResult}
            setPhaseMenuVisibilityCb={jest.fn}
            setCreateEventMenuState={jest.fn}
          />
        </BaseDisplayContext.Provider>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});

/** ian map panel memo check relies on props being referentially stable
 * clone deep makes a new object that no longer references the same object
 * so we don't need to manipulate the data so that they are different
 */
describe('ian map panel memo check', () => {
  const prevProps: MapPanelProps = {
    stationsResult: [],
    signalDetections: [],
    preferredEventsResult: mockedPreferredEventsResult,
    nonPreferredEventsResult: mockedNonPreferredEventsResult,
    setPhaseMenuVisibilityCb: jest.fn(),
    setCreateEventMenuState: jest.fn()
  };
  it('is defined', () => {
    const newProps = cloneDeep(prevProps);
    expect(mapPanelMemoCheck(prevProps, newProps)).toBeDefined();
  });
  it('handles stations results', () => {
    const newProps = cloneDeep(prevProps);
    expect(mapPanelMemoCheck(prevProps, newProps)).toBeFalsy();
  });

  it('handles signal detections results', () => {
    const newProps = cloneDeep(prevProps);
    expect(mapPanelMemoCheck(prevProps, newProps)).toBeFalsy();
  });

  it('handles preferred events results', () => {
    const newProps = cloneDeep(prevProps);
    expect(mapPanelMemoCheck(prevProps, newProps)).toBeFalsy();
  });

  it('handles non-preferred events results', () => {
    const newProps = cloneDeep(prevProps);
    expect(mapPanelMemoCheck(prevProps, newProps)).toBeFalsy();
  });

  it('handles no changes', () => {
    expect(mapPanelMemoCheck(prevProps, prevProps)).toBeTruthy();
  });
});
