/* eslint-disable @typescript-eslint/no-magic-numbers */
import { toEpochSeconds } from '@gms/common-util';
import { testPerformance } from '@gms/common-util/__tests__/jest-conditional-util';

import type { GmsInteropModule, Wasm } from '../../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../../src/ts/gms-interop/gms-interop-module';
import testData from '../test-data/rotation-test-waveform.json';

describe('ui-wasm::rotation performance', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  testPerformance('90 minute performance test', () => {
    const MAX_TIME_ALLOWED = 100;
    const northPerfArray: Float64Array = Float64Array.from(
      { length: 653400 },
      (v, i) =>
        testData.channelSegments[1].timeseries[0].samples[
          i % testData.channelSegments[1].timeseries[0].samples.length
        ]
    );
    const eastPerfArray: Float64Array = Float64Array.from(
      { length: 653400 },
      (v, i) =>
        testData.channelSegments[1].timeseries[0].samples[
          i % testData.channelSegments[1].timeseries[0].samples.length
        ]
    );

    const northSamples: Wasm.VectorDouble = gmsInteropModule.convertToVectorDouble(northPerfArray);
    const eastSamples: Wasm.VectorDouble = gmsInteropModule.convertToVectorDouble(eastPerfArray);

    const classUnderTest: Wasm.RotationProvider = new gmsInteropModule.RotationProvider();
    const description: Wasm.RotationDescription = new gmsInteropModule.RotationDescription(
      true,
      'S',
      gmsInteropModule.SamplingType.INTERPOLATED
    );

    const paramBuilder = new gmsInteropModule.RotationParametersBuilder();
    const parameters: Wasm.RotationParameters = paramBuilder
      .location(new gmsInteropModule.Location(1, 2, 3, 4))
      .locationToleranceKm(222.2)
      .orientationAngleToleranceDeg(30.0)
      .orientationAngles(new gmsInteropModule.OrientationAngles(90, 45))
      .receiverToSourceAzimuthDeg(30.0)
      .sampleRateHz(40.0)
      .sampleRateToleranceHz(0.05)
      .slownessSecPerDeg(undefined)
      .build();

    const definition: Wasm.RotationDefinition = new gmsInteropModule.RotationDefinition(
      description,
      parameters
    );

    const startTime: number = toEpochSeconds('2023-12-12T17:45:00.407Z');

    const endTime: number = toEpochSeconds('2023-12-12T17:45:03.407Z');

    const processingMaskVector: Wasm.ProcessingMasksByChannelMap =
      new gmsInteropModule.ProcessingMasksByChannelMap();
    const channelSegmentVector: Wasm.VectorChannelSegment =
      new gmsInteropModule.VectorChannelSegment();

    const channelBuilder: Wasm.ChannelSegmentBuilder = new gmsInteropModule.ChannelSegmentBuilder();

    const northChannelReference: Wasm.ChannelVersionReference =
      new gmsInteropModule.ChannelVersionReference(
        testData.channelSegments[1].id.channel.name,

        testData.channelSegments[1].id.channel.effectiveAt
      );
    const timeRangeVector: Wasm.VectorTimeRange = new gmsInteropModule.VectorTimeRange();
    const northMissingInputChannels: Wasm.VectorTimeRangesByChannel =
      new gmsInteropModule.VectorTimeRangesByChannel();
    northMissingInputChannels.push_back(
      new gmsInteropModule.TimeRangesByChannel(northChannelReference, timeRangeVector)
    );

    const northDescriptor: Wasm.ChannelSegmentDescriptor =
      new gmsInteropModule.ChannelSegmentDescriptor(
        northChannelReference,

        testData.channelSegments[1].id.startTime,

        testData.channelSegments[1].id.endTime,

        testData.channelSegments[1].id.creationTime
      );

    const northWaveforms: Wasm.VectorWaveform = new gmsInteropModule.VectorWaveform();
    testData.channelSegments[1].timeseries.forEach(ts => {
      northWaveforms.push_back(
        new gmsInteropModule.Waveform(northSamples, ts.startTime, ts.endTime, ts.sampleRateHz)
      );
    });

    const northChannel: Wasm.ChannelSegment = channelBuilder
      .channelSegmentUnits(gmsInteropModule.Units.DEGREES)
      .creationTime(testData.channelSegments[1].id.creationTime)
      .endTime(testData.channelSegments[1].id.endTime)
      .id(northDescriptor)
      .startTime(testData.channelSegments[1].id.startTime)
      .timeseries(northWaveforms)
      .timeseriesType(gmsInteropModule.TimeseriesType.WAVEFORM)
      .build();
    channelSegmentVector.push_back(northChannel);

    const eastChannelReference: Wasm.ChannelVersionReference =
      new gmsInteropModule.ChannelVersionReference(
        testData.channelSegments[0].id.channel.name,

        testData.channelSegments[0].id.channel.effectiveAt
      );

    const eastMissingInputChannels: Wasm.VectorTimeRangesByChannel =
      new gmsInteropModule.VectorTimeRangesByChannel();
    eastMissingInputChannels.push_back(
      new gmsInteropModule.TimeRangesByChannel(eastChannelReference, timeRangeVector)
    );

    const eastDescriptor: Wasm.ChannelSegmentDescriptor =
      new gmsInteropModule.ChannelSegmentDescriptor(
        northChannelReference,

        testData.channelSegments[1].id.startTime,

        testData.channelSegments[1].id.endTime,

        testData.channelSegments[1].id.creationTime
      );

    const eastWaveforms: Wasm.VectorWaveform = new gmsInteropModule.VectorWaveform();
    testData.channelSegments[0].timeseries.forEach(ts => {
      eastWaveforms.push_back(
        new gmsInteropModule.Waveform(eastSamples, ts.startTime, ts.endTime, ts.sampleRateHz)
      );
    });

    const eastChannel: Wasm.ChannelSegment = channelBuilder
      .channelSegmentUnits(gmsInteropModule.Units.DEGREES)
      .creationTime(testData.channelSegments[1].id.creationTime)
      .endTime(testData.channelSegments[1].id.endTime)
      .id(eastDescriptor)
      .startTime(testData.channelSegments[1].id.startTime)
      .timeseries(eastWaveforms)
      .timeseriesType(gmsInteropModule.TimeseriesType.WAVEFORM)
      .build();

    channelSegmentVector.push_back(eastChannel);
    const taperDefinition: Wasm.TaperDefinition = new gmsInteropModule.TaperDefinition(
      gmsInteropModule.TaperFunction.COSINE,
      1
    );
    try {
      const startingMs = performance.now();
      classUnderTest.maskAndRotate2d(
        definition,
        channelSegmentVector,
        startTime,
        endTime,
        processingMaskVector,
        taperDefinition
      );
      const totalMs = performance.now() - startingMs;
      expect(totalMs).toBeLessThanOrEqual(MAX_TIME_ALLOWED * 2);
      console.log(`Rotation Performance, ${totalMs}`);
    } catch (error) {
      console.error(error);

      expect(error).not.toBeDefined();
    } finally {
      classUnderTest.delete();
      description.delete();
      parameters.delete();
      definition.delete();
      paramBuilder.delete();
      processingMaskVector.delete();
      channelSegmentVector.delete();
      channelBuilder.delete();
      northChannelReference.delete();
      timeRangeVector.delete();
      northMissingInputChannels.delete();
      northDescriptor.delete();
      northWaveforms.delete();
      northChannel.delete();
      eastChannelReference.delete();
      eastMissingInputChannels.delete();
      eastDescriptor.delete();
      eastWaveforms.delete();
    }
  });
});
