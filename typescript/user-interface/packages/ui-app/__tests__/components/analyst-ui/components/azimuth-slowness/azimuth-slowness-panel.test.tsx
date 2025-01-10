import {
  defaultStations,
  processingAnalystConfigurationData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type { AppState } from '@gms/ui-state';
import { FkQueryStatus, FkThumbnailsFilterType, getStore } from '@gms/ui-state';
import {
  getTestFkChannelSegment,
  getTestFkFrequencyThumbnailRecord
} from '@gms/ui-state/__tests__/__data__';
import { testFilterList } from '@gms/ui-state/__tests__/filter-list-data';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { act, render } from '@testing-library/react';
import Axios from 'axios';
import produce from 'immer';
import React from 'react';
import { Provider } from 'react-redux';

import { AzimuthSlownessPanel } from '~analyst-ui/components/azimuth-slowness/azimuth-slowness-panel';
import { WeavessContext } from '~analyst-ui/components/waveform/weavess-context';
import { BaseDisplay } from '~common-ui/components/base-display';

import { userProfile } from '../../../../__data__/common-ui/user-profile-data';
import { reviewablePhasesRecord } from '../../../../__data__/test-util-data';
import { glContainer } from '../workflow/gl-container';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();
console.warn = jest.fn();

const mockAxiosRequest = jest.fn().mockImplementation(async () =>
  Promise.resolve({
    data: undefined
  })
);
Axios.request = mockAxiosRequest;

jest.mock('@gms/ui-workers', () => {
  const actual = jest.requireActual('@gms/ui-workers');
  return {
    ...actual,
    axiosBaseQuery: jest.fn(() => async () => Promise.resolve({ data: {} }))
  };
});

jest.mock(
  '@gms/ui-state/src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '@gms/ui-state/src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );
    return {
      ...actual
    };
  }
);

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useAllStations: jest.fn(() => defaultStations),
    useFkReviewablePhasesQuery: jest.fn(() => reviewablePhasesRecord),
    useGetFkQueryStatus: jest.fn().mockReturnValue(() => FkQueryStatus.SUCCESS),
    useGetSignalDetections: jest.fn(() => ({
      data: signalDetectionsData,
      isLoading: false
    })),
    useGetAllStationsQuery: jest.fn(() => {
      return { data: defaultStations };
    }),
    useGetUserProfileQuery: jest.fn(() => ({ data: userProfile })),
    useColorMap: jest.fn(() => 'turbo'),
    useFkStationTypeConfigurations: jest.fn(() => {
      return processingAnalystConfigurationData.fkConfigurations.fkStationTypeConfigurations;
    }),
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state = produce(appState, draft => {
        draft.data.fkFrequencyThumbnails = getTestFkFrequencyThumbnailRecord(signalDetectionsData);
        draft.app.fks.currentFkThumbnailFilter = FkThumbnailsFilterType.KEYACTIVITYPHASES;
        draft.app.workflow.openActivityNames = ['AL1 Event Review'];
        draft.app.fks.displayedSignalDetectionId = signalDetectionsData[0].id;
        draft.data.signalDetections = {
          [signalDetectionsData[0].id]: signalDetectionsData[0],
          [signalDetectionsData[1].id]: signalDetectionsData[1],
          [signalDetectionsData[2].id]: signalDetectionsData[2]
        };
      });
      return stateFunc(state);
    }),
    useSelectedFilterList: jest.fn(() => testFilterList),
    useGetFkData: () => {
      return jest.fn(sd => {
        return getTestFkChannelSegment(sd).timeseries[0];
      });
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

jest.mock('@gms/ui-state/lib/app/api/data/fk/fk-utils', () => {
  const actual = jest.requireActual('@gms/ui-state/lib/app/api/data/fk/fk-utils');

  return {
    ...actual,
    computeFk: jest.fn()
  };
});

jest.mock('~analyst-ui/components/azimuth-slowness/components/fk-display', () => {
  const actual = jest.requireActual(
    '~analyst-ui/components/azimuth-slowness/components/fk-display'
  );
  return {
    ...actual,
    FkDisplay: function TestComponent() {
      return <div>Mock FkDisplay</div>;
    }
  };
});
jest.mock('~analyst-ui/common/hotkey-configs/azimuth-slowness-hotkey-configs', () => {
  const actual = jest.requireActual(
    '~analyst-ui/common/hotkey-configs/azimuth-slowness-hotkey-configs'
  );
  return {
    ...actual,
    AzimuthSlownessHotkeys: function TestComponent() {
      return <div>Mock AzimuthSlownessHotkeys</div>;
    }
  };
});

const mockResetAmplitudes = jest.fn();

const buildAzimuthSlownessPanel = (): JSX.Element => {
  const fkGlContainer = glContainer;
  fkGlContainer.width = 500;
  fkGlContainer.height = 500;
  return (
    <Provider store={getStore()}>
      <BaseDisplay glContainer={fkGlContainer} />
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

describe('Azimuth Slowness Panel', () => {
  it('AzimuthSlowness snapshot', async () => {
    let result;
    await act(async () => {
      // wait for all the state calls to come back
      // eslint-disable-next-line @typescript-eslint/await-thenable
      result = await render(buildAzimuthSlownessPanel());
    });
    expect(result.container).toMatchSnapshot();
  });
});
