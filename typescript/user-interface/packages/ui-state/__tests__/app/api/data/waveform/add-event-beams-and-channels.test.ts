import {
  eventData,
  intervalId,
  linearFilterDefinition,
  PD01Channel,
  pdarSignalDetection
} from '@gms/common-model/__tests__/__data__';
import { BeamType } from '@gms/common-model/lib/beamforming-templates/types';
import type { Draft } from 'immer';
import cloneDeep from 'lodash/cloneDeep';

import { dataInitialState, type DataState } from '../../../../../src/ts/app';
import { addEventBeamsAndChannelsMutation } from '../../../../../src/ts/app/api/data/waveform/add-event-beams-and-channels';
import {
  filteredUiChannelSegmentWithClaimCheck,
  unfilteredClaimCheckUiChannelSegment
} from '../../../../__data__';

describe('addEventBeamsAndChannels', () => {
  it('is defined', () => {
    expect(addEventBeamsAndChannelsMutation).toBeDefined();
  });

  it('updates state based on the given inputs', () => {
    // Set up initial state
    const state: Draft<DataState> = {
      ...cloneDeep(dataInitialState),
      channels: {
        beamed: {
          // create a "beamed" channel with processing BEAM_PHASE and BEAM_EVENT_HYPOTHESIS_ID that match the channel we will pass in
          [PD01Channel.name]: {
            ...PD01Channel,
            processingMetadata: {
              BEAM_PHASE: 'P',
              BEAM_EVENT_HYPOTHESIS_ID: eventData.eventHypotheses[0].id,
              BEAM_TYPE: BeamType.EVENT
            }
          }
        },
        filtered: {
          // create a "filtered" channel with processing BEAM_PHASE and BEAM_EVENT_HYPOTHESIS_ID that match the channel we will pass in
          [PD01Channel.name]: {
            ...PD01Channel,
            configuredInputs: [PD01Channel],
            processingMetadata: {
              BEAM_PHASE: 'P',
              BEAM_EVENT_HYPOTHESIS_ID: eventData.eventHypotheses[0].id,
              BEAM_TYPE: BeamType.EVENT
            }
          }
        },
        raw: {}
      },
      events: { [eventData.id]: eventData },
      signalDetections: {
        [pdarSignalDetection.id]: pdarSignalDetection
      }
    };

    const results = [
      {
        beamedChannelSegment: unfilteredClaimCheckUiChannelSegment,
        // create a "beamed" channel with processing BEAM_PHASE and BEAM_EVENT_HYPOTHESIS_ID that match the channel we will pass in
        beamedChannel: {
          ...PD01Channel,
          name: 'New/beamed/channel',
          processingMetadata: {
            BEAM_PHASE: 'P',
            BEAM_EVENT_HYPOTHESIS_ID: eventData.eventHypotheses[0].id,
            BEAM_TYPE: BeamType.EVENT
          }
        },
        filteredChannel: {
          ...PD01Channel,
          name: 'New/filtered/channel',
          processingMetadata: {
            BEAM_PHASE: 'P',
            BEAM_EVENT_HYPOTHESIS_ID: eventData.eventHypotheses[0].id,
            BEAM_TYPE: BeamType.EVENT
          }
        },
        filteredChannelSegment: filteredUiChannelSegmentWithClaimCheck,
        filterName: linearFilterDefinition.name
      }
    ];

    addEventBeamsAndChannelsMutation(
      state,
      'username',
      'openIntervalName',
      intervalId,
      eventData.id,
      eventData.eventHypotheses[0].id.hypothesisId,
      results
    );
    // deletes old beamed channels and filters
    expect(state.channels.beamed).toEqual({
      [results[0].beamedChannel.name]: results[0].beamedChannel
    });
    expect(state.channels.filtered).toEqual({
      [results[0].filteredChannel.name]: results[0].filteredChannel
    });

    // New hypothesis are created for SDs
    expect(state.signalDetections[pdarSignalDetection.id].signalDetectionHypotheses).toHaveLength(
      2
    );

    expect(
      state.signalDetections[pdarSignalDetection.id].signalDetectionHypotheses[1]
        .featureMeasurements[0].channel.name
    ).toEqual(results[0].filteredChannel.name);

    expect(
      state.signalDetections[pdarSignalDetection.id].signalDetectionHypotheses[1]
        .featureMeasurements[0].measuredChannelSegment?.id
    ).toEqual(results[0].filteredChannelSegment.channelSegmentDescriptor);
  });
});
