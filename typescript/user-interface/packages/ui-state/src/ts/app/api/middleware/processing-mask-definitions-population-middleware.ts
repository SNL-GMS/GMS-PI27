import { convertToVersionReference } from '@gms/common-model';
import { ProcessingOperation } from '@gms/common-model/lib/channel-segment';
import { UILogger } from '@gms/ui-util';
import type { Action, ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import type { CreateListenerMiddlewareOptions } from '@reduxjs/toolkit/dist/listenerMiddleware/types';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import sortedUniq from 'lodash/sortedUniq';
import type { ThunkDispatch } from 'redux-thunk';

import { UIStateError } from '../../error-handling/ui-state-error';
import {
  analystActions,
  selectCurrentPhase,
  selectPhaseSelectorFavorites,
  selectStationGroup,
  selectTimeRange,
  workflowActions
} from '../../state';
import { selectStationsVisibility } from '../../state/waveform/selectors';
import type { AppState } from '../../store';
import type { GetProcessingMaskDefinitionsQueryArgs } from '../data';
import {
  addRawChannels,
  getProcessingMaskDefinitions,
  getProcessingMaskDefinitionsQuery,
  selectRawChannels
} from '../data';
import { getChannelsByNamesTimeRangeQuery } from '../data/channel/get-channels-by-names-timerange';
import { getChannelSegmentsByChannelQuery } from '../data/waveform/get-channel-segments-by-channel';
import { selectProcessingConfiguration } from '../processing-configuration';
import { dataPopulationOnError, isRejectedAction } from './util';

const logger = UILogger.create(
  'GMS_FETCH_PROCESSING_MASK_DEFINITIONS',
  process.env.GMS_FETCH_PROCESSING_MASK_DEFINITIONS
);

/** rejected actions to listen for to retry the middleware action */
const listenerRejectedActions: string[] = [`${getProcessingMaskDefinitions.typePrefix}/rejected`];

/** actions to listen for to perform the middleware action */
const listenerActions: string[] = [
  analystActions.setPhaseSelectorFavorites.type,
  analystActions.setCurrentPhase.type,
  workflowActions.setStationGroup.type,
  addRawChannels.type,
  `${getChannelSegmentsByChannelQuery.typePrefix}/fulfilled`,
  `${getChannelsByNamesTimeRangeQuery.typePrefix}/fulfilled`,
  // registered reject action; used for retrying the request on failure
  ...listenerRejectedActions
];

type ActionType = typeof getProcessingMaskDefinitions;

type PopulateProcessingMaskDefinitionsListener = ListenerMiddlewareInstance<
  AppState,
  ThunkDispatch<AppState, unknown, Action<ActionType>>,
  unknown
>;

const populateProcessingMaskDefinitionsOptions: CreateListenerMiddlewareOptions<unknown> = {
  onError: dataPopulationOnError,
  extra: {}
};

export const populateProcessingMaskDefinitionsMiddleware: PopulateProcessingMaskDefinitionsListener =
  createListenerMiddleware(populateProcessingMaskDefinitionsOptions);

populateProcessingMaskDefinitionsMiddleware.startListening({
  predicate: function populateEventsWithDetectionsAndSegmentsByTimePredicate(
    action: Action,
    currentState: AppState
  ): action is Action {
    const processingAnalystConfiguration = selectProcessingConfiguration(currentState);

    return (
      processingAnalystConfiguration?.phaseLists != null && includes(listenerActions, action.type)
    );
  },
  effect: function populateEventsWithDetectionsAndSegmentsByTimeEffect(
    action: Action,
    listenerApi
  ) {
    const state = listenerApi.getState();
    listenerApi.fork(() => {
      const processingAnalystConfiguration = selectProcessingConfiguration(state);
      const currentPhase = selectCurrentPhase(state);
      const phaseFavorites = selectPhaseSelectorFavorites(state);
      const rawChannels = Object.values(selectRawChannels(state));
      const stationsVisibility = selectStationsVisibility(state);
      const stationGroup = selectStationGroup(state);
      const { startTimeSecs } = selectTimeRange(state);

      const phases: string[] = [currentPhase];

      processingAnalystConfiguration?.phaseLists?.forEach(phaseList => {
        if (!phaseFavorites[phaseList.listTitle]) {
          phases.push(...phaseList.favorites);
        } else {
          phases.push(...phaseFavorites[phaseList.listTitle]);
        }
      });

      const phaseTypes = sortedUniq(sortBy(phases));

      const visibleChannels = rawChannels.filter(
        channel => stationsVisibility?.[channel.station.name]?.visibility
      );

      const effectiveStationGroup = {
        ...stationGroup,
        effectiveAt: startTimeSecs || stationGroup.effectiveAt
      };

      const args: GetProcessingMaskDefinitionsQueryArgs = {
        phaseTypes,
        stationGroup: effectiveStationGroup,
        channels: visibleChannels.map(chan => convertToVersionReference(chan, 'name')),
        processingOperations: [
          ProcessingOperation.FK_BEAM,
          ProcessingOperation.FK_SPECTRA,
          ProcessingOperation.EVENT_BEAM,
          ProcessingOperation.ROTATION
        ]
      };

      // only fetch if the args are valid
      if (getProcessingMaskDefinitionsQuery.shouldSkip(args)) {
        return;
      }

      // if the previous request to {@link getProcessingMaskDefinitions} was rejected
      // and the args have changed then do not allow the retry of the request
      if (isRejectedAction(action, listenerRejectedActions) && !isEqual(args, action.meta.arg)) {
        return;
      }

      listenerApi.dispatch(getProcessingMaskDefinitions(args)).catch(error => {
        logger.error(`Failed to fetch processing mask definitions`, new UIStateError(error));
      });
    });
  }
});
