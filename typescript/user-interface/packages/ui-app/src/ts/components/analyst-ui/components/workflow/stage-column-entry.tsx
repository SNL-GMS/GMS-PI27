import type { WorkflowTypes } from '@gms/common-model';
import React from 'react';

import { SequenceIntervalCell } from './sequence-interval-cell';

export interface StageColumnEntryProps {
  readonly stageInterval: WorkflowTypes.StageInterval;
  readonly workflow: WorkflowTypes.Workflow | undefined;
}

function StageColumnEntryComponent(props: React.PropsWithChildren<StageColumnEntryProps>) {
  const { stageInterval, workflow } = props;
  return (
    <SequenceIntervalCell
      stageInterval={stageInterval}
      key={stageInterval.intervalId.definitionId.name}
      workflow={workflow}
    />
  );
}

/**
 * Row entry wrapper for Sequence cells
 */
export const StageColumnEntry: React.FunctionComponent<StageColumnEntryProps> =
  React.memo(StageColumnEntryComponent);
