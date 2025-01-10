/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ChannelTypes, CommonTypes } from '@gms/common-model';
import {
  PD01Channel,
  PD02Channel,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type {
  SignalDetection,
  SignalDetectionHypothesis
} from '@gms/common-model/lib/signal-detection';
import { FeatureMeasurementType } from '@gms/common-model/lib/signal-detection';

import { createWorkingHypothesisAndUpdateAssociations } from '../../../../../src/ts/app/api/data/event/create-working-hypothesis';
import { mutateUiChannelSegmentsRecord } from '../../../../../src/ts/app/api/data/waveform/mutate-channel-segment-record';
import {
  containsMatchingFeatureMeasurement,
  deleteChannelSegmentAndFilteredVersions,
  getRotatedChannels,
  handleSDHypothesisUpdate,
  saveRotationResultsAndUpdateSignalDetections,
  updateSDsAndRemoveUnreferencedChannels,
  updateWorkingSDHypoFeatureMeasurements
} from '../../../../../src/ts/app/api/data/waveform/save-rotation-results-and-update-signal-detections';
import type { MaskAndRotate2dResult, SDHypothesisArgs } from '../../../../../src/ts/ui-state';

jest.mock('../../../../../src/ts/app/api/data/waveform/mutate-channel-segment-record', () => {
  const actual = jest.requireActual(
    '../../../../../src/ts/app/api/data/waveform/mutate-channel-segment-record'
  );
  return {
    ...actual,
    /**
     * ! If this is not mocked, then it will break our Axios request mocks when it fails
     */
    mutateUiChannelSegmentsRecord: jest.fn()
  };
});
jest.mock('../../../../../src/ts/app/api/data/event/create-working-hypothesis', () => {
  const actual = jest.requireActual(
    '../../../../../src/ts/app/api/data/event/create-working-hypothesis'
  );
  return {
    ...actual,
    /**
     * ! If this is not mocked, then it will break our Axios request mocks when it fails
     */
    createWorkingHypothesisAndUpdateAssociations: jest.fn()
  };
});

describe('mutate-rotation-results', () => {
  it('export functions are defined', () => {
    expect(handleSDHypothesisUpdate).toBeDefined();
    expect(containsMatchingFeatureMeasurement).toBeDefined();
    expect(getRotatedChannels).toBeDefined();
    expect(saveRotationResultsAndUpdateSignalDetections).toBeDefined();
    expect(updateWorkingSDHypoFeatureMeasurements).toBeDefined();
    expect(deleteChannelSegmentAndFilteredVersions).toBeDefined();
    expect(updateSDsAndRemoveUnreferencedChannels).toBeDefined();
  });
  describe('saveRotationResultsAndUpdateSignalDetections', () => {
    it('performs as expected', () => {
      const state: any = { channels: { beamed: {}, filtered: {} } };
      const rotatedChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        name: `${PD01Channel.name}`,
        processingMetadata: { STEERING_BACK_AZIMUTH: 1 }
      };
      state.channels.beamed[rotatedChannel.name] = rotatedChannel;
      state.channels.filtered[rotatedChannel.name] = rotatedChannel;
      const rotationResult: MaskAndRotate2dResult = {
        rotatedUiChannelSegment: {
          channelSegmentDescriptor: {
            channel: { name: rotatedChannel.name, effectiveAt: 12390 },
            creationTime: 421,
            startTime: 0,
            endTime: 10
          },
          channelSegment: {
            id: {
              channel: { name: rotatedChannel.name, effectiveAt: 12390 },
              creationTime: 421,
              startTime: 0,
              endTime: 10
            }
          }
        },
        rotatedChannel,
        stationName: rotatedChannel.station.name,
        phase: 's'
      } as any as MaskAndRotate2dResult;
      const config = {
        rotationReplacementAzimuthToleranceDeg: 10
      };
      const newSDHypothesisArgs = {
        username: 'username',
        openIntervalName: 'openIntervalName',
        stageId: {},
        eventId: undefined
      } as any as SDHypothesisArgs;
      const previouslyRotatedChannels: any = {};
      previouslyRotatedChannels[rotatedChannel.name] = rotatedChannel;
      saveRotationResultsAndUpdateSignalDetections(
        state,
        [rotationResult],
        config,
        newSDHypothesisArgs
      );
      expect(mutateUiChannelSegmentsRecord).toHaveBeenCalled();
      expect((mutateUiChannelSegmentsRecord as any as jest.Mock).mock.calls[0])
        .toMatchInlineSnapshot(`
        [
          undefined,
          "PDAR",
          [
            {
              "channelSegment": {
                "id": {
                  "channel": {
                    "effectiveAt": 12390,
                    "name": "PDAR.PD01.SHZ",
                  },
                  "creationTime": 421,
                  "endTime": 10,
                  "startTime": 0,
                },
              },
              "channelSegmentDescriptor": {
                "channel": {
                  "effectiveAt": 12390,
                  "name": "PDAR.PD01.SHZ",
                },
                "creationTime": 421,
                "endTime": 10,
                "startTime": 0,
              },
            },
          ],
        ]
      `);
    });
  });
  describe('deleteChannelSegment', () => {
    it('deletes non identical channel segments', () => {
      const stationName = 'stationName';
      const state: any = {
        uiChannelSegments: {}
      };
      const filterName = 'filterName';
      const chanSegToDelete: any = {
        id: {
          channel: { name: `${PD01Channel.name}/rotate/phase_s/123`, effectiveAt: 12390 },
          creationTime: 421,
          startTime: 0,
          endTime: 10
        }
      };
      const incomingChannelSegment: any = {
        channelSegmentDescriptor: {
          channel: { name: `${PD01Channel.name}/rotate/phase_s/123`, effectiveAt: 12390 },
          creationTime: 9292,
          startTime: 0,
          endTime: 10
        },
        channelSegment: {
          id: {
            channel: { name: `${PD01Channel.name}/rotate/phase_s/123`, effectiveAt: 12390 },
            creationTime: 9292,
            startTime: 0,
            endTime: 10
          }
        }
      };
      const existingChannelSegment = {
        channelSegmentDescriptor: {
          channel: { name: `${PD01Channel.name}/rotate/phase_s/123`, effectiveAt: 12390 },
          creationTime: 421,
          startTime: 0,
          endTime: 10
        },
        channelSegment: {
          id: {
            channel: { name: `${PD01Channel.name}/rotate/phase_s/123`, effectiveAt: 12390 },
            creationTime: 421,
            startTime: 0,
            endTime: 10
          }
        }
      };
      state.uiChannelSegments[stationName] = {};
      state.uiChannelSegments[stationName][filterName] = [existingChannelSegment];
      deleteChannelSegmentAndFilteredVersions(
        state,
        chanSegToDelete,
        incomingChannelSegment,
        stationName
      );
      // should delete the channel segments
      expect(state).toMatchInlineSnapshot(`
        {
          "uiChannelSegments": {
            "stationName": {
              "filterName": [],
            },
          },
        }
      `);
    });

    it('does not delete identical channel segments', () => {
      const stationName = 'stationName';
      const state: any = {
        uiChannelSegments: {}
      };
      const filterName = 'filterName';
      const chanSegToDelete: any = {
        id: {
          channel: { name: `${PD01Channel.name}/rotate/phase_s/123`, effectiveAt: 12390 },
          creationTime: 421,
          startTime: 0,
          endTime: 10
        }
      };
      const incomingChannelSegment: any = {
        channelSegmentDescriptor: {
          channel: { name: `${PD01Channel.name}/rotate/phase_s/123`, effectiveAt: 12390 },
          creationTime: 421,
          startTime: 0,
          endTime: 10
        },
        channelSegment: {
          id: {
            channel: { name: `${PD01Channel.name}/rotate/phase_s/123`, effectiveAt: 12390 },
            creationTime: 421,
            startTime: 0,
            endTime: 10
          }
        }
      };
      const channelSegment = {
        channelSegmentDescriptor: {
          channel: { name: `${PD01Channel.name}/rotate/phase_s/123`, effectiveAt: 12390 },
          creationTime: 421,
          startTime: 0,
          endTime: 10
        },
        channelSegment: {
          id: {
            channel: { name: `${PD01Channel.name}/rotate/phase_s/123`, effectiveAt: 12390 },
            creationTime: 421,
            startTime: 0,
            endTime: 10
          }
        }
      };
      state.uiChannelSegments[stationName] = {};
      state.uiChannelSegments[stationName][filterName] = [channelSegment];
      deleteChannelSegmentAndFilteredVersions(
        state,
        chanSegToDelete,
        incomingChannelSegment,
        stationName
      );
      // channel segment should remain
      expect(state.uiChannelSegments[stationName][filterName]).toHaveLength(1);
    });
  });
  describe('handleSDHypothesisUpdate', () => {
    it('performs as expected', () => {
      const state: any = { channels: { beamed: {}, filtered: {} }, uiChannelSegments: {} };
      const rotatedChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        name: `${PD01Channel.name}/rotate/phase_s/123`,
        processingMetadata: { STEERING_BACK_AZIMUTH: 1 }
      };
      state.channels.beamed[rotatedChannel.name] = rotatedChannel;
      state.channels.filtered[rotatedChannel.name] = rotatedChannel;

      // setup UI channel segment state
      const filterName = 'filterName';
      const existingUiChannelSegment = {
        channelSegmentDescriptor: {
          channel: rotatedChannel,
          creationTime: 421,
          startTime: 0,
          endTime: 10
        },
        channelSegment: {
          id: {
            channel: rotatedChannel,
            creationTime: 421,
            startTime: 0,
            endTime: 10
          }
        }
      };
      state.uiChannelSegments[rotatedChannel.station.name] = {};
      state.uiChannelSegments[rotatedChannel.station.name][filterName] = [existingUiChannelSegment];
      const sd: SignalDetection = {
        ...signalDetectionsData[0],
        signalDetectionHypotheses: [
          {
            ...signalDetectionsData[0].signalDetectionHypotheses[0],
            featureMeasurements: [
              {
                ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements[0],
                channel: rotatedChannel,
                measuredChannelSegment: {
                  ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements[0]
                    .measuredChannelSegment,
                  id: {
                    channel: rotatedChannel,
                    creationTime: 421,
                    startTime: 0,
                    endTime: 10
                  } as any
                },
                featureMeasurementType: FeatureMeasurementType.PHASE,
                measurementValue: {
                  value: 'P',
                  arrivalTime: {
                    value: 5,
                    standardDeviation: 1,
                    units: CommonTypes.Units.SECONDS
                  }
                }
              }
            ]
          }
        ]
      };
      const rotationResult: MaskAndRotate2dResult = {
        rotatedUiChannelSegment: {
          channelSegmentDescriptor: {
            channel: rotatedChannel,
            creationTime: 423,
            startTime: 0,
            endTime: 10
          },
          channelSegment: {
            id: {
              channel: rotatedChannel,
              creationTime: 423,
              startTime: 0,
              endTime: 10
            }
          }
        },
        rotatedChannel,
        stationName: rotatedChannel.station.name,
        phase: 's'
      } as any as MaskAndRotate2dResult;
      const config = {
        rotationReplacementAzimuthToleranceDeg: 10
      };
      const newSDHypothesisArgs = {
        username: 'username',
        openIntervalName: 'openIntervalName',
        stageId: {},
        eventId: undefined
      } as any as SDHypothesisArgs;
      const previouslyRotatedChannels: any = {};
      previouslyRotatedChannels[rotatedChannel.name] = rotatedChannel;
      handleSDHypothesisUpdate(
        state,
        sd,
        rotationResult,
        previouslyRotatedChannels,
        config,
        newSDHypothesisArgs
      );
      expect(createWorkingHypothesisAndUpdateAssociations).toHaveBeenCalled();
      // FM should be updated
      expect(sd).toMatchSnapshot();
    });
  });
  describe('containsMatchingFeatureMeasurement', () => {
    it('performs as expected given the proper inputs', () => {
      const rotatedChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        name: `${PD01Channel.name}/rotate/phase_s/123`,
        processingMetadata: { STEERING_BACK_AZIMUTH: 1 }
      };
      const sdHypothesis: SignalDetectionHypothesis = {
        ...signalDetectionsData[0].signalDetectionHypotheses[0],
        featureMeasurements: [
          {
            ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements[0],
            channel: rotatedChannel,
            featureMeasurementType: FeatureMeasurementType.PHASE,
            measurementValue: { value: 's' }
          },
          {
            ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements[0],
            channel: rotatedChannel,
            featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
            measurementValue: {
              arrivalTime: {
                value: 5,
                standardDeviation: 1,
                units: CommonTypes.Units.SECONDS
              }
            }
          }
        ]
      };
      const rotationResult: MaskAndRotate2dResult = {
        rotatedUiChannelSegment: { channelSegmentDescriptor: { startTime: 0, endTime: 10 } },
        rotatedChannel,
        stationName: rotatedChannel.station.name,
        phase: 's'
      } as any as MaskAndRotate2dResult;
      const PreviouslyRotatedChannels: any = {};
      PreviouslyRotatedChannels[rotatedChannel.name] = rotatedChannel;
      const config = {
        rotationReplacementAzimuthToleranceDeg: 10
      };
      expect(
        containsMatchingFeatureMeasurement(
          sdHypothesis,
          rotationResult,
          PreviouslyRotatedChannels,
          config
        )
      ).toBeTruthy();
    });
    it('throws given no phase feature measurement', () => {
      const rotatedChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        name: `${PD01Channel.name}/rotate/phase_s/123`,
        processingMetadata: { STEERING_BACK_AZIMUTH: 1 }
      };
      const sdHypothesis: SignalDetectionHypothesis = {
        ...signalDetectionsData[0].signalDetectionHypotheses[0],
        featureMeasurements: [
          {
            ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements[0],
            channel: rotatedChannel,
            featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
            measurementValue: {
              arrivalTime: {
                value: 5,
                standardDeviation: 1,
                units: CommonTypes.Units.SECONDS
              }
            }
          }
        ]
      };
      const rotationResult: MaskAndRotate2dResult = {
        rotatedUiChannelSegment: { channelSegmentDescriptor: { startTime: 0, endTime: 10 } },
        rotatedChannel,
        stationName: rotatedChannel.station.name,
        phase: 's'
      } as any as MaskAndRotate2dResult;
      const PreviouslyRotatedChannels: any = {};
      PreviouslyRotatedChannels[rotatedChannel.name] = rotatedChannel;
      const config = {
        rotationReplacementAzimuthToleranceDeg: 10
      };

      expect(() =>
        containsMatchingFeatureMeasurement(
          sdHypothesis,
          rotationResult,
          PreviouslyRotatedChannels,
          config
        )
      ).toThrow(`Invalid feature measurement collection, must have an phase feature measurement`);
    });
  });
  describe('getRotatedChannels', () => {
    it('gets the all the rotated channels from beamed and filtered channels', () => {
      const rotatedChannelA: ChannelTypes.Channel = {
        ...PD01Channel,
        name: `${PD01Channel.name}/rotate/phase_s/1`
      };
      const rotatedChannelB: ChannelTypes.Channel = {
        ...PD02Channel,
        name: `${PD02Channel.name}/rotate/phase_s/2`
      };
      const state: any = { channels: { beamed: [], filtered: [] } };
      state.channels.beamed[rotatedChannelA.name] = rotatedChannelA;
      state.channels.filtered[rotatedChannelB.name] = rotatedChannelB;
      expect(Object.keys(getRotatedChannels(state))).toMatchObject([
        'PDAR.PD01.SHZ/rotate/phase_s/1',
        'PDAR.PD02.SHZ/rotate/phase_s/2'
      ]);
    });
    it('skips non-rotated channels from beamed and filtered channels', () => {
      const noneRotatedChannelA: ChannelTypes.Channel = {
        ...PD01Channel,
        name: `${PD01Channel.name}`
      };
      const rotatedChannelB: ChannelTypes.Channel = {
        ...PD02Channel,
        name: `${PD02Channel.name}/rotate/phase_s/2`
      };
      const state: any = { channels: { beamed: [], filtered: [] } };
      state.channels.beamed[noneRotatedChannelA.name] = noneRotatedChannelA;
      state.channels.filtered[rotatedChannelB.name] = rotatedChannelB;
      expect(Object.keys(getRotatedChannels(state))).toMatchObject([
        'PDAR.PD02.SHZ/rotate/phase_s/2'
      ]);
    });
  });
  describe('updateSDsAndRemoveUnreferencedChannels', () => {
    it('performs as expected', () => {
      const state: any = {
        channels: { beamed: {}, filtered: {} },
        signalDetections: {},
        uiChannelSegments: {},
        events: {}
      };
      const rotatedChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        name: `${PD01Channel.name}/rotate/phase_s/123`,
        processingMetadata: { STEERING_BACK_AZIMUTH: 1 }
      };
      const filterName = 'filterName';
      const existingUiChannelSegment = {
        channelSegmentDescriptor: {
          channel: rotatedChannel,
          creationTime: 421,
          startTime: 0,
          endTime: 10
        },
        channelSegment: {
          id: {
            channel: rotatedChannel,
            creationTime: 421,
            startTime: 0,
            endTime: 10
          }
        }
      };
      state.channels.beamed[rotatedChannel.name] = rotatedChannel;
      state.channels.filtered[rotatedChannel.name] = rotatedChannel;
      state.uiChannelSegments[rotatedChannel.station.name] = {};
      state.uiChannelSegments[rotatedChannel.station.name][filterName] = [existingUiChannelSegment];
      const sd: SignalDetection = {
        ...signalDetectionsData[0],
        station: { ...signalDetectionsData[0].station, name: rotatedChannel.station.name },
        signalDetectionHypotheses: [
          {
            ...signalDetectionsData[0].signalDetectionHypotheses[0],
            featureMeasurements: [
              {
                ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements[0],
                channel: rotatedChannel,
                measuredChannelSegment: {
                  ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements[0]
                    .measuredChannelSegment,
                  id: {
                    channel: rotatedChannel,
                    creationTime: 421,
                    startTime: 0,
                    endTime: 10
                  } as any
                },
                featureMeasurementType: FeatureMeasurementType.PHASE,
                measurementValue: {
                  value: 'P',
                  arrivalTime: {
                    value: 5,
                    standardDeviation: 1,
                    units: CommonTypes.Units.SECONDS
                  }
                }
              },
              {
                ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements[0],
                channel: rotatedChannel,
                featureMeasurementType: FeatureMeasurementType.ARRIVAL_TIME,
                measurementValue: {
                  arrivalTime: {
                    value: 5,
                    standardDeviation: 1,
                    units: CommonTypes.Units.SECONDS
                  }
                }
              }
            ]
          }
        ]
      };
      state.signalDetections[sd.id] = sd;
      const rotationResult: MaskAndRotate2dResult = {
        rotatedUiChannelSegment: {
          channelSegmentDescriptor: {
            channel: rotatedChannel,
            creationTime: 421,
            startTime: 0,
            endTime: 10
          },
          channelSegment: {
            id: {
              channel: rotatedChannel,
              creationTime: 421,
              startTime: 0,
              endTime: 10
            }
          }
        },
        rotatedChannel,
        stationName: rotatedChannel.station.name,
        phase: 'P'
      } as any as MaskAndRotate2dResult;
      const config = {
        rotationReplacementAzimuthToleranceDeg: 10
      };
      const newSDHypothesisArgs = {
        username: 'username',
        openIntervalName: 'openIntervalName',
        stageId: {},
        eventId: undefined
      } as any as SDHypothesisArgs;
      const allRotatedChannels: any = {};
      allRotatedChannels[rotatedChannel.name] = rotatedChannel;
      updateSDsAndRemoveUnreferencedChannels(
        state,
        [rotationResult],
        allRotatedChannels,
        config,
        newSDHypothesisArgs
      );
      expect(state.channels).toMatchInlineSnapshot(`
        {
          "beamed": {},
          "filtered": {},
        }
      `);
    });
  });
  describe('updateUnsavedSignalDetectionHypothesis', () => {
    it('performs as expected', () => {
      const state: any = { channels: { beamed: {}, filtered: {} }, uiChannelSegments: {} };
      const rotatedChannel: ChannelTypes.Channel = {
        ...PD01Channel,
        name: `${PD01Channel.name}/rotate/phase_s/123`,
        processingMetadata: { STEERING_BACK_AZIMUTH: 1 }
      };
      const filterName = 'Unfiltered';
      const existingUiChannelSegment = {
        channelSegmentDescriptor: {
          channel: rotatedChannel,
          creationTime: 421,
          startTime: 0,
          endTime: 10
        },
        channelSegment: {
          id: {
            channel: rotatedChannel,
            creationTime: 421,
            startTime: 0,
            endTime: 10
          }
        }
      };
      state.channels.beamed[rotatedChannel.station.name] = rotatedChannel;
      state.channels.filtered[rotatedChannel.station.name] = rotatedChannel;
      state.uiChannelSegments[rotatedChannel.station.name] = {};
      state.uiChannelSegments[rotatedChannel.station.name][filterName] = [existingUiChannelSegment];
      const sd: SignalDetection = {
        ...signalDetectionsData[0],
        signalDetectionHypotheses: [
          {
            ...signalDetectionsData[0].signalDetectionHypotheses[0],
            featureMeasurements: [
              {
                ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements[0],
                channel: rotatedChannel,
                measuredChannelSegment: {
                  ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements[0]
                    .measuredChannelSegment,
                  id: {
                    channel: rotatedChannel,
                    creationTime: 421,
                    startTime: 0,
                    endTime: 10
                  } as any
                },
                featureMeasurementType: FeatureMeasurementType.PHASE,
                measurementValue: {
                  value: 'P',
                  arrivalTime: {
                    value: 5,
                    standardDeviation: 1,
                    units: CommonTypes.Units.SECONDS
                  }
                }
              }
            ]
          }
        ]
      };
      const rotationResult: MaskAndRotate2dResult = {
        rotatedUiChannelSegment: {
          channelSegmentDescriptor: {
            channel: rotatedChannel,
            creationTime: 423,
            startTime: 0,
            endTime: 10
          },
          channelSegment: {
            id: {
              channel: rotatedChannel,
              creationTime: 423,
              startTime: 0,
              endTime: 10
            }
          }
        },
        rotatedChannel,
        stationName: rotatedChannel.station.name,
        phase: 's'
      } as any as MaskAndRotate2dResult;
      const config = { rotationReplacementAzimuthToleranceDeg: 1 };
      const channelRecord = {};
      channelRecord[rotatedChannel.name] = rotatedChannel;
      updateWorkingSDHypoFeatureMeasurements(state, sd, rotationResult, channelRecord, config);
      // should replace old beamed and filters channels that match
      expect(state).toMatchSnapshot();
      // should update the FM
      expect(sd.signalDetectionHypotheses[0].featureMeasurements).toMatchSnapshot();
    });
  });
});
