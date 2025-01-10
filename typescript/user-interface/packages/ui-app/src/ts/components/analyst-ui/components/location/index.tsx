import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import type { LocationProps } from './types';

const LocationLazy = React.lazy(async () =>
  import(/* webpackChunkName: 'ui-app-location' */ './location-container').then(module => ({
    default: module.ReduxLocationContainer
  }))
);

export function Location(props: LocationProps) {
  return (
    <React.Suspense fallback={nonIdealStateWithSpinner()}>
      <React.StrictMode>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <LocationLazy {...props} />
      </React.StrictMode>
    </React.Suspense>
  );
}
