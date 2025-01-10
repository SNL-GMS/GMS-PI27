import type { CommonTypes } from '@gms/common-model';
import {
  qcSegment,
  qcSegmentsByChannelName,
  qcSegmentVersion,
  workflowDefinitionId
} from '@gms/common-model/__tests__/__data__';
import type { QcSegment } from '@gms/common-model/lib/qc-segment';
import { QcSegmentCategory, QcSegmentType } from '@gms/common-model/lib/qc-segment';
import { renderHook } from '@testing-library/react-hooks';
import cloneDeep from 'lodash/cloneDeep';
import React from 'react';
import { Provider } from 'react-redux';

import type { AppState } from '../../../src/ts/app';
import { addChannelSegments, analystActions, getStore } from '../../../src/ts/app';
import {
  filterQcSegmentsByChannelNames,
  useCreateQcSegments,
  useModifyQcSegment,
  useRejectQcSegment
} from '../../../src/ts/app/hooks/qc-segment-hooks';
import { unfilteredClaimCheckUiChannelSegment } from '../../__data__';
import { appState } from '../../test-util';

const timeRange: CommonTypes.TimeRange = {
  startTimeSecs: 0,
  endTimeSecs: 100
};

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useViewableInterval: jest.fn(() => [timeRange, jest.fn]),
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = appState;
      state.app.analyst.mapOpenEventTriggered = true;
      return stateFunc(state);
    })
  };
});

jest.mock('../../../src/ts/app/hooks/user-session-hooks', () => ({
  useUsername: jest.fn(() => 'mock user')
}));

jest.mock('../../../src/ts/app/hooks/workflow-hooks', () => ({
  useStageId: jest.fn(() => ({ definitionId: workflowDefinitionId }))
}));

jest.mock('@gms/common-util', () => {
  const actual = jest.requireActual('@gms/common-util');
  return {
    ...actual,
    uuid4: () => 'test-123',
    epochSecondsNow: () => 100
  };
});

const mockDispatch = jest.fn();

jest.mock('../../../src/ts/app/hooks/react-redux-hooks', () => {
  const actual = jest.requireActual('../../../src/ts/app/hooks/react-redux-hooks');
  return {
    ...actual,
    useAppDispatch: () => mockDispatch
  };
});

jest.mock('../../../src/ts/app/hooks/waveform-hooks', () => {
  return {
    useViewableInterval: jest.fn(() => [timeRange, jest.fn])
  };
});

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

const store = getStore();

function Wrapper({ children }) {
  return <Provider store={store}>{children}</Provider>;
}

