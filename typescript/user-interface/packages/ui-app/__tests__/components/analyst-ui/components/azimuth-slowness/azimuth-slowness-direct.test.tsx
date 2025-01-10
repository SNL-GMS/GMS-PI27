import {
  defaultStations,
  linearFilter,
  processingAnalystConfigurationData
} from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import { act, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { WeavessContext } from '~analyst-ui/components/waveform/weavess-context';
import { BaseDisplay } from '~common-ui/components/base-display';

import { AzimuthSlownessPanel } from '../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/azimuth-slowness-panel';
import { userProfile } from '../../../../__data__/common-ui/user-profile-data';
import { reviewablePhasesRecord } from '../../../../__data__/test-util-data';
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
    useGetAllStationsQuery: jest.fn(() => ({ data: defaultStations })),
    useFkReviewablePhasesQuery: jest.fn(() => reviewablePhasesRecord),
    useFkStationTypeConfigurations: jest.fn(
      () => processingAnalystConfigurationData.fkConfigurations.fkStationTypeConfigurations
    ),
    useGetUserProfileQuery: jest.fn(() => ({ data: userProfile })),
    useSelectedFilterList: jest.fn().mockReturnValue({
      name: 'azimuth-slowness-direct-test',
      defaultFilterIndex: 0,
      filters: [linearFilter]
    })
  };
});

jest.mock('~analyst-ui/components/azimuth-slowness/azimuth-slowness-panel', () => {
  const actual = jest.requireActual(
    '~analyst-ui/components/azimuth-slowness/azimuth-slowness-panel'
  );
  return {
    ...actual,
    AzimuthSlownessPanel: function TestComponent() {
      return <div>Mock AzimuthSlownessPanel</div>;
    }
  };
});

jest.mock('../../../../../src/ts/components/analyst-ui/components/waveform/utils', () => {
  const actual = jest.requireActual(
    '../../../../../src/ts/components/analyst-ui/components/waveform/utils'
  );
  return {
    ...actual,
    useWeavessHotkeys: jest.fn(() => {
      return {};
    })
  };
});

const mockResetAmplitudes = jest.fn();

const buildAzimuthSlowness = (): JSX.Element => {
  const store = getStore();
  return (
    <Provider store={store}>
      <BaseDisplay glContainer={glContainer} />
      <WeavessContext.Provider
        value={{
          weavessRef: {
            resetSelectedWaveformAmplitudeScaling: mockResetAmplitudes
          } as any,
          setWeavessRef: jest.fn(x => x)
        }}
      >
        <AzimuthSlownessPanel />
      </WeavessContext.Provider>
    </Provider>
  );
};

describe('AzimuthSlowness Direct', () => {
  it('AzimuthSlowness snapshot', async () => {
    let result;
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable
      result = await render(buildAzimuthSlowness());
    });
    expect(result.container).toMatchSnapshot();
  });
});
