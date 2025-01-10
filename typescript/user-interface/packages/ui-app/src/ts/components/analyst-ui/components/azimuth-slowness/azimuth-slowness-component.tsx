import type { CommonTypes, EventTypes } from '@gms/common-model';
import { openIntervalName } from '@gms/common-model/__tests__/__data__';
import { IanDisplays } from '@gms/common-model/lib/displays/types';
import type { Nullable } from '@gms/common-model/lib/type-util/type-util';
import { WithNonIdealStates } from '@gms/ui-core-components';
import type { EventsFetchResult, SignalDetectionFetchResult, StationQuery } from '@gms/ui-state';
import {
  selectOpenEvent,
  selectSdIdsToShowFk,
  selectWorkflowTimeRange,
  useAppSelector,
  useEffectiveTime,
  useGetAllStationsQuery,
  useGetEvents,
  useGetSignalDetections
} from '@gms/ui-state';
import type { WeavessInstance } from '@gms/weavess-core/lib/types';
import React from 'react';

import { AnalystNonIdealStates } from '~analyst-ui/common/non-ideal-states';
import { timeRangeNonIdealStateDefinitions } from '~analyst-ui/common/non-ideal-states/non-ideal-state-defs';
import { EventUtils } from '~analyst-ui/common/utils';
import { BaseDisplay } from '~common-ui/components/base-display';
import { CommonNonIdealStateDefs } from '~common-ui/components/non-ideal-states';

import type { WeavessContextData } from '../waveform/weavess-context';
import { WeavessContext } from '../waveform/weavess-context';
import { AzimuthSlownessPanel } from './azimuth-slowness-panel';
import type { AzimuthSlownessProps } from './types';

/**
 * AzimuthSlowness props for use with {@link WithNonIdealStates}
 */
export interface AzimuthSlownessNonIdealStateProps
  extends Omit<AzimuthSlownessProps, 'signalDetections'> {
  /** Used to determine non-ideal state */
  readonly timeRange: Nullable<CommonTypes.TimeRange>;
  readonly openEvent: EventTypes.Event | undefined;
  readonly signalDetectionResults: SignalDetectionFetchResult;
  readonly eventResults: EventsFetchResult;
  readonly stationsQuery: StationQuery;
  readonly associatedSignalDetectionIds: string[];
  readonly unassociatedSignalDetectionIds: string[];
}

const AzimuthSlownessOrNonIdealState = WithNonIdealStates<
  AzimuthSlownessNonIdealStateProps,
  AzimuthSlownessProps
>(
  [
    ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
    ...timeRangeNonIdealStateDefinitions('FKs', 'timeRange', 'open an event'),
    ...AnalystNonIdealStates.azimuthSlownessNonIdealStateDefinitions,
    ...AnalystNonIdealStates.eventNonIdealStateDefinitions,
    ...AnalystNonIdealStates.stationDefinitionNonIdealStateDefinitions,
    ...AnalystNonIdealStates.signalDetectionsNonIdealStateDefinitions
  ],
  AzimuthSlownessPanel
);

export function AzimuthSlowness({ glContainer }: AzimuthSlownessProps) {
  const signalDetectionResults = useGetSignalDetections();
  const sdIdsToShowFk = useAppSelector(selectSdIdsToShowFk);
  const openEvent = useAppSelector(selectOpenEvent);
  const eventResults = useGetEvents();
  const timeRange = useAppSelector(selectWorkflowTimeRange);
  const effectiveAt = useEffectiveTime();
  const stationsQuery = useGetAllStationsQuery(effectiveAt);

  /** Using state rather than ref in order to re-render on update */
  const [weavessInstance, setWeavessInstance] = React.useState<WeavessInstance>();

  const weavessContextValue = React.useMemo<WeavessContextData>(
    () => ({
      weavessRef: weavessInstance,
      setWeavessRef: setWeavessInstance
    }),
    [weavessInstance]
  );

  const associatedSignalDetections = EventUtils.getAssociatedDetections(
    openEvent,
    signalDetectionResults.data ?? [],
    openIntervalName
  );

  return (
    <BaseDisplay
      tabName={IanDisplays.AZIMUTH_SLOWNESS}
      glContainer={glContainer}
      className="azimuth-slowness"
      data-cy="azimuth-slowness"
    >
      <WeavessContext.Provider value={weavessContextValue}>
        <AzimuthSlownessOrNonIdealState
          glContainer={glContainer}
          stationsQuery={stationsQuery}
          timeRange={timeRange}
          openEvent={openEvent}
          signalDetectionResults={signalDetectionResults}
          associatedSignalDetectionIds={associatedSignalDetections.map(sd => sd.id)}
          unassociatedSignalDetectionIds={sdIdsToShowFk}
          eventResults={eventResults}
        />
      </WeavessContext.Provider>
    </BaseDisplay>
  );
}
