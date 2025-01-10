import { BeamformingTemplateTypes } from '@gms/common-model';
import {
  asar,
  beamformingTemplatesByBeamTypeByStationByPhase,
  defaultStations,
  eventBeamformingTemplate,
  pdar,
  processingAnalystConfigurationData
} from '@gms/common-model/__tests__/__data__';
import { renderHook } from '@testing-library/react-hooks';
import { produce } from 'immer';

import {
  hasBeamformingTemplatesForQueryArgs,
  useBeamformingTemplatesForEvent,
  useBeamformingTemplatesForFK,
  useBeamformingTemplatesForVisibleStationsAndFavoritePhases
} from '../../../src/ts/app/hooks/beamforming-template-hooks';
import type { AppState } from '../../../src/ts/app/store';
import { getStore } from '../../../src/ts/ui-state';
import { appState, getTestReduxWrapper } from '../../test-util';

jest.mock('../../../src/ts/app/hooks/react-redux-hooks', () => {
  const actualRedux = jest.requireActual('../../../src/ts/app/hooks/react-redux-hooks');
  const mockUseAppDispatch = jest
    .fn()
    .mockImplementation(() => jest.fn(async () => Promise.resolve()));
  return {
    ...actualRedux,
    useAppDispatch: mockUseAppDispatch,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = produce(appState, draft => {
        draft.app.analyst.phaseSelectorFavorites = {
          'Seismic & Hydroacoustic': [
            'P',
            'Pn',
            'Pg',
            'pP',
            'S',
            'PKP',
            'PKPdf',
            'PKPbc',
            'PKPab',
            'PcP',
            'ScP',
            'Sn',
            'Lg',
            'Rg',
            'sP'
          ]
        };
        draft.data.beamformingTemplates = beamformingTemplatesByBeamTypeByStationByPhase;
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

jest.mock('../../../src/ts/app/hooks/station-definition-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/station-definition-hooks');
  return {
    ...actual,
    useVisibleStations: jest.fn(() => defaultStations)
  };
});

describe('test hooks', () => {
  it('is defined', () => {
    expect(useBeamformingTemplatesForVisibleStationsAndFavoritePhases).toBeDefined();
    expect(useBeamformingTemplatesForFK).toBeDefined();
    expect(hasBeamformingTemplatesForQueryArgs).toBeDefined();
  });

  it('gets an FK template', () => {
    const { result } = renderHook(useBeamformingTemplatesForFK, {
      wrapper: getTestReduxWrapper(getStore())
    });
    expect(result.current.data).toMatchSnapshot();
  });

  it('gets an EVENT template', () => {
    const { result } = renderHook(() => useBeamformingTemplatesForEvent([]), {
      wrapper: getTestReduxWrapper(getStore())
    });
    expect(result.current.data).toMatchSnapshot();
  });

  it('hasBeamformingTemplatesForQueryArgs checks a data object to see if the data already exists', () => {
    // returns false if beam type is not requested
    expect(
      hasBeamformingTemplatesForQueryArgs(
        {},
        {
          beamType: BeamformingTemplateTypes.BeamType.EVENT,
          phases: ['P'],
          stations: [pdar]
        }
      )
    ).toBeFalsy();
    // returns false if a station has not been requested
    expect(
      hasBeamformingTemplatesForQueryArgs(
        { [BeamformingTemplateTypes.BeamType.EVENT]: { [pdar.name]: {} } },
        {
          beamType: BeamformingTemplateTypes.BeamType.EVENT,
          phases: ['P', 'S'],
          stations: [pdar, asar]
        }
      )
    ).toBeFalsy();

    // returns false if a phase has not been requested
    expect(
      hasBeamformingTemplatesForQueryArgs(
        {
          [BeamformingTemplateTypes.BeamType.EVENT]: {
            [pdar.name]: { P: eventBeamformingTemplate },
            [asar.name]: { P: eventBeamformingTemplate }
          }
        },
        {
          beamType: BeamformingTemplateTypes.BeamType.EVENT,
          phases: ['P', 'S'],
          stations: [pdar, asar]
        }
      )
    ).toBeFalsy();

    // returns true if all phases and stations have been requested

    expect(
      hasBeamformingTemplatesForQueryArgs(
        {
          [BeamformingTemplateTypes.BeamType.EVENT]: {
            [pdar.name]: { P: eventBeamformingTemplate, S: eventBeamformingTemplate },
            [asar.name]: { P: eventBeamformingTemplate, S: eventBeamformingTemplate }
          }
        },
        {
          beamType: BeamformingTemplateTypes.BeamType.EVENT,
          phases: ['P', 'S'],
          stations: [pdar, asar]
        }
      )
    ).toBeTruthy();
  });
});
