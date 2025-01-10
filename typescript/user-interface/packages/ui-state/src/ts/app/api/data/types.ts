import type { BeamformingTemplateTypes, FkTypes, RotationTypes } from '@gms/common-model';

import type {
  AssociationConflictRecord,
  ChannelRecord,
  EventsRecord,
  FilterDefinitionsForSignalDetectionsRecord,
  FilterDefinitionsRecord,
  FkChannelSegmentRecord,
  FkFrequencyThumbnailRecord,
  QcSegmentRecord,
  SignalDetectionsRecord,
  UIChannelSegmentRecord
} from '../../../types';
import type { GetChannelsByNamesHistory } from './channel/types';
import type {
  PredictFeaturesForEventLocation,
  PredictFeaturesForEventLocationHistory
} from './event/predict-features-for-event-location';
import type {
  FindEventsByAssociatedSignalDetectionHypothesesHistory,
  GetEventsWithDetectionsAndSegmentsByTimeHistory
} from './event/types';
import type { ComputeFkSpectraHistory } from './fk/types';
import type { GetFilterDefinitionsForSignalDetectionsHistory } from './signal-detection/get-filter-definitions-for-signal-detections';
import type { GetSignalDetectionsWithSegmentsByStationAndTimeHistory } from './signal-detection/get-signal-detections-segments-by-station-time';
import type {
  FilterDefinitionByUsage,
  FilterDefinitionByUsageRecord,
  GetBeamformingTemplatesHistory,
  GetFilterDefinitionByUsageHistory,
  GetFkReviewablePhasesHistory,
  GetFkSpectraTemplatesHistory,
  GetProcessingMaskDefinitionsHistory,
  GetRotationTemplatesHistory,
  ProcessingMaskDefinitionByProcessingOperationByPhaseByChannel
} from './signal-enhancement';
import type {
  FindEventBeamsByEventHypothesisAndStationsHistory,
  UiChannelSegmentByEventHypothesisId
} from './waveform';
import type { FindQCSegmentsByChannelAndTimeRangeHistory } from './waveform/find-qc-segments-by-channel-and-time-range';
import type { GetChannelSegmentsByChannelHistory } from './waveform/get-channel-segments-by-channel';

/**
 * Defines the Data slice state.
 */
export interface DataState {
  /** the channel segments - by unique channel name - populated by multiple queries */
  uiChannelSegments: UIChannelSegmentRecord;

  /** FK channel segment records */
  fkChannelSegments: FkChannelSegmentRecord;

  /** Fk frequency thumbnails record */
  fkFrequencyThumbnails: FkFrequencyThumbnailRecord;

  /** the channels by effectiveTime populated by the getChannelsByNamesTimeRange query */
  channels: {
    raw: ChannelRecord;
    beamed: ChannelRecord;
    filtered: ChannelRecord;
  };
  /** the signal detections - by signal detection id - populated by multiple queries */
  signalDetections: SignalDetectionsRecord;
  /** the events - by time- populated by multiple queries */
  events: EventsRecord;
  eventBeams: UiChannelSegmentByEventHypothesisId;
  /** the association conflicts for events in conflict */
  associationConflict: AssociationConflictRecord;
  /** designed filter definitions */
  filterDefinitions: FilterDefinitionsRecord;
  /** filter definitions for signal detections */
  filterDefinitionsForSignalDetections: FilterDefinitionsForSignalDetectionsRecord;
  /** default filter definitions */
  defaultFilterDefinitionsMap: FilterDefinitionByUsage;
  /** qc segments by unique channel name */
  qcSegments: QcSegmentRecord;
  /** Processing Mask definitions */
  processingMaskDefinitionsByChannels: ProcessingMaskDefinitionByProcessingOperationByPhaseByChannel[];
  /** Beamforming templates */
  beamformingTemplates: BeamformingTemplateTypes.BeamformingTemplatesByBeamTypeByStationByPhase;
  /** Rotation templates */
  rotationTemplates: RotationTypes.RotationTemplateByPhaseByStationRecord;
  /** filter definitions by usage map */
  filterDefinitionsForUsage: FilterDefinitionByUsageRecord;
  /** feature predictions for event locations */
  predictFeaturesForEventLocation: PredictFeaturesForEventLocation;

  /**
   * FK Reviewable phases, organized as a record of records.
   * Top-level key is an activity name, inner record key is a station name.
   */
  fkReviewablePhases: FkTypes.FkReviewablePhasesByActivityNameByStation;
  /** FK Spectra Templates */
  fkSpectraTemplates: FkTypes.FkSpectraTemplatesByStationByPhase;
  /** query history */
  queries: {
    /** the history record of the computeFkSpectra call */
    computeFkSpectra: ComputeFkSpectraHistory;
    /** the history record of the getChannelSegmentsByChannel query */
    getChannelSegmentsByChannel: GetChannelSegmentsByChannelHistory;
    /** the history record of the findQCSegmentsByChannelAndTimeRange query */
    findQCSegmentsByChannelAndTimeRange: FindQCSegmentsByChannelAndTimeRangeHistory;
    /** the history record of the findEventBeamsByEventHypothesisAndStations query */
    findEventBeamsByEventHypothesisAndStations: FindEventBeamsByEventHypothesisAndStationsHistory;
    /** the history record of the getSignalDetectionWithSegmentsByStationAndTime query */
    getSignalDetectionWithSegmentsByStationAndTime: GetSignalDetectionsWithSegmentsByStationAndTimeHistory;
    /** the history record of the getEventsWithDetectionsAndSegmentsByTime query */
    getEventsWithDetectionsAndSegmentsByTime: GetEventsWithDetectionsAndSegmentsByTimeHistory;
    /** the history record of the findEventsByAssociatedSignalDetectionHypotheses query */
    findEventsByAssociatedSignalDetectionHypotheses: FindEventsByAssociatedSignalDetectionHypothesesHistory;
    /** the history record of the getChannelsByName query */
    getChannelsByNamesTimeRange: GetChannelsByNamesHistory;
    /** the history record of the getFilterDefinitionsByUsage query */
    getFilterDefinitionsForSignalDetections: GetFilterDefinitionsForSignalDetectionsHistory;
    /** the history record of the getProcessingMaskDefinitions query */
    getProcessingMaskDefinitions: GetProcessingMaskDefinitionsHistory;
    /** the history record of the getBeamformingTemplates query */
    getBeamformingTemplates: GetBeamformingTemplatesHistory;
    /** the history record of the getRotationTemplates query */
    getRotationTemplates: GetRotationTemplatesHistory;
    /** the history record of the getFkReviewablePhases query */
    getFkReviewablePhases: GetFkReviewablePhasesHistory;
    /** the history record of the getFkSpectraTemplates query */
    getFkSpectraTemplates: GetFkSpectraTemplatesHistory;
    /** the history record of the getFilterDefinitionsByUsageMap */
    getFilterDefinitionsByUsageMap: GetFilterDefinitionByUsageHistory;
    /** the history record of the {@link PredictFeaturesForEventLocationHistory} */
    predictFeaturesForEventLocation: PredictFeaturesForEventLocationHistory;
  };
}

export type DataStateKeys = keyof DataState;
