import {
  processingAnalystConfigurationData,
  signalDetectionsRecord
} from '@gms/common-model/__tests__/__data__';
import type { Filter } from '@gms/common-model/lib/filter';
import { FilterDefinitionUsage } from '@gms/common-model/lib/filter';
import { renderHook } from '@testing-library/react-hooks';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { Provider } from 'react-redux';
import type { AnyAction } from 'redux';
import type { MockStoreCreator } from 'redux-mock-store';
import createMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { waveformInitialState } from '../../../src/ts/app';
import { dataInitialState } from '../../../src/ts/app/api';
import * as getFilterDefinitionForChannelSegments from '../../../src/ts/app/api/data/signal-enhancement';
import {
  useFindFilterByUsage,
  useGetDefaultFilterDefinitionByUsageForChannelSegmentsMap
} from '../../../src/ts/app/hooks/signal-enhancement-configuration-hooks';
import { initialState } from '../../../src/ts/app/state/reducer';
import type { AppState } from '../../../src/ts/app/store';
import { uiChannelSegmentRecord, unfilteredClaimCheckUiChannelSegment } from '../../__data__';
import { defaultFilterDefinitionsByUsage } from '../../__data__/signal-enhancement-configuration';
import { appState } from '../../test-util';

jest.mock('@gms/ui-state', () => {
  const actualRedux = jest.requireActual('@gms/ui-state');
  const mockDispatchFunc = jest.fn();
  const mockDispatch = () => mockDispatchFunc;
  const mockUseAppDispatch = jest.fn(mockDispatch);
  return {
    ...actualRedux,
    useAppDispatch: mockUseAppDispatch
  };
});

jest.mock(
  '@gms/ui-state/lib/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '@gms/ui-state/lib/app/api/processing-configuration/processing-configuration-api-slice'
    );
    return {
      ...actual,
      useGetProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
        data: {
          stationGroupNames: []
        }
      })),
      useGetProcessingMonitoringOrganizationConfigurationQuery: jest.fn(() => ({
        data: {
          monitoringOrganization: 'gms'
        }
      }))
    };
  }
);

jest.mock('../../../src/ts/app/hooks/processing-analyst-configuration-hooks', () => {
  const actual = jest.requireActual(
    '@gms/ui-state/src/ts/app/hooks/processing-analyst-configuration-hooks'
  );

  return {
    ...actual,
    useProcessingAnalystConfiguration: jest.fn(() => processingAnalystConfigurationData),
    usePhaseLists: jest.fn(() => processingAnalystConfigurationData.phaseLists)
  };
});

jest.mock('../../../src/ts/app/api/data/signal-enhancement', () => {
  const actualRedux = jest.requireActual('../../../src/ts/app/api/data/signal-enhancement');
  return {
    ...actualRedux,
    getFilterDefinitionsByUsageMap: jest.fn(),
    getDefaultFilterDefinitionByUsageForChannelSegments: jest.fn()
  };
});

