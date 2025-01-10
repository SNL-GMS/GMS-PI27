import { IanDisplays, toDisplayTitle } from '@gms/common-model/lib/displays/types';
import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import type { FiltersComponentProps } from './filters-component';

const FiltersLazy = React.lazy(async () =>
  import(/* webpackChunkName: 'ui-app-filters' */ './filters-component').then(module => ({
    default: module.FiltersComponent
  }))
);

export function Filters(props: FiltersComponentProps) {
  return (
    <React.Suspense
      fallback={nonIdealStateWithSpinner(toDisplayTitle(IanDisplays.FILTERS), 'Loading display')}
    >
      <React.StrictMode>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <FiltersLazy {...props} />
      </React.StrictMode>
    </React.Suspense>
  );
}
