/**
 * Enumerates the different possible priorities for requests.
 * ! Note, these need to map to numbers in the transpiled javascript code.
 */
export enum Priority {
  HIGHEST = 7,
  HIGH = 6,
  MEDIUM_HIGH = 5,
  MEDIUM = 4,
  MEDIUM_LOW = 3,
  LOW = 2,
  LOWEST = 1
}

export const DEFAULT_PRIORITY = Priority.MEDIUM;

/**
 * Event Manager Service
 */
export const EventManagerUrls = {
  baseUrl: '/event-manager-service/event' as const,
  getEventsWithDetectionsAndSegmentsByTime: {
    url: '/detections-and-segments/time' as const,
    friendlyName: 'Events by time' as const
  },
  findEventsByAssociatedSignalDetectionHypotheses: {
    url: `/associated-signal-detection-hypotheses` as const,
    friendlyName: 'Events by signal detection association' as const
  },
  predictFeaturesForEventLocation: {
    url: `/predict-for-event-location` as const,
    friendlyName: 'Event feature predictions' as const
  },
  status: { url: `/status` as const, friendlyName: 'Event statuses' as const },
  update: { url: `/update` as const, friendlyName: 'Update event status' as const }
};

/**
 * Fk Control
 */
export const FkControlUrls = {
  baseUrl: '/fk-control-service' as const,
  computeFkSpectra: { url: `/spectra/interactive` as const, friendlyName: 'FK spectra' as const }
};

/**
 * Frameworks OSD Service
 */
export const FrameworksOsdSUrls = {
  baseUrl: '/frameworks-osd-service/osd' as const,
  getProcessingStationGroups: {
    url: `/station-groups` as const,
    friendlyName: 'Station groups' as const
  }
};

/**
 * Processing Configuration
 */
export const ProcessingConfigUrls = {
  baseUrl: '/ui-processing-configuration-service' as const,
  getProcessingConfiguration: {
    url: `/resolve` as const,
    friendlyName: 'Processing configuration' as const
  }
};

/**
 * Signal Detections Manager Service
 */
export const SignalDetectionManagerUrls = {
  baseUrl: '/signal-detection-manager-service/signal-detection' as const,
  getFilterDefinitionsForSignalDetections: {
    url: '/filter-definitions-by-usage/query/signal-detections/canned' as const,
    friendlyName: 'Filter definitions for signal detections' as const
  },
  getDetectionsWithSegmentsByStationsAndTime: {
    url: '/signal-detections-with-channel-segments/query/stations-timerange' as const,
    friendlyName: 'Signal detections by station and time' as const
  }
};

/**
 * Signal Enhancement Configuration
 */
export const SignalEnhancementConfigurationUrls = {
  baseUrl: '/signal-enhancement-configuration-service/signal-enhancement-configuration' as const,
  getSignalEnhancementConfiguration: {
    url: `/filter-lists-definition` as const,
    friendlyName: 'Filter configuration' as const
  },
  getDefaultFilterDefinitionsForSignalDetectionHypotheses: {
    url: '/default-filter-definitions-for-signal-detection-hypotheses' as const,
    friendlyName: 'Filter definitions for signal detections' as const
  },
  getDefaultFilterDefinitionByUsageForChannelSegments: {
    url: '/default-filter-definitions-for-channel-segments' as const,
    friendlyName: 'Filter definitions for channel segments' as const
  },
  getProcessingMaskDefinitions: {
    url: '/processing-mask-definitions' as const,
    friendlyName: 'Processing mask definitions' as const
  },
  getBeamformingTemplates: {
    url: '/beamforming-template' as const,
    friendlyName: 'Beamforming templates' as const
  },
  getRotationTemplates: {
    url: '/rotation-templates' as const,
    friendlyName: 'Rotation templates' as const
  },
  getFkReviewablePhases: {
    url: '/fk-reviewable-phases' as const,
    friendlyName: 'FK reviewable phases' as const
  },
  getFkSpectraTemplates: {
    url: '/fk-spectra-templates' as const,
    friendlyName: 'FK spectra templates' as const
  },
  getDefaultFilterDefinitionByUsageMap: {
    url: '/default-filter-definitions-by-usage-map' as const,
    friendlyName: 'Default filter definitions by usage for channel segments' as const
  }
};

/**
 * Station Definition Service
 */
export const StationDefinitionUrls = {
  baseUrl: '/station-definition-service/station-definition' as const,
  getStationGroupsByNames: {
    url: `/station-groups/query/names` as const,
    friendlyName: 'Station groups' as const
  },
  getStations: { url: `/stations/query/names` as const, friendlyName: 'Stations by name' },
  getStationsEffectiveAtTimes: {
    url: `/stations/query/change-times` as const,
    friendlyName: 'Stations effective at times' as const
  },
  getChannelsByNamesTimeRange: {
    url: `/channels/query/names-timerange` as const,
    friendlyName: 'Channel definitions' as const
  }
};

/**
 * System Event Gateway
 */
export const SystemEventGatewayUrls = {
  baseUrl: '/interactive-analysis-api-gateway' as const,
  sendClientLogs: { url: `/client-log` as const, friendlyName: 'Publish client logs' as const },
  publishDerivedChannels: {
    url: `/publish-derived-channels` as const,
    friendlyName: 'Publish derived channels' as const
  }
};

/**
 * User Manager Service
 */
export const UserManagerServiceUrls = {
  baseUrl: '/user-manager-service' as const,
  getUserProfile: { url: `/user-profile` as const, friendlyName: 'User profile' as const },
  setUserProfile: {
    url: `/user-profile/store` as const,
    friendlyName: 'Set user profile' as const
  }
};

/**
 * Waveform Manager Service
 */
export const WaveformManagerServiceUrls = {
  baseUrl: '/waveform-manager-service/waveform' as const,
  getChannelSegment: {
    url: '/channel-segment/query/channel-timerange' as const,
    friendlyName: 'Channel segments' as const
  },
  findQCSegmentsByChannelAndTimeRange: {
    url: '/qc-segment/query/channel-timerange/canned' as const,
    friendlyName: 'QC segments' as const
  },
  findEventBeamsByEventHypothesisAndStations: {
    url: '/event-beams/query/event-beams-by-event-hypotheses-and-stations',
    friendlyName: 'Event beams by hypothesis and stations' as const
  }
};

/**
 * Workflow Manager Service
 */
export const WorkflowManagerServiceUrls = {
  baseUrl: '/workflow-manager-service/workflow-manager' as const,
  workflow: { url: `/workflow-definition` as const, friendlyName: 'Workflow definitions' as const },
  stageIntervalsByIdAndTime: {
    url: `/interval/stage/query/ids-timerange` as const,
    friendlyName: 'Workflow stage intervals' as const
  },
  updateActivityIntervalStatus: {
    url: `/interval/activity/update` as const,
    friendlyName: 'Update activity interval status' as const
  },
  updateStageIntervalStatus: {
    url: `/interval/stage/interactive-analysis/update` as const,
    friendlyName: 'Update stage interval status' as const
  }
};
