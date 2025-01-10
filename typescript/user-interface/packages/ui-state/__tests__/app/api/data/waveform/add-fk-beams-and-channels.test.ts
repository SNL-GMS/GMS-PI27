import {
  asarAS01Channel,
  eventData,
  linearFilterDefinition,
  sampleFilterName,
  signalDetectionAsarFkBeams
} from '@gms/common-model/__tests__/__data__';
import type { Draft } from 'immer';
import cloneDeep from 'lodash/cloneDeep';

import type { DataState } from '../../../../../src/ts/app';
import { dataInitialState } from '../../../../../src/ts/app';
import { addFkBeamsAndChannelsMutation } from '../../../../../src/ts/app/api/data/waveform/add-fk-beams-and-channels';
import {
  filteredUiChannelSegmentWithClaimCheck,
  unfilteredClaimCheckUiChannelSegment
} from '../../../../__data__';

describe('addFkBeamsAndChannels', () => {
  it('is defined', () => {
    expect(addFkBeamsAndChannelsMutation).toBeDefined();
  });

  it('updates state based on the given inputs', () => {
    // Set up initial state
    const state: Draft<DataState> = {
      ...cloneDeep(dataInitialState),
      channels: {
        beamed: {
          // create a "beamed" channel with processing BEAM_PHASE and BEAM_SIGNAL_DETECTION_HYPOTHESIS_ID that match the channel we will pass in
          [asarAS01Channel.name]: {
            ...asarAS01Channel,
            processingMetadata: {
              BEAM_PHASE: 'P',
              BEAM_SIGNAL_DETECTION_HYPOTHESIS_ID:
                signalDetectionAsarFkBeams[0].signalDetectionHypotheses[0].id.id
            }
          }
        },
        filtered: {
          // create a "filtered" channel with processing BEAM_PHASE and BEAM_SIGNAL_DETECTION_HYPOTHESIS_ID that match the channel we will pass in
          [asarAS01Channel.name]: {
            ...asarAS01Channel,
            configuredInputs: [asarAS01Channel],
            processingMetadata: {
              BEAM_PHASE: 'P',
              BEAM_SIGNAL_DETECTION_HYPOTHESIS_ID:
                signalDetectionAsarFkBeams[0].signalDetectionHypotheses[0].id.id
            }
          }
        },
        raw: {}
      },
      events: { [eventData.id]: eventData },
      signalDetections: {
        [signalDetectionAsarFkBeams[0].id]: signalDetectionAsarFkBeams[0],
        [signalDetectionAsarFkBeams[1].id]: signalDetectionAsarFkBeams[1],
        [signalDetectionAsarFkBeams[2].id]: signalDetectionAsarFkBeams[2]
      }
    };

    const results = [
      {
        beamedChannelSegment: unfilteredClaimCheckUiChannelSegment,
        // create a "beamed" channel with processing BEAM_PHASE and BEAM_SIGNAL_DETECTION_HYPOTHESIS_ID that match the channel we will pass in
        beamedChannel: {
          ...asarAS01Channel,
          name: 'New/beamed/channel',
          processingMetadata: {
            BEAM_PHASE: 'P',
            BEAM_SIGNAL_DETECTION_HYPOTHESIS_ID:
              signalDetectionAsarFkBeams[0].signalDetectionHypotheses[0].id.id
          }
        },
        filteredChannel: {
          ...asarAS01Channel,
          name: 'New/filtered/channel',
          processingMetadata: {
            BEAM_PHASE: 'P',
            BEAM_SIGNAL_DETECTION_HYPOTHESIS_ID:
              signalDetectionAsarFkBeams[0].signalDetectionHypotheses[0].id.id
          }
        },
        filteredChannelSegment: filteredUiChannelSegmentWithClaimCheck,
        filterName: linearFilterDefinition.name
      }
    ];

    addFkBeamsAndChannelsMutation(state, signalDetectionAsarFkBeams[0].id, results);
    expect(
      state.uiChannelSegments[signalDetectionAsarFkBeams[0].id][sampleFilterName]
    ).toHaveLength(1);
    expect(state.uiChannelSegments[signalDetectionAsarFkBeams[0].id]).toMatchSnapshot();
  });
});