describe('qc segment hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filterQcSegmentsByChannelNames exist', () => {
    expect(filterQcSegmentsByChannelNames).toBeDefined();
  });

  it('filterQcSegmentsByChannelNames filters a QcSegmentRecord for the provided unique name', () => {
    const filteredSingle = filterQcSegmentsByChannelNames(qcSegmentsByChannelName, [
      'PDAR.PD01.SHZ'
    ]);

    expect(filteredSingle).toMatchSnapshot();

    const filtered = filterQcSegmentsByChannelNames(qcSegmentsByChannelName, [
      'PDAR.PD02.SHZ',
      'PDAR.PD01.SHZ'
    ]);

    expect(filtered).toMatchSnapshot();
  });

  test('useCreateQcSegments is defined', () => {
    expect(useCreateQcSegments).toBeDefined();
  });

  test('useCreateQcSegments matches snapshot', () => {
    const { result } = renderHook(() => useCreateQcSegments(), { wrapper: Wrapper });
    expect(result.current).toMatchSnapshot();
  });

  test('useCreateQcSegments callback', () => {
    const defaultSegment: QcSegment = {
      id: '',
      channel: { name: '' },
      versionHistory: [
        {
          id: { parentQcSegmentId: '', effectiveAt: 7 },
          startTime: 0,
          endTime: 100,
          createdBy: '',
          rejected: false,
          rationale: '',
          type: undefined,
          discoveredOn: undefined,
          stageId: { name: '' },
          category: QcSegmentCategory.ANALYST_DEFINED,
          channels: [{ name: 'Channel', effectiveAt: 2 }]
        }
      ]
    };
    const channelFilters = {
      Channel: 'Unfiltered'
    } as any;

    store.dispatch(analystActions.setChannelFilters(channelFilters));
    store.dispatch(
      addChannelSegments([
        {
          name: 'Channel',
          channelSegments: [
            {
              channelSegmentDescriptor: {
                channel: { name: 'Channel', effectiveAt: 100 },
                startTime: timeRange.startTimeSecs,
                endTime: timeRange.endTimeSecs,
                creationTime: 0
              },
              channelSegment: unfilteredClaimCheckUiChannelSegment.channelSegment,
              domainTimeRange: timeRange
            }
          ]
        }
      ])
    );
    const { result } = renderHook(() => useCreateQcSegments(), { wrapper: Wrapper });
    result.current(
      defaultSegment,
      timeRange.startTimeSecs,
      timeRange.endTimeSecs,
      QcSegmentType.AGGREGATE,
      'Test rationale'
    );

    const createdSegment: QcSegment = {
      id: 'test-123',
      channel: { name: 'Channel' },
      versionHistory: [
        {
          id: { parentQcSegmentId: 'test-123', effectiveAt: 100 },
          startTime: timeRange.startTimeSecs,
          endTime: timeRange.endTimeSecs,
          createdBy: 'mock user',
          rejected: false,
          rationale: 'Test rationale',
          type: QcSegmentType.AGGREGATE,
          discoveredOn: [
            {
              id: {
                channel: { name: 'Channel', effectiveAt: 100 },
                startTime: timeRange.startTimeSecs,
                endTime: timeRange.endTimeSecs,
                creationTime: 0
              }
            }
          ],
          stageId: workflowDefinitionId,
          category: QcSegmentCategory.ANALYST_DEFINED,
          channels: [{ name: 'Channel', effectiveAt: 2 }]
        }
      ]
    };

    const expectedDispatchResult = {
      payload: { qcSegment: createdSegment },
      type: 'data/createQcSegment'
    };
    expect(mockDispatch).toHaveBeenCalledWith(expectedDispatchResult);
  });

  it('useRejectQcSegment returns a function that when called builds a new rejected version and dispatches it', () => {
    const { result } = renderHook(() => useRejectQcSegment());

    result.current(qcSegment, 'I am testing reject');

    const rejectedQcSegmentVersion = {
      ...qcSegmentVersion,
      id: { parentQcSegmentId: qcSegment.id, effectiveAt: 100 },
      createdBy: 'mock user',
      rationale: 'I am testing reject',
      type: undefined,
      category: undefined,
      rejected: true,
      stageId: workflowDefinitionId
    };

    const rejectedQcSegment = cloneDeep(qcSegment);
    rejectedQcSegment.versionHistory.push(rejectedQcSegmentVersion);

    const expectedDispatchResult = {
      payload: rejectedQcSegment,
      type: 'data/updateQcSegment'
    };

    expect(mockDispatch).toHaveBeenCalledWith(expectedDispatchResult);
  });

  it('useModifyQcSegment returns a function that when called builds a new rejected version and dispatches it', () => {
    const { result } = renderHook(() => useModifyQcSegment());

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    result.current(qcSegment, 500, 700, QcSegmentType.AGGREGATE, 'I am testing modify');

    const modifiedQcSegmentVersion = {
      ...qcSegmentVersion,
      id: { parentQcSegmentId: qcSegment.id, effectiveAt: 100 },
      createdBy: 'mock user',
      rationale: 'I am testing modify',
      type: QcSegmentType.AGGREGATE,
      category: QcSegmentCategory.ANALYST_DEFINED,
      stageId: workflowDefinitionId,
      startTime: 500,
      endTime: 700
    };

    const modifiedQcSegment = cloneDeep(qcSegment);
    modifiedQcSegment.versionHistory.push(modifiedQcSegmentVersion);

    const expectedDispatchResult = {
      payload: modifiedQcSegment,
      type: 'data/updateQcSegment'
    };

    expect(mockDispatch).toHaveBeenCalledWith(expectedDispatchResult);
  });
});
