import { FacetedTypes } from '@gms/common-model';
import {
  akasgVersionReference,
  defaultStations,
  processingAnalystConfigurationData,
  rotationTemplateByPhaseByStationRecord
} from '@gms/common-model/__tests__/__data__';
import { act, renderHook } from '@testing-library/react-hooks';
import { produce } from 'immer';

import type { AppState } from '../../../src/ts/app/store';
import {
  AsyncActionStatus,
  getRotationTemplates,
  getStore,
  useAppDispatch,
  useGetRotationTemplatesForVisibleStationsAndFavoritePhases,
  useGetRotationTemplatesQueryHistory,
  useRotationTemplates
} from '../../../src/ts/ui-state';
import { appState, getTestReduxWrapper } from '../../test-util';

jest.mock('../../../src/ts/app/hooks/react-redux-hooks', () => {
  const actualRedux = jest.requireActual('../../../src/ts/app/hooks/react-redux-hooks');
  const mockAppDispatch = jest.fn(async () => Promise.resolve());
  const mockUseAppDispatch = jest.fn(() => mockAppDispatch);
  return {
    ...actualRedux,
    useAppDispatch: mockUseAppDispatch,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => AppState) => {
      const state: AppState = produce(appState, draft => {
        draft.app.analyst.phaseSelectorFavorites = {
          'Seismic & Hydroacoustic': ['S']
        };
        draft.data.queries.getRotationTemplates = {
          id1: {
            '0': {
              arg: { stations: [akasgVersionReference], phases: ['S'] },
              error: undefined,
              status: AsyncActionStatus.fulfilled,
              time: 0,
              attempts: 1
            }
          }
        };
        draft.data.rotationTemplates = rotationTemplateByPhaseByStationRecord;
      });
      return stateFunc(state);
    })
  };
});

jest.mock(
  '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice',
  () => {
    const actual = jest.requireActual(
      '../../../src/ts/app/api/processing-configuration/processing-configuration-api-slice'
    );
    return {
      ...actual,
      useGetProcessingAnalystConfigurationQuery: jest.fn(() => ({
        data: processingAnalystConfigurationData
      }))
    };
  }
);

jest.mock('../../../src/ts/app/api/data/signal-enhancement/get-rotation-templates', () => {
  const actual = jest.requireActual(
    '../../../src/ts/app/api/data/signal-enhancement/get-rotation-templates'
  );
  return {
    ...actual,
    getRotationTemplates: jest.fn()
  };
});

jest.mock('../../../src/ts/app/hooks/station-definition-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/station-definition-hooks');
  const mockStation = defaultStations[1];
  return {
    ...actual,
    useGetVisibleStationsVersionReferences: jest.fn(() => [
      FacetedTypes.convertToVersionReference(
        { effectiveAt: mockStation.effectiveAt, name: mockStation.name },
        'name'
      )
    ])
  };
});

describe('test hooks', () => {
  describe('useGetRotationTemplatesForVisibleStationsAndFavoritePhases', () => {
    it('is defined', () => {
      expect(useGetRotationTemplatesForVisibleStationsAndFavoritePhases).toBeDefined();
    });

    it('query for rotation templates', async () => {
      const store = getStore();
      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await renderHook(() => useGetRotationTemplatesForVisibleStationsAndFavoritePhases(), {
          wrapper: getTestReduxWrapper(store)
        });
      });
      const dispatch = useAppDispatch();
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect((getRotationTemplates as unknown as jest.Mock).mock.calls[0][0])
        .toMatchInlineSnapshot(`
        {
          "phases": [
            "Iw",
            "S",
          ],
          "stations": [
            {
              "effectiveAt": 1636503404,
              "name": "AKASG",
            },
          ],
        }
      `);
    });
  });

  describe('useGetRotationTemplatesQueryHistory', () => {
    it('is defined', () => {
      expect(useGetRotationTemplatesQueryHistory).toBeDefined();
    });

    it('query for rotation templates history', () => {
      const store = getStore();
      const result = renderHook(() => useGetRotationTemplatesQueryHistory(), {
        wrapper: getTestReduxWrapper(store)
      });
      expect(result.result.current).toMatchInlineSnapshot(`
        {
          "error": undefined,
          "fulfilled": 1,
          "isError": false,
          "isLoading": false,
          "pending": 0,
          "rejected": 0,
        }
      `);
    });
  });

  describe('useRotationTemplates', () => {
    it('is defined', () => {
      expect(useRotationTemplates).toBeDefined();
    });

    it('gets rotation templates from state', () => {
      const store = getStore();
      const result = renderHook(() => useRotationTemplates(), {
        wrapper: getTestReduxWrapper(store)
      });

      expect(result.result.current).toMatchInlineSnapshot(`
        {
          "AKASG": {
            "rotationTemplatesByPhase": {
              "S": {
                "duration": 300,
                "inputChannels": [
                  {
                    "name": "AKASG.AKBB.BHE",
                  },
                  {
                    "name": "AKASG.AKASG.BHN",
                  },
                ],
                "leadDuration": 5,
                "locationToleranceKm": 0.1,
                "orientationAngleToleranceDeg": 5,
                "rotationDescription": {
                  "phaseType": "S",
                  "samplingType": "NEAREST_SAMPLE",
                  "twoDimensional": true,
                },
                "sampleRateToleranceHz": 0.5,
                "station": {
                  "name": "AKASG",
                },
              },
            },
            "station": {
              "name": "AKASG",
            },
          },
        }
      `);
    });
  });
});
