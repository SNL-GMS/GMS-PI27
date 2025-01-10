import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import type { MagnitudeProps } from './types';

const MagnitudeLazy = React.lazy(async () =>
  import(/* webpackChunkName: 'ui-app-magnitude' */ './magnitude-container').then(module => ({
    default: module.ReduxMagnitudeContainer
  }))
);

export function Magnitude(props: MagnitudeProps) {
  return (
    <React.Suspense fallback={nonIdealStateWithSpinner()}>
      <React.StrictMode>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <MagnitudeLazy {...props} />
      </React.StrictMode>
    </React.Suspense>
  );
}
