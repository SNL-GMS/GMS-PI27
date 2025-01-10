/** Web worker operations */
export const WorkerOperations = {
  COMPUTE_LEGACY_FK_SPECTRA: 'computeLegacyFkSpectra',
  COMPUTE_FK_SPECTRA: 'computeFkSpectra',
  DESIGN_FILTER: 'designFilter',
  EXPORT_CHANNEL_SEGMENTS: 'exportChannelSegments',
  EXPORT_WAVEFORM_STORE: 'exportWaveformStore',
  IMPORT_WAVEFORM_STORE: 'importWaveformStore',
  FETCH_SIGNAL_DETECTIONS_WITH_SEGMENTS_BY_STATIONS_TIME:
    'fetchSignalDetectionsWithSegmentsByStationsAndTime',
  FETCH_CHANNEL_SEGMENTS_BY_CHANNEL: 'fetchChannelSegmentsByChannel',
  FETCH_EVENT_BEAMS_BY_EVENT_HYPOTHESIS_AND_STATIONS: 'fetchEventBeamsByEventHypothesisAndStations',
  FETCH_EVENTS_WITH_DETECTIONS_AND_SEGMENTS_BY_TIME: 'fetchEventsWithDetectionsAndSegmentsByTime',
  FILTER_CHANNEL_SEGMENT: 'filterChannelSegment',
  FILTER_CHANNEL_SEGMENTS: 'filterChannelSegments',
  FETCH_EVENTS_BY_ASSOCIATED_SIGNAL_DETECTION_HYPOTHESES:
    'fetchEventsByAssociatedSignalDetectionHypotheses',
  FETCH_CHANNELS_BY_NAMES_TIME_RANGE: 'fetchChannelsByNamesTimeRange',
  FETCH_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTIONS: 'fetchFilterDefinitionsForSignalDetections',
  FETCH_DEFAULT_FILTER_DEFINITION_BY_USAGE_FOR_CHANNEL_SEGMENTS:
    'fetchDefaultFilterDefinitionByUsageForChannelSegments',
  FETCH_PROCESSING_MASK_DEFINITIONS: 'fetchProcessingMaskDefinitions',
  FETCH_DEFAULT_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTION_HYPOTHESES:
    'fetchDefaultFilterDefinitionsForSignalDetectionHypotheses',
  GET_WAVEFORM: 'getWaveform',
  GET_BOUNDARIES: 'getBoundaries',
  GET_PEAK_FK_ATTRIBUTES: 'getPeakFkAttributes',
  CLEAR_WAVEFORMS: 'clearWaveforms',
  MASK_AND_BEAM_WAVEFORMS: 'maskAndBeamWaveforms',
  MASK_AND_ROTATE_2D: 'maskAndRotate2d'
};
