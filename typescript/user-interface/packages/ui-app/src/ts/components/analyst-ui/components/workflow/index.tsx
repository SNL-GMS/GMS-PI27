import { IanDisplays, toDisplayTitle } from '@gms/common-model/lib/displays/types';
import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import type { WorkflowComponentProps } from './workflow-component';

const WorkflowLazy = React.lazy(async () =>
  import(/* webpackChunkName: 'ui-app-workflow' */ './workflow-component').then(module => ({
    default: module.WorkflowComponent
  }))
);

export function Workflow(props: Readonly<WorkflowComponentProps>) {
  return (
    <React.Suspense
      fallback={nonIdealStateWithSpinner(toDisplayTitle(IanDisplays.WORKFLOW), 'Loading Display')}
    >
      <React.StrictMode>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <WorkflowLazy {...props} />
      </React.StrictMode>
    </React.Suspense>
  );
}
