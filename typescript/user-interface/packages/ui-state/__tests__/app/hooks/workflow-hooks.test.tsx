import { WorkflowTypes } from '@gms/common-model';
import { openIntervalName, user } from '@gms/common-model/__tests__/__data__';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';

import {
  userSessionActions,
  useUpdateActivityIntervalStatusMutation,
  useUpdateStageIntervalStatusMutation
} from '../../../src/ts/app';
import { useSetInterval, useStageId } from '../../../src/ts/app/hooks/workflow-hooks';
import { workflowActions } from '../../../src/ts/app/state/workflow/workflow-slice';
import { getStore } from '../../../src/ts/app/store';
import { activityInterval, interactiveAnalysisStageInterval } from '../api/workflow/sample-data';

const store = getStore();

jest.mock('../../../src/ts/app/state/workflow/operations', () => {
  const actual = jest.requireActual('../../../src/ts/app/state/workflow/operations');

  return {
    ...actual,
    openOrCloseStage: jest.fn()
  };
});

jest.mock('../../../src/ts/app/api/workflow/workflow-api-slice', () => {
  const actual = jest.requireActual('../../../src/ts/app/api/workflow/workflow-api-slice');

  const mockActivityMutation = jest.fn();
  const mockAnalystStageMutation = jest.fn();

  return {
    ...actual,
    useUpdateActivityIntervalStatusMutation: () => [mockActivityMutation],
    useUpdateStageIntervalStatusMutation: () => [mockAnalystStageMutation],
    useWorkflowQuery: jest.fn(() => ({
      isSuccess: true,
      data: {
        stages: [
          {
            name: openIntervalName,
            mode: WorkflowTypes.StageMode.INTERACTIVE,
            activities: [
              {
                name: activityInterval.intervalId.definitionId.name,
                stationGroup: { name: 'mockStationGroup' }
              }
            ]
          },
          {
            name: 'AL2',
            mode: WorkflowTypes.StageMode.AUTOMATIC,
            activities: [
              {
                name: activityInterval.intervalId.definitionId.name,
                stationGroup: { name: 'mockStationGroup2' }
              }
            ]
          }
        ]
      }
    }))
  };
});

describe('Workflow Hooks', () => {
  describe('useStageId', () => {
    beforeEach(() => {
      store.dispatch(workflowActions.setOpenActivityNames(['AL1 Event Review']));
      store.dispatch(workflowActions.setOpenIntervalName('AL1'));
      store.dispatch(
        workflowActions.setTimeRange({ startTimeSecs: 1669150800, endTimeSecs: 1669154400 })
      );
    });
    it('returns the stage id if one is found', () => {
      const renderedStageIdResult = renderHook<{ children }, WorkflowTypes.IntervalId | undefined>(
        useStageId,
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );
      const renderedStageId = renderedStageIdResult.result.current;
      expect(renderedStageId).toMatchObject<WorkflowTypes.IntervalId>({
        startTime: 1669150800,
        definitionId: {
          name: 'AL1'
        }
      });
    });
    it('returns a newly created stage interval if no interval of the open type is found', () => {
      store.dispatch(workflowActions.setOpenIntervalName('OPENED_WITH_OPEN_ANYTHING')); // there is no OPENED_WITH_OPEN_ANYTHING interval in the mock data
      const renderedStageIdResult = renderHook<{ children }, WorkflowTypes.IntervalId | undefined>(
        useStageId,
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );
      const renderedStageId = renderedStageIdResult.result.current;
      expect(renderedStageId).toMatchObject<WorkflowTypes.IntervalId>({
        startTime: 1669150800,
        definitionId: {
          name: 'OPENED_WITH_OPEN_ANYTHING'
        }
      });
    });
    it('returns a newly created stage interval id if no interval with the expected timeRange is found', () => {
      store.dispatch(workflowActions.setOpenIntervalName('AL1'));
      store.dispatch(
        workflowActions.setTimeRange({ startTimeSecs: 1669150801, endTimeSecs: 1669154401 }) // time range does not match
      );
      const renderedStageIdResult = renderHook<{ children }, WorkflowTypes.IntervalId | undefined>(
        useStageId,
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );
      const renderedStageId = renderedStageIdResult.result.current;
      expect(renderedStageId).toMatchObject<WorkflowTypes.IntervalId>({
        startTime: 1669150801,
        definitionId: {
          name: 'AL1'
        }
      });
    });
    it('returns if a interval is set', () => {
      store.dispatch(
        workflowActions.setTimeRange({ startTimeSecs: 1669150800, endTimeSecs: 1669154400 })
      );
      const renderedStageIdResult = renderHook<{ children }, WorkflowTypes.IntervalId | undefined>(
        useStageId,
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );
      const renderedStageId = renderedStageIdResult.result.current;
      expect(renderedStageId).toBeDefined();
    });

    it('returns undefined if no open time range is set', () => {
      store.dispatch(workflowActions.setOpenIntervalName('AL1'));
      store.dispatch(
        workflowActions.setTimeRange({
          startTimeSecs: null,
          endTimeSecs: null
        })
      );
      const renderedStageIdResult = renderHook<{ children }, WorkflowTypes.IntervalId | undefined>(
        useStageId,
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );
      const renderedStageId = renderedStageIdResult.result.current;
      expect(renderedStageId).toBeUndefined();
    });
  });

  describe('useSetInterval', () => {
    beforeEach(() => {
      store.dispatch(
        userSessionActions.setAuthenticationStatus({
          userName: user,
          authenticated: true,
          authenticationCheckComplete: true,
          failedToConnect: false
        })
      );
      store.dispatch(workflowActions.setOpenIntervalName(openIntervalName));
      store.dispatch(workflowActions.setOpenActivityNames(['AL1 Event Review']));
      store.dispatch(
        workflowActions.setTimeRange({ startTimeSecs: 1669150800, endTimeSecs: 1669154400 })
      );
      jest.clearAllMocks();
    });
    it('handles setting interval status with a stage interval', async () => {
      const [mockAnalystStageMutation] = useUpdateStageIntervalStatusMutation();
      const [mockActivityMutation] = useUpdateActivityIntervalStatusMutation();

      const status: WorkflowTypes.IntervalStatus = WorkflowTypes.IntervalStatus.IN_PROGRESS;
      const { result } = renderHook<
        { children },
        (interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval) => Promise<void>
      >(() => useSetInterval(status), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      });

      expect(result.current).toBeDefined();
      expect(result.current).toMatchSnapshot();
      await result.current(interactiveAnalysisStageInterval);
      expect(mockAnalystStageMutation).toHaveBeenCalled();
      expect(mockActivityMutation).toHaveBeenCalledTimes(0);
    });

    it('handles setting interval status with an activity interval', async () => {
      const [mockAnalystStageMutation] = useUpdateStageIntervalStatusMutation();
      const [mockActivityMutation] = useUpdateActivityIntervalStatusMutation();

      const status: WorkflowTypes.IntervalStatus = WorkflowTypes.IntervalStatus.IN_PROGRESS;
      const { result } = renderHook<
        { children },
        (interval: WorkflowTypes.ActivityInterval | WorkflowTypes.StageInterval) => Promise<void>
      >(() => useSetInterval(status), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      });

      expect(result.current).toBeDefined();
      expect(result.current).toMatchSnapshot();
      await result.current(activityInterval);
      expect(mockActivityMutation).toHaveBeenCalled();
      expect(mockAnalystStageMutation).toHaveBeenCalledTimes(1);
    });
  });
});
