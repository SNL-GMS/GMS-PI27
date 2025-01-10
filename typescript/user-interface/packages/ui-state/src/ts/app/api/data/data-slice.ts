import { UILogger } from '@gms/ui-util';
import { createSlice } from '@reduxjs/toolkit';

import { clearWaveforms } from '../../../workers/api/clear-waveforms';
import { addChannelReducers } from './channel';
import { addGetChannelsByNamesTimeRangeMatchReducers } from './channel/get-channels-by-names-timerange';
import { addEventReducers } from './event/event-reducer';
import { addFindEventsByAssociatedSignalDetectionHypothesesMatchReducers } from './event/find-events-by-assoc-sd-hypotheses';
import { addGetEventsWithDetectionsAndSegmentsByTimeMatchReducers } from './event/get-events-detections-segments-by-time';
import { addPredictFeaturesForEventLocationMatchReducers } from './event/predict-features-for-event-location';
import { addComputeLegacyFkSpectraReducers } from './fk/compute-legacy-fk-spectra';
import { addFkReducers } from './fk/fk-reducer';
import { addGetFilterDefinitionsForSignalDetectionsMatchReducers } from './signal-detection/get-filter-definitions-for-signal-detections';
import { addGetSignalDetectionsWithSegmentsByStationAndTimeMatchReducers } from './signal-detection/get-signal-detections-segments-by-station-time';
import { addSignalDetectionReducers } from './signal-detection/signal-detection-reducer';
import {
  addBeamformingTemplatesMatchReducers,
  addFilterDefinitionsByUsageMapMatchReducers,
  addFkReviewablePhasesMatchReducers,
  addFkSpectraTemplatesMatchReducers,
  addGetProcessingMaskDefinitionsMatchReducers,
  addGetRotationTemplatesMatchReducers
} from './signal-enhancement';
import type { DataState } from './types';
import {
  addChannelSegmentReducers,
  addEventBeamsByEventHypothesisAndStationsMatchReducers,
  addFilterDefinitionReducers,
  addQcReducers
} from './waveform';
import { addFindQCSegmentsByChannelAndTimeRangeMatchReducers } from './waveform/find-qc-segments-by-channel-and-time-range';
import { addGetChannelSegmentsByChannelMatchReducers } from './waveform/get-channel-segments-by-channel';

const logger = UILogger.create('GMS_DATA_SLICE', process.env.GMS_DATA_SLICE);

/**
 * The initial state for the data state.
 * This is the starting state for the {@link dataSlice}
 */
export const dataInitialState: DataState = {
  uiChannelSegments: {},
  fkChannelSegments: {},
  fkFrequencyThumbnails: {},
  signalDetections: {},
  events: {},
  eventBeams: {},
  associationConflict: {},
  filterDefinitions: {},
  filterDefinitionsForSignalDetections: {},
  filterDefinitionsForUsage: {},
  defaultFilterDefinitionsMap: {
    filterDefinitionIdsByUsage: {},
    globalDefaults: {},
    filterDefinitionsById: {}
  },
  channels: {
    raw: {},
    beamed: {},
    filtered: {}
  },
  qcSegments: {},
  predictFeaturesForEventLocation: {},
  queries: {
    computeFkSpectra: {},
    getSignalDetectionWithSegmentsByStationAndTime: {},
    getChannelSegmentsByChannel: {},
    findQCSegmentsByChannelAndTimeRange: {},
    getEventsWithDetectionsAndSegmentsByTime: {},
    findEventsByAssociatedSignalDetectionHypotheses: {},
    findEventBeamsByEventHypothesisAndStations: {},
    getChannelsByNamesTimeRange: {},
    getFilterDefinitionsForSignalDetections: {},
    getProcessingMaskDefinitions: {},
    getBeamformingTemplates: {},
    getRotationTemplates: {},
    getFkReviewablePhases: {},
    getFkSpectraTemplates: {},
    getFilterDefinitionsByUsageMap: {},
    predictFeaturesForEventLocation: {}
  },
  processingMaskDefinitionsByChannels: [],
  beamformingTemplates: {},
  rotationTemplates: {},
  fkReviewablePhases: {},
  fkSpectraTemplates: {}
};

/**
 * Defines a Redux slice that contains various data that is fetched using async thunk requests.
 */
export const dataSlice = createSlice({
  name: 'data',
  initialState: dataInitialState,
  reducers: {
    /**
     * clears all data and history from the state
     */
    clearAll(state) {
      Object.keys(state).forEach(key => {
        // Filter definitions should not be cleared (they are loaded on initial ui load not interval)
        if (key !== 'filterDefinitions') {
          state[key] = dataInitialState[key];
        }
      });
      clearWaveforms().catch(e => {
        logger.error(`Failed to clear out waveform cache`, e);
      });
    }
  },

  // add any extra reducers at the data slice level
  extraReducers: builder => {
    addChannelReducers(builder);
    addChannelSegmentReducers(builder);
    addComputeLegacyFkSpectraReducers(builder);
    addFilterDefinitionReducers(builder);
    addSignalDetectionReducers(builder);
    addEventReducers(builder);
    addFkReducers(builder);
    addQcReducers(builder);

    // ! matchers must be added at the end; after all case reducers

    // channel
    addGetChannelsByNamesTimeRangeMatchReducers(builder);

    // event
    addFindEventsByAssociatedSignalDetectionHypothesesMatchReducers(builder);
    addGetEventsWithDetectionsAndSegmentsByTimeMatchReducers(builder);
    addPredictFeaturesForEventLocationMatchReducers(builder);

    // signal detection
    addGetFilterDefinitionsForSignalDetectionsMatchReducers(builder);
    addGetSignalDetectionsWithSegmentsByStationAndTimeMatchReducers(builder);

    // signal enhancement
    addBeamformingTemplatesMatchReducers(builder);
    addFilterDefinitionsByUsageMapMatchReducers(builder);
    addFkReviewablePhasesMatchReducers(builder);
    addFkSpectraTemplatesMatchReducers(builder);
    addGetProcessingMaskDefinitionsMatchReducers(builder);
    addGetRotationTemplatesMatchReducers(builder);

    // waveform
    addEventBeamsByEventHypothesisAndStationsMatchReducers(builder);
    addFindQCSegmentsByChannelAndTimeRangeMatchReducers(builder);
    addGetChannelSegmentsByChannelMatchReducers(builder);
  }
});
