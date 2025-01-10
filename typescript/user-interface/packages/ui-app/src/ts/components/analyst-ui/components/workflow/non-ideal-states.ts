import { Endpoints } from '@gms/common-model';
import { capitalizeFirstLetters } from '@gms/common-util';
import type { NonIdealStateDefinition } from '@gms/ui-core-components';
import {
  nonIdealStateWithError,
  nonIdealStateWithNoSpinner,
  nonIdealStateWithSpinner
} from '@gms/ui-core-components';
import type { StageIntervalsByIdAndTimeQuery, WorkflowQuery } from '@gms/ui-state';

export const workflowQueryNonIdealStates: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: { workflowQuery: WorkflowQuery }): boolean => {
      return props.workflowQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Workflow Data')
  },
  {
    condition: (props: { workflowQuery: WorkflowQuery }): boolean => {
      return (
        props.workflowQuery?.isError &&
        (props.workflowQuery?.error?.message?.includes('404') ||
          props.workflowQuery?.error?.message?.includes('503'))
      );
    },
    element: nonIdealStateWithError(
      'Error',
      `Unable to communicate with ${capitalizeFirstLetters(
        Endpoints.WorkflowManagerServiceUrls.workflow.friendlyName
      )} Service`
    )
  },
  {
    condition: (props: { workflowQuery: WorkflowQuery }): boolean => {
      return props.workflowQuery?.isError;
    },
    element: nonIdealStateWithError('Error', 'Problem loading workflow data')
  },
  {
    condition: (props: { workflowQuery: WorkflowQuery }): boolean => {
      return (
        !props.workflowQuery?.isLoading &&
        !props.workflowQuery?.isError &&
        !props.workflowQuery?.data &&
        props.workflowQuery?.data.stages.length === 0
      );
    },
    element: nonIdealStateWithNoSpinner('No Data', 'Workflow stages returned empty', 'exclude-row')
  }
];

export const workflowIntervalQueryNonIdealStates: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: {
      readonly hasFetchedInitialIntervals: boolean;
      workflowIntervalQuery: StageIntervalsByIdAndTimeQuery;
    }): boolean => {
      // only show the loading state if the on the initial fetch of the interval data
      return !props.hasFetchedInitialIntervals && props.workflowIntervalQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Workflow Interval Data')
  },
  {
    condition: (props: { workflowIntervalQuery: StageIntervalsByIdAndTimeQuery }): boolean => {
      return (
        !props.workflowIntervalQuery?.isLoading &&
        !props.workflowIntervalQuery?.isError &&
        (!props.workflowIntervalQuery.data || props.workflowIntervalQuery.data.length === 0)
      );
    },
    element: nonIdealStateWithNoSpinner('No Data', 'Stage intervals returned empty', 'exclude-row')
  },
  {
    condition: (props: { workflowIntervalQuery: StageIntervalsByIdAndTimeQuery }): boolean => {
      return props.workflowIntervalQuery?.isError;
    },
    element: nonIdealStateWithError('Error', 'Problem loading workflow interval data')
  }
];
