import { DEFAULT_PRIORITY, Priority } from '@gms/common-model/lib/endpoints/types';
import { Logger } from '@gms/common-util';
import type { ServiceDefinition } from '@gms/ui-workers';

import type { EventServices } from './data/event/endpoint-configuration';
import type { FkComputeServices } from './data/fk/endpoint-configuration';
import type { SignalDetectionServices } from './data/signal-detection/endpoint-configuration';
import type { ChannelSegmentServices } from './data/waveform/endpoint-configuration';
import type { EventManagerServices } from './event-manager/endpoint-configuration';
import type { ProcessingConfigurationServices } from './processing-configuration';
import type { SignalEnhancementConfigurationServices } from './signal-enhancement-configuration/endpoint-configuration';
import type { StationManagerServices } from './station-definition/endpoint-configuration';
import type { UserManagerServices } from './user-manager/endpoint-configuration';
import type { WorkflowServices } from './workflow/endpoint-configuration';

const logger = Logger.create('GMS_LOG_REQUEST_PRIORITY', process.env.GMS_LOG_REQUEST_PRIORITY);

/**
 * Contains a key representing each endpoint, which exactly matches the keys used
 * in the respective endpointConfiguration files
 */
export type RequestOperations =
  | ChannelSegmentServices
  | EventServices
  | EventManagerServices
  | FkComputeServices
  | ProcessingConfigurationServices
  | SignalDetectionServices
  | SignalEnhancementConfigurationServices
  | StationManagerServices
  | UserManagerServices
  | WorkflowServices;

/**
 * A map of service endpoints to priorities, indicating the relative priorities of each request,
 * which will determine which requests should get priority if waiting in the request queue.
 */
export const RequestPriorities: Record<RequestOperations, Priority> = {
  // Keys are sorted by priority

  // HIGHEST_PRIORITY
  findEventsByAssociatedSignalDetectionHypotheses: Priority.HIGHEST,
  getStationGroupsByNames: Priority.HIGHEST,
  getStations: Priority.HIGHEST,

  // HIGH_PRIORITY
  findEventStatusInfoByStageIdAndEventIds: Priority.HIGH,
  getUserProfile: Priority.HIGH,
  stageIntervalsByIdAndTime: Priority.HIGH,
  updateActivityIntervalStatus: Priority.HIGH,
  updateStageIntervalStatus: Priority.HIGH,
  workflow: Priority.HIGH,

  // MEDIUM_HIGH_PRIORITY
  getFilterDefinitionsForSignalDetections: Priority.MEDIUM_HIGH,
  getDefaultFilterDefinitionByUsageForChannelSegments: Priority.MEDIUM_HIGH,
  getDefaultFilterDefinitionsForSignalDetectionHypotheses: Priority.MEDIUM_HIGH,
  getDefaultFilterDefinitionByUsageMap: Priority.MEDIUM_HIGH,
  getChannelSegment: Priority.MEDIUM_HIGH,
  getEventsWithDetectionsAndSegmentsByTime: Priority.MEDIUM_HIGH,
  getProcessingConfiguration: Priority.MEDIUM_HIGH,
  computeFkSpectra: Priority.MEDIUM_HIGH,
  findEventBeamsByEventHypothesisAndStations: Priority.MEDIUM_HIGH,

  // MEDIUM PRIORITY
  getChannelsByNamesTimeRange: Priority.MEDIUM,
  getDetectionsWithSegmentsByStationsAndTime: Priority.MEDIUM,
  predictFeaturesForEventLocation: Priority.MEDIUM,
  setUserProfile: Priority.MEDIUM,

  // MEDIUM_LOW_PRIORITY
  getSignalEnhancementConfiguration: Priority.MEDIUM_LOW,
  getStationsEffectiveAtTimes: Priority.MEDIUM_LOW,
  predictFeaturesForLocationSolution: Priority.MEDIUM_LOW,
  findQCSegmentsByChannelAndTimeRange: Priority.MEDIUM_LOW,
  getProcessingMaskDefinitions: Priority.MEDIUM_LOW,
  getBeamformingTemplates: Priority.MEDIUM_LOW,
  getRotationTemplates: Priority.MEDIUM_LOW,
  getFkReviewablePhases: Priority.MEDIUM_LOW,
  getFkSpectraTemplates: Priority.MEDIUM_LOW,
  findEventBeamsByEventHypothesisAndStationsQuery: Priority.MEDIUM_LOW,

  // LOWEST_PRIORITY
  updateEventStatus: Priority.LOWEST
};

/**
 * Injects `priority` properties from {@link RequestPriorities} into the `requestConfig`.
 * If a request does not exist in {@link RequestPriorities}, this function will log a warning.
 *
 * @param services a record containing keys that match request names in {@link RequestPriorities}
 * and values that contain the request configuration.
 * @returns the same request object, but with priorities from {@link RequestPriorities} added
 * to each `requestConfig` object that has a priority assigned to it.
 */
export function prioritizeRequests<T extends Partial<RequestOperations>>(
  services: Record<T, ServiceDefinition>
): Record<T, ServiceDefinition> {
  const prioritizedServices: Record<RequestOperations, ServiceDefinition> = {};
  (Object.keys(services) as RequestOperations[]).forEach(requestKey => {
    if (!RequestPriorities[requestKey]) {
      logger.warn(
        `Request to ${services[requestKey].requestConfig.url} does not have an explicit priority. It will be made with the default priority of ${DEFAULT_PRIORITY}.`
      );
    }
    prioritizedServices[requestKey] = {
      friendlyName: services[requestKey].friendlyName,
      requestConfig: {
        ...services[requestKey].requestConfig,
        priority: RequestPriorities[requestKey]
      }
    };
  });
  return prioritizedServices;
}
