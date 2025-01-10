import { IanDisplays, toDisplayTitle } from '@gms/common-model/lib/displays/types';
import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import type { StationPropertiesComponentProps } from './types';

const StationPropertiesLazy = React.lazy(async () =>
  import(/* webpackChunkName: 'ui-app-station-properties' */ './station-properties-component').then(
    module => ({
      default: module.StationPropertiesComponent
    })
  )
);

export function StationProperties(props: StationPropertiesComponentProps) {
  return (
    <React.Suspense
      fallback={nonIdealStateWithSpinner(
        toDisplayTitle(IanDisplays.STATION_PROPERTIES),
        'Loading display'
      )}
    >
      <React.StrictMode>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <StationPropertiesLazy {...props} />
      </React.StrictMode>
    </React.Suspense>
  );
}
