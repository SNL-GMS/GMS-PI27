import { IanDisplays, toDisplayTitle } from '@gms/common-model/lib/displays/types';
import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import type { SignalDetectionsComponentProps } from './types';

const SignalDetectionsLazy = React.lazy(async () =>
  import(/* webpackChunkName: 'ui-app-signal-detections' */ './signal-detections-component').then(
    module => ({
      default: module.SignalDetectionsComponent
    })
  )
);

/** Top-level component for the Signal Detections display, lazy-loaded */
export function SignalDetections(props: SignalDetectionsComponentProps) {
  return (
    <React.Suspense
      fallback={nonIdealStateWithSpinner(
        toDisplayTitle(IanDisplays.SIGNAL_DETECTIONS),
        'Loading Display'
      )}
    >
      <React.StrictMode>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <SignalDetectionsLazy {...props} />
      </React.StrictMode>
    </React.Suspense>
  );
}
