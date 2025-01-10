import { toOSDTime } from '@gms/common-util';
import { useAppSelector } from '@gms/ui-state';
import { UILogger } from '@gms/ui-util';
import React from 'react';
import { toast } from 'react-toastify';

import type { Command } from '~common-ui/components/command-palette';
import { CommandType } from '~common-ui/components/command-palette';

import {
  useCloseInterval,
  useCurrentActivityIntervals,
  useSetOpenInterval
} from '../components/workflow/workflow-util';
import { useBestInterval } from './workflow-commands-util';

const logger = UILogger.create('GMS_LOG_WORKFLOW_COMMANDS', process.env.GMS_LOG_WORKFLOW_COMMANDS);

/**
 * @returns a list of commands for manipulating the workflow: one to open an AL1 interval,
 * one to open an AL2 interval, and one to close the currently open interval.
 */
export const useWorkflowCommands = (): Command[] => {
  const workflowIntervalAL1 = useBestInterval('AL1');
  const workflowIntervalAL2 = useBestInterval('AL2');
  const currentIntervalName = useAppSelector(state => state.app.workflow.openIntervalName);
  const openInterval = useSetOpenInterval();
  const closeInterval = useCloseInterval();
  const currentActivityIntervals = useCurrentActivityIntervals();
  return React.useMemo((): Command[] => {
    const commands: Command[] = [];
    if (currentIntervalName && currentActivityIntervals && currentActivityIntervals.length > 0) {
      commands.push({
        commandType: CommandType.CLOSE_INTERVAL,
        searchTags: ['close', 'interval'],
        displayText: 'Workflow: Close Open Interval',
        action: () => {
          currentActivityIntervals.forEach(ai => {
            closeInterval(ai).catch(reason => logger.error(reason));
          });
          toast.info('Closed open interval', {
            toastId: 'toast-closed-open-interval'
          });
        }
      });
    }

    if (workflowIntervalAL1) {
      commands.push({
        commandType: CommandType.OPEN_INTERVAL,
        displayText: 'Workflow: Open AL1 Interval',
        searchTags: ['open', 'interval', 'al1'],
        action: async () => {
          toast.info(`Opening interval at ${toOSDTime(workflowIntervalAL1.intervalId.startTime)}`, {
            toastId: 'toast-open-interval'
          });
          await openInterval(workflowIntervalAL1);
        }
      });
    }

    if (workflowIntervalAL2) {
      commands.push({
        commandType: CommandType.OPEN_INTERVAL,
        displayText: 'Workflow: Open AL2 Interval',
        searchTags: ['open', 'interval', 'AL2'],
        action: async () => {
          toast.info(`Opening interval at ${toOSDTime(workflowIntervalAL2.intervalId.startTime)}`, {
            toastId: 'toast-open-interval'
          });
          await openInterval(workflowIntervalAL2);
        }
      });
    }
    return commands;
  }, [
    closeInterval,
    currentActivityIntervals,
    currentIntervalName,
    openInterval,
    workflowIntervalAL1,
    workflowIntervalAL2
  ]);
};
