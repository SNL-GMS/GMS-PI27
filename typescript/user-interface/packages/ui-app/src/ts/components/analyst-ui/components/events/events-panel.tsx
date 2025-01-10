import { WithNonIdealStates } from '@gms/ui-core-components';
import { useEventStatusQuery, useGetEvents } from '@gms/ui-state';
import React from 'react';

import { eventNonIdealStateDefinitions } from '~analyst-ui/common/non-ideal-states/non-ideal-state-defs';

import type { EventsTablePanelProps } from './events-table-panel';
import { EventsTablePanel } from './events-table-panel';

export const EventsTablePanelOrNonIdealState = WithNonIdealStates<EventsTablePanelProps>(
  [...eventNonIdealStateDefinitions],
  EventsTablePanel
);

export function EventsPanel() {
  const eventResults = useGetEvents();
  // Ensures the eventStatusQuery fires right away, reduces loading times/re-renders in the table
  useEventStatusQuery();

  return <EventsTablePanelOrNonIdealState eventResults={eventResults} />;
}
