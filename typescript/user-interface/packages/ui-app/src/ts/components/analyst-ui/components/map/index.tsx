import { IanDisplays, toDisplayTitle } from '@gms/common-model/lib/displays/types';
import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import type { MapComponentProps } from './map-component';

const IANMapLazy = React.lazy(async () =>
  import(/* webpackChunkName: 'ui-app-ian-map' */ './map-component').then(module => ({
    default: module.IANMap
  }))
);

export function IANMap(props: MapComponentProps) {
  return (
    <React.Suspense
      fallback={nonIdealStateWithSpinner(toDisplayTitle(IanDisplays.MAP), 'Loading Display')}
    >
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <IANMapLazy {...props} />
    </React.Suspense>
  );
}