describe('signal enhancement configuration hooks', () => {
  describe('useGetDefaultFilterDefinitionByUsageForChannelSegmentsMap', () => {
    it('is defined', () => {
      expect(useGetDefaultFilterDefinitionByUsageForChannelSegmentsMap).toBeDefined();
    });

    it('useGetDefaultFilterDefinitionByUsageForChannelSegments dispatches web service request', () => {
      const myDataInitialState = cloneDeep(dataInitialState);
      myDataInitialState.channels.raw = { key1: { name: 'key1' } } as any;
      myDataInitialState.uiChannelSegments = {
        chanSegName: {
          Unfiltered: [
            {
              channelSegmentDescriptor: {
                channel: { name: 'key1', effectiveAt: 1 },
                creationTime: 1,
                startTime: 1,
                endTime: 2
              }
            } as any
          ]
        }
      };
      const app = cloneDeep(initialState);
      const myAppState: AppState = {
        eventManagerApi: {} as any,
        processingConfigurationApi: {} as any,
        processingStationApi: {} as any,
        signalEnhancementConfigurationApi: {} as any,
        userManagerApi: {} as any,
        workflowApi: {} as any,
        stationDefinitionApi: {} as any,
        systemEventGatewayApi: {} as any,
        data: myDataInitialState,
        history: {} as any,
        app: {
          ...app,
          waveform: {
            ...waveformInitialState,
            viewableInterval: {
              startTimeSecs: 0,
              endTimeSecs: 1
            }
          }
        }
      };
      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const store = mockStoreCreator(myAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      renderHook(() => useGetDefaultFilterDefinitionByUsageForChannelSegmentsMap(), {
        wrapper: Wrapper
      });

      expect(
        getFilterDefinitionForChannelSegments.getFilterDefinitionsByUsageMap
      ).toHaveBeenCalled();
    });
  });

  describe('useFindDefaultFilterDefinitionsByUsage', () => {
    it('is defined', () => {
      expect(useFindFilterByUsage).toBeDefined();
    });

    it('gets the global default', () => {
      const myDataInitialState = cloneDeep(dataInitialState);
      myDataInitialState.defaultFilterDefinitionsMap = defaultFilterDefinitionsByUsage;
      myDataInitialState.uiChannelSegments = uiChannelSegmentRecord;

      const mockAppState: AppState = {
        ...appState,
        data: myDataInitialState
      };

      const goodFilter: Filter = {
        withinHotKeyCycle: true,
        namedFilter: FilterDefinitionUsage.ONSET
      };

      const uiChannelSegment = unfilteredClaimCheckUiChannelSegment;
      const channelName = uiChannelSegment.channelSegmentDescriptor.channel.name;

      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useFindFilterByUsage(), {
        wrapper: Wrapper
      });

      const filter = result.current(goodFilter, channelName, uiChannelSegment);

      expect(filter?.filterDefinition).toMatchObject(
        expect.objectContaining(
          defaultFilterDefinitionsByUsage.filterDefinitionsById[
            '7d62eb0a-91bb-3bce-9070-6beeb9dd459a'
          ]
        )
      );
    });

    it('gets the default for UNSET by usage', () => {
      const myDataInitialState = cloneDeep(dataInitialState);
      myDataInitialState.defaultFilterDefinitionsMap = defaultFilterDefinitionsByUsage;
      myDataInitialState.uiChannelSegments = uiChannelSegmentRecord;

      const mockAppState: AppState = {
        ...appState,
        data: myDataInitialState
      };

      const goodFilter: Filter = {
        withinHotKeyCycle: true,
        namedFilter: FilterDefinitionUsage.ONSET
      };

      const uiChannelSegment = cloneDeep(unfilteredClaimCheckUiChannelSegment);
      const channelName = uiChannelSegment.channelSegmentDescriptor.channel.name;
      uiChannelSegment.channelSegmentDescriptor = {
        ...uiChannelSegment.channelSegmentDescriptor,
        channel: {
          name: 'NRIK.NRIK.BHZ',
          effectiveAt: uiChannelSegment.channelSegmentDescriptor.channel.effectiveAt
        }
      };

      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useFindFilterByUsage(), {
        wrapper: Wrapper
      });

      expect(
        result.current(goodFilter, channelName, uiChannelSegment)?.filterDefinition
      ).toMatchObject(
        defaultFilterDefinitionsByUsage.filterDefinitionsById[
          '7d62eb0a-91bb-3bce-9070-6beeb9dd459a'
        ]
      );
    });

    it('gets the default for P by usage', () => {
      const myDataInitialState = cloneDeep(dataInitialState);
      myDataInitialState.defaultFilterDefinitionsMap = defaultFilterDefinitionsByUsage;
      myDataInitialState.uiChannelSegments = uiChannelSegmentRecord;
      myDataInitialState.signalDetections = signalDetectionsRecord;

      const mockAppState: AppState = {
        ...appState,
        data: myDataInitialState
      };

      const goodFilter: Filter = {
        withinHotKeyCycle: true,
        namedFilter: FilterDefinitionUsage.ONSET
      };

      const uiChannelSegment = cloneDeep(unfilteredClaimCheckUiChannelSegment);
      const channelName = uiChannelSegment.channelSegmentDescriptor.channel.name;
      uiChannelSegment.channelSegmentDescriptor = {
        ...uiChannelSegment.channelSegmentDescriptor,
        channel: {
          name: 'ASAR.AS01.SHZ',
          effectiveAt: 1690336800
        }
      };

      const mockStoreCreator: MockStoreCreator<AppState, AnyAction> = createMockStore([thunk]);
      const store = mockStoreCreator(mockAppState);

      function Wrapper({ children }) {
        return <Provider store={store}>{children}</Provider>;
      }
      const { result } = renderHook(() => useFindFilterByUsage(), {
        wrapper: Wrapper
      });

      expect(
        result.current(goodFilter, channelName, uiChannelSegment)?.filterDefinition
      ).toMatchObject(
        defaultFilterDefinitionsByUsage.filterDefinitionsById[
          'c12cf464-325c-322a-9e39-4fce21453640'
        ]
      );
    });
  });
});
