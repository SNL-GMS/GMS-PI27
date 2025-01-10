import { IanDisplays, toDisplayTitle } from '@gms/common-model/lib/displays/types';
import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import type { AzimuthSlownessProps } from './types';

const AzimuthSlownessLazy = React.lazy(async () =>
  import(/* webpackChunkName: 'ui-app-azimuth-slowness' */ './azimuth-slowness-component').then(
    module => ({ default: module.AzimuthSlowness })
  )
);

export function AzimuthSlowness(props: AzimuthSlownessProps) {
  return (
    <React.Suspense
      fallback={nonIdealStateWithSpinner(
        toDisplayTitle(IanDisplays.AZIMUTH_SLOWNESS),
        'Loading Display'
      )}
    >
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <AzimuthSlownessLazy {...props} />
    </React.Suspense>
  );
}
