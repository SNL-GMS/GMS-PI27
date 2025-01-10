import { IanDisplays, toDisplayTitle } from '@gms/common-model/lib/displays/types';
import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import type { WaveformComponentProps } from './types';

const WaveformLazy = React.lazy(async () =>
  import(/* webpackChunkName: 'ui-app-waveform' */ './waveform-container').then(module => ({
    default: module.Waveform
  }))
);

export function Waveform(props: WaveformComponentProps) {
  return (
    <React.Suspense
      fallback={nonIdealStateWithSpinner(toDisplayTitle(IanDisplays.WAVEFORM), 'Loading display')}
    >
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <WaveformLazy {...props} />
    </React.Suspense>
  );
}
