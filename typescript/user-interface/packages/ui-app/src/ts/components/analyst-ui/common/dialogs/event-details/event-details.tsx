import type { Depth } from '@gms/common-model/lib/event';
import {
  appendUncertainty,
  appendUncertaintyForTime,
  humanReadable,
  secondsToString,
  toSentenceCase
} from '@gms/common-util';
import type { ImperativeContextMenuProps } from '@gms/ui-core-components';
import { Form, FormTypes, hideImperativeContextMenu } from '@gms/ui-core-components';
import type { ArrivalTime } from '@gms/ui-state';
import {
  selectEventAssociationConflictIds,
  showImperativeReduxContextMenu,
  useAppSelector,
  useEventStatusQuery
} from '@gms/ui-state';
import includes from 'lodash/includes';
import React from 'react';

import { formatNumberForDisplayFixedThreeDecimalPlaces } from '~common-ui/common/table-utils';

import { EventDetailsConflictIcon } from './event-details-conflict-icon';

// !These are tied to event row table types and will not be caught by compiler
// !Since we are returning these as an any from cesium
export interface EventDetailsProps {
  readonly eventId: string;
  readonly time: ArrivalTime;
  readonly latitudeDegrees: number;
  readonly longitudeDegrees: number;
  readonly depthKm: Depth;
}

/**
 * Returns a form item object given location data
 *
 * @param key item and label text
 * @param value data to be displayed
 * @returns a {@link FormTypes.FormItem} object
 */
function getLocationFormItem(key: string, value: number) {
  return {
    itemKey: key,
    labelText: key,
    itemType: FormTypes.ItemType.Display,
    displayText: `${formatNumberForDisplayFixedThreeDecimalPlaces(value)}`,
    displayTextFormat: FormTypes.TextFormats.Time
  };
}

/**
 * EventDetails Component
 */
export function EventDetails({
  eventId,
  time,
  latitudeDegrees,
  longitudeDegrees,
  depthKm
}: EventDetailsProps) {
  const eventIdsInConflict = useAppSelector(selectEventAssociationConflictIds);
  const isConflicted = includes(eventIdsInConflict, eventId);
  const eventStatuses = useEventStatusQuery();
  let eventStatus = 'Not started';
  if (eventStatuses.data && eventStatuses.data[eventId]) {
    eventStatus = eventStatuses.data[eventId].eventStatusInfo.eventStatus;
  }
  // FormTypes.TextFormats.Time allows us to apply monospace typeface per UX
  const formItems: FormTypes.FormItem[] = [];
  formItems.push({
    itemKey: 'Event Time',
    labelText: 'Event Time',
    itemType: FormTypes.ItemType.Display,
    displayText: appendUncertaintyForTime(secondsToString(time.value), time.uncertainty),
    displayTextFormat: FormTypes.TextFormats.Time
  });
  formItems.push(getLocationFormItem('Lat (°)', latitudeDegrees));
  formItems.push(getLocationFormItem('Lon (°)', longitudeDegrees));
  formItems.push({
    itemKey: 'Depth (km)',
    labelText: 'Depth (km)',
    itemType: FormTypes.ItemType.Display,
    displayText: appendUncertainty(
      formatNumberForDisplayFixedThreeDecimalPlaces(depthKm.value).toString(),
      depthKm.uncertainty
    ),
    displayTextFormat: FormTypes.TextFormats.Time
  });
  formItems.push({
    itemKey: 'Workflow Status',
    labelText: 'Workflow Status',
    itemType: FormTypes.ItemType.Display,
    displayText: `${toSentenceCase(humanReadable(eventStatus))}`
  });

  const defaultPanel: FormTypes.FormPanel = {
    formItems,
    name: 'Additional Details'
  };

  return (
    <div className="map-event-details__container">
      <Form
        header="Event Details"
        headerDecoration={isConflicted ? <EventDetailsConflictIcon eventId={eventId} /> : undefined}
        defaultPanel={defaultPanel}
        disableSubmit
        onCancel={() => {
          hideImperativeContextMenu();
        }}
      />
    </div>
  );
}

/**
 * Shows the {@link EventDetails} context Menu.
 *
 * @param event the event that invoked the action
 * @param props the {@link EventDetailsProps} props
 * @param options (optional) imperative context menu options
 */
export const showEventDetails = (
  event: React.MouseEvent | MouseEvent,
  props: EventDetailsProps,
  options: Pick<ImperativeContextMenuProps, 'activeElementOnClose' | 'onClose'> = {
    activeElementOnClose: undefined,
    onClose: undefined
  }
) => {
  const { depthKm, eventId, latitudeDegrees, longitudeDegrees, time } = props;
  event.preventDefault();
  showImperativeReduxContextMenu({
    content: (
      <EventDetails
        depthKm={depthKm}
        eventId={eventId}
        latitudeDegrees={latitudeDegrees}
        longitudeDegrees={longitudeDegrees}
        time={time}
      />
    ),
    ...options,
    targetOffset: {
      left: event.clientX,
      top: event.clientY
    }
  });
};
