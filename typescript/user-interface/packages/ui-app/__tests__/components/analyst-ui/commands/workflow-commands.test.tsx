import { getStore, userSessionActions, workflowActions } from '@gms/ui-state';
import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import { Provider } from 'react-redux';

import { useWorkflowCommands } from '../../../../src/ts/components/analyst-ui/commands/workflow-commands';
import type { Command } from '../../../../src/ts/components/common-ui/components/command-palette/types';
import { CommandType } from '../../../../src/ts/components/common-ui/components/command-palette/types';

const store = getStore();

jest.mock('@gms/ui-state/lib/app/api/workflow/workflow-api-slice', () => {
  const actual = jest.requireActual('@gms/ui-state/lib/app/api/workflow/workflow-api-slice');
  const workflowData = jest.requireActual('../../../__data__/workflow-data');
  return {
    ...actual,
    useStageIntervalsByIdAndTimeQuery: jest
      .fn()
      .mockReturnValue({ data: workflowData.stageIntervals })
  };
});

const createMockOpenInterval = () => {
  store.dispatch(workflowActions.setOpenActivityNames(['AL1 Event Review']));
  store.dispatch(workflowActions.setOpenIntervalName('AL1'));
  store.dispatch(
    userSessionActions.setAuthenticationStatus({
      userName: 'TestUser',
      authenticated: true,
      authenticationCheckComplete: true,
      failedToConnect: false
    })
  );
  store.dispatch(
    workflowActions.setTimeRange({ startTimeSecs: 1669150800, endTimeSecs: 1669151800 })
  );
};

describe('Workflow commands', () => {
  describe('Close interval', () => {
    it('does not have a close interval command if no interval is open', () => {
      const renderedCommandResult = renderHook<{ children }, Command[]>(useWorkflowCommands, {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      });
      const renderedCommands = renderedCommandResult.result.current;
      const closeIntervalCommand = renderedCommands.find(
        c => c.commandType === CommandType.CLOSE_INTERVAL
      );
      expect(closeIntervalCommand).toBeUndefined();
    });
    it('has a close interval command', () => {
      createMockOpenInterval();
      const renderedCommandResult = renderHook<{ children }, Command[]>(useWorkflowCommands, {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
      });
      const renderedCommands = renderedCommandResult.result.current;
      const closeIntervalCommand = renderedCommands.find(
        c => c.commandType === CommandType.CLOSE_INTERVAL
      );
      expect(closeIntervalCommand).toBeDefined();
    });
  });
  describe('Open interval', () => {
    it('has an open interval command for AL1', () => {
      createMockOpenInterval();
      const renderedCommandResult = renderHook<{ children }, Command[]>(
        () => useWorkflowCommands(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
        }
      );
      const renderedCommands = renderedCommandResult.result.current;
      const openIntervalCommands = renderedCommands.find(
        c => c.commandType === CommandType.OPEN_INTERVAL
      );
      expect(openIntervalCommands).toBeDefined();
    });
  });
});
