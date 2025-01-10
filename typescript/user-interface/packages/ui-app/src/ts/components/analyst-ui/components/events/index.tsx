import { IanDisplays, toDisplayTitle } from '@gms/common-model/lib/displays/types';
import { nonIdealStateWithSpinner } from '@gms/ui-core-components';
import React from 'react';

import type { EventsComponentProps } from './events-component';

const EventsLazy = React.lazy(async () =>
  import(/* webpackChunkName: 'ui-app-events' */ './events-component').then(module => ({
    default: module.EventsComponent
  }))
);

export function Events(props: EventsComponentProps) {
  return (
    <React.Suspense
      fallback={nonIdealStateWithSpinner(toDisplayTitle(IanDisplays.EVENTS), 'Loading display')}
    >
      <React.StrictMode>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <EventsLazy {...props} />
      </React.StrictMode>
    </React.Suspense>
  );
}
