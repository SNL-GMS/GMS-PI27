/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { CommonTypes, FkTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes, QcSegmentTypes } from '@gms/common-model';
import {
  beamParameters,
  eventBeamDescription
} from '@gms/common-model/__tests__/__data__/beamforming-templates';
import { PD01Channel, pdar } from '@gms/common-model/__tests__/__data__/station-definitions';
import type { BeamParameters } from '@gms/common-model/lib/beamforming-templates/types';
import type {
  ChannelSegment,
  ChannelSegmentDescriptor,
  ProcessingMask,
  TimeRangesByChannel
} from '@gms/common-model/lib/channel-segment';
import { ProcessingOperation, TimeseriesType } from '@gms/common-model/lib/channel-segment';
import { Units } from '@gms/common-model/lib/common/types';
import type { EntityReference, VersionReference } from '@gms/common-model/lib/faceted';
import type { TaperDefinition } from '@gms/common-model/lib/processing-mask-definitions/types';
import { TaperFunction } from '@gms/common-model/lib/processing-mask-definitions/types';
import type {
  RotationDefinition,
  RotationDescription,
  RotationParameters
} from '@gms/common-model/lib/rotation/types';
import type {
  InstantValue,
  SignalDetectionHypothesisId
} from '@gms/common-model/lib/signal-detection';
import type {
  Channel,
  OrientationAngles,
  RelativePosition
} from '@gms/common-model/lib/station-definitions/channel-definitions/channel-definitions';
import type { Station } from '@gms/common-model/lib/station-definitions/station-definitions/station-definitions';

import type { GmsInteropModule, Wasm } from '../../src/ts/gms-interop/gms-interop-module';
import { getInteropModule } from '../../src/ts/gms-interop/gms-interop-module';
import {
  convertToWasmBeamDescription,
  convertToWasmBeamParameters,
  convertToWasmChannel,
  convertToWasmChannelSegment,
  convertToWasmChannelSegmentDescriptor,
  convertToWasmChannelVersionReference,
  convertToWasmFkSpectra,
  convertToWasmFkSpectraDefinition,
  convertToWasmInstantValue,
  convertToWasmLocation,
  convertToWasmOrientationAngles,
  convertToWasmProcessingMask,
  convertToWasmProcessingMasksByChannelMap,
  convertToWasmProcessingOperation,
  convertToWasmRelativePosition,
  convertToWasmRelativePositionByChannelMap,
  convertToWasmRotationDefinition,
  convertToWasmRotationDescription,
  convertToWasmRotationParameters,
  convertToWasmSignalDetectionHypothesisId,
  convertToWasmStationVersionReference,
  convertToWasmTaperDefinition,
  convertToWasmTimeRangesByChannel
} from '../../src/ts/gms-interop/ts-to-wasm-converters';
import { defaultSpectraDefinition, fkData } from './test-data/fk-data';

describe('ts-to-wasm-converters', () => {
  let gmsInteropModule: GmsInteropModule;

  beforeAll(async () => {
    gmsInteropModule = await getInteropModule();
  });

  test('convertRotationDescription', () => {
    const payload: RotationDescription = {
      phaseType: 'S',
      samplingType: 'INTERPOLATED',
      twoDimensional: true
    };
    const actual: Wasm.RotationDescription = convertToWasmRotationDescription(
      gmsInteropModule,
      payload
    );
    expect(actual.phase).toEqual('S');
    expect(actual.samplingType).toBe(gmsInteropModule.SamplingType.INTERPOLATED);
    expect(actual.twoDimensional).toBe(true);
    actual.delete();
  });

  test('convertLocation', () => {
    const latitudeDegrees = 111;
    const longitudeDegrees = 222;
    const elevationKm = 333;
    const depthKm = 444;

    const payload: CommonTypes.Location = {
      latitudeDegrees,
      longitudeDegrees,
      elevationKm,
      depthKm
    };
    const actual: Wasm.Location = convertToWasmLocation(gmsInteropModule, payload);
    expect(actual.depthKm).toBe(depthKm);
    expect(actual.elevationKm).toBe(elevationKm);
    expect(actual.longitudeDegrees).toBe(longitudeDegrees);
    expect(actual.latitudeDegrees).toBe(latitudeDegrees);
    actual.delete();
  });

  test('convertOrientationAngles', () => {
    const horizontalAngleDeg = 111;
    const verticalAngleDeg = 222;

    const payload: OrientationAngles = {
      horizontalAngleDeg,
      verticalAngleDeg
    };
    const actual: Wasm.OrientationAngles = convertToWasmOrientationAngles(
      gmsInteropModule,
      payload
    );
    expect(actual.horizontalAngleDeg).toBe(horizontalAngleDeg);
    expect(actual.verticalAngleDeg).toBe(verticalAngleDeg);
    actual.delete();
  });

  test('convertRotationParameters', () => {
    const latitudeDegrees = 111;
    const longitudeDegrees = 222;
    const elevationKm = 333;
    const depthKm = 444;

    const location: CommonTypes.Location = {
      latitudeDegrees,
      longitudeDegrees,
      elevationKm,
      depthKm
    };
    const horizontalAngleDeg = 111;
    const verticalAngleDeg = 222;

    const orientationAngles: OrientationAngles = {
      horizontalAngleDeg,
      verticalAngleDeg
    };

    const orientationAngleToleranceDeg = 33.3;
    const receiverToSourceAzimuthDeg = 33.3;
    const sampleRateHz = 33.3;
    const sampleRateToleranceHz = 33.3;
    const locationToleranceKm = 33.3;

    const payload: RotationParameters = {
      location,
      locationToleranceKm,
      orientationAngles,
      orientationAngleToleranceDeg,
      receiverToSourceAzimuthDeg,
      sampleRateHz,
      sampleRateToleranceHz
    };
    const actual: Wasm.RotationParameters = convertToWasmRotationParameters(
      gmsInteropModule,
      payload
    );
    expect(actual.orientationAngles.horizontalAngleDeg).toBe(horizontalAngleDeg);
    expect(actual.orientationAngles.verticalAngleDeg).toBe(verticalAngleDeg);
    expect(actual.location.depthKm).toBe(depthKm);
    expect(actual.location.elevationKm).toBe(elevationKm);
    expect(actual.location.longitudeDegrees).toBe(longitudeDegrees);
    expect(actual.location.latitudeDegrees).toBe(latitudeDegrees);
    expect(actual.locationToleranceKm).toBe(locationToleranceKm);
    actual.delete();
  });

  test('convertRotationDefinition', () => {
    const phaseType = 'S';
    const samplingType = 'INTERPOLATED';
    const twoDimensional = true;
    const rotationDescription: RotationDescription = {
      phaseType,
      samplingType,
      twoDimensional
    };

    const latitudeDegrees = 111;
    const longitudeDegrees = 222;
    const elevationKm = 333;
    const depthKm = 444;

    const location: CommonTypes.Location = {
      latitudeDegrees,
      longitudeDegrees,
      elevationKm,
      depthKm
    };
    const horizontalAngleDeg = 111;
    const verticalAngleDeg = 222;

    const orientationAngles: OrientationAngles = {
      horizontalAngleDeg,
      verticalAngleDeg
    };

    const orientationAngleToleranceDeg = 33.3;
    const receiverToSourceAzimuthDeg = 33.3;
    const sampleRateHz = 33.3;
    const sampleRateToleranceHz = 33.3;
    const locationToleranceKm = 33.3;

    const rotationParameters: RotationParameters = {
      location,
      locationToleranceKm,
      orientationAngles,
      orientationAngleToleranceDeg,
      receiverToSourceAzimuthDeg,
      sampleRateHz,
      sampleRateToleranceHz
    };
    const payload: RotationDefinition = {
      rotationDescription,
      rotationParameters
    };
    const actual: Wasm.RotationDefinition = convertToWasmRotationDefinition(
      gmsInteropModule,
      payload
    );
    expect(actual.rotationParameters.orientationAngles.horizontalAngleDeg).toBe(horizontalAngleDeg);
    expect(actual.rotationParameters.orientationAngles.verticalAngleDeg).toBe(verticalAngleDeg);
    expect(actual.rotationParameters.location.depthKm).toBe(depthKm);
    expect(actual.rotationParameters.location.elevationKm).toBe(elevationKm);
    expect(actual.rotationParameters.location.longitudeDegrees).toBe(longitudeDegrees);
    expect(actual.rotationParameters.location.latitudeDegrees).toBe(latitudeDegrees);
    expect(actual.rotationParameters.locationToleranceKm).toBe(locationToleranceKm);
    expect(actual.rotationDescription.phase).toEqual('S');
    expect(actual.rotationDescription.samplingType).toBe(
      gmsInteropModule.SamplingType.INTERPOLATED
    );
    expect(actual.rotationDescription.twoDimensional).toBe(true);
    actual.delete();
  });

  test('convertTimeRangesByChannel', () => {
    const channel: EntityReference<'name', Channel> = {
      name: 'RALPH'
    };
    const payload: TimeRangesByChannel[] = [
      {
        channel,
        timeRanges: [
          {
            startTime: 31536000.123456,
            endTime: 31536010.123456
          }
        ]
      }
    ];
    const actual: Wasm.VectorTimeRangesByChannel = convertToWasmTimeRangesByChannel(
      gmsInteropModule,
      payload
    );
    expect(actual.size()).toBe(payload.length);

    payload.forEach((entry, index) => {
      expect(actual.get(index)?.channelVersionReference.name).toBe(channel.name);
      const actualTimeRangeSize = actual.get(index)?.timeRanges.size();
      expect(actualTimeRangeSize).toBe(payload[index].timeRanges.length);
      const timeRange: Wasm.TimeRange | undefined = actual.get(index)?.timeRanges.get(0);
      expect(timeRange?.startTime).toBe(payload[index].timeRanges[0].startTime);
      expect(timeRange?.endTime).toBe(payload[index].timeRanges[0].endTime);
    });

    actual.delete();
  });

  test('convertChannelVersionReference', () => {
    const payload: VersionReference<'name', Channel> = {
      name: 'RALPH',
      effectiveAt: 31536000.123456
    };

    const actual: Wasm.ChannelVersionReference = convertToWasmChannelVersionReference(
      gmsInteropModule,
      payload
    );
    expect(actual.name).toBe('RALPH');
    expect(actual.effectiveAt).toBe(payload.effectiveAt);
    actual.delete();
  });

  test('convertChannelSegmentDescriptor', () => {
    const channel: VersionReference<'name', Channel> = {
      name: 'RALPH',
      effectiveAt: 31536000.123456
    };

    const payload: ChannelSegmentDescriptor = {
      channel,
      startTime: 31536010.123456,
      endTime: 31536020.123456,
      creationTime: 31536000.123456
    };
    const actual = convertToWasmChannelSegmentDescriptor(gmsInteropModule, payload);

    expect(actual.channel.name).toBe('RALPH');
    expect(actual.channel.effectiveAt).toBe(channel.effectiveAt);
    expect(actual.creationTime).toBe(payload.creationTime);
    expect(actual.startTime).toBe(payload.startTime);
    expect(actual.endTime).toBe(payload.endTime);
    actual.delete();
  });

  test('convertChannelSegment', () => {
    const channel: VersionReference<'name', Channel> = {
      name: 'RALPH',
      effectiveAt: 31536000.123456
    };

    const id: ChannelSegmentDescriptor = {
      channel,
      startTime: 31536010.123456,
      endTime: 31536020.123456,
      creationTime: 31536000.123456
    };

    const waveform: WaveformTypes.Waveform = {
      startTime: 31536010.123456,
      endTime: 31536020.123456,
      sampleCount: 121,
      sampleRateHz: 40.0,
      samples: new Float64Array([
        -124.3968, -126.3001, -120.4568, -121.1198, -121.282, -127.3256, -137.023, -131.1702,
        -132.606, -132.7586, -121.8497, -127.4926, -130.3927, -122.4507, -125.9566, -132.835,
        -129.4769, -124.912, -133.9368, -135.0101, -123.8626, -127.1539, -124.8452, -120.3185,
        -134.7859, -133.8891, -126.8725, -132.0336, -127.0156, -129.9968, -138.516, -135.5014,
        -137.7767, -136.3075, -128.9093, -132.6442, -124.3968, -126.3001, -120.4568, -121.1198,
        -121.282, -127.3256, -137.023, -131.1702, -132.606, -132.7586, -121.8497, -127.4926,
        -130.3927, -122.4507, -125.9566, -132.835, -129.4769, -124.912, -133.9368, -135.0101,
        -123.8626, -127.1539, -124.8452, -120.3185, -134.7859, -133.8891, -126.8725, -132.0336,
        -127.0156, -129.9968, -138.516, -135.5014, -137.7767, -136.3075, -128.9093, -132.6442,
        -142.0268, -148.1085, -145.132, -139.0169, -138.9119, -139.6895, -144.6693, -146.7443,
        -144.7313, -146.1099, -143.8155, -148.9051, -150.4744, -145.0509, -148.5378, -143.6676,
        -145.2083, -157.8632, -155.1681, -152.8928, -153.656, -146.5726, -144.8458, -150.1119,
        -155.2492, -158.903, -156.6182, -149.6444, -148.0847, -147.8557, -149.0482, -153.6703,
        -154.0281, -151.2042, -146.1576, -145.838, -147.5838, -148.2421, -150.5221, -145.9429,
        -141.7406, -138.0963, -138.6973, -147.0209, -142.685, -141.1968, -148.2278, -141.13,
        -136.3791, -140.3382, -136.8847, -139.3746, -144.0492, -134.0513, -136.8561, -147.579,
        -143.038, -141.8884, -141.8741, -141.5593, -144.24, -145.237, -150.6175, -146.8445,
        -144.9269, -149.2151, -142.5324, -141.0012, -144.9412, -152.3443, -156.2652, -155.2778,
        -154.0042, -141.836, -143.5436, -155.626, -154.0615, -155.5736, -160.8444, -157.472,
        -156.4894, -162.4424, -161.226, -159.1463, -166.8928, -142.0268, -148.1085, -145.132,
        -139.0169, -138.9119, -139.6895, -144.6693, -146.7443, -144.7313, -146.1099, -143.8155,
        -148.9051, -150.4744, -145.0509, -148.5378, -143.6676, -145.2083, -157.8632, -155.1681,
        -152.8928, -153.656, -146.5726, -144.8458, -150.1119, -155.2492, -158.903, -156.6182,
        -149.6444, -148.0847, -147.8557, -149.0482, -153.6703, -154.0281, -151.2042, -146.1576,
        -145.838, -147.5838, -148.2421, -150.5221, -145.9429, -141.7406, -138.0963, -138.6973,
        -147.0209, -142.685, -141.1968, -148.2278, -141.13, -136.3791, -140.3382, -136.8847,
        -139.3746, -144.0492, -134.0513, -136.8561, -147.579, -143.038, -141.8884, -141.8741,
        -141.5593, -144.24, -145.237, -150.6175, -146.8445, -144.9269, -149.2151, -142.5324,
        -141.0012, -144.9412, -152.3443, -156.2652, -155.2778, -154.0042, -141.836, -143.5436,
        -155.626, -154.0615, -155.5736, -160.8444, -157.472, -156.4894, -162.4424, -161.226,
        -159.1463, -166.8928
      ]),
      type: TimeseriesType.WAVEFORM
    };
    const timeRangeByChannelMap: TimeRangesByChannel[] = [
      {
        channel,
        timeRanges: [
          {
            startTime: 31536000.123456,
            endTime: 31536010.123456
          }
        ]
      }
    ];
    const waveforms: WaveformTypes.Waveform[] = [waveform];
    const processingMaps: ProcessingMask[] = [];

    const payload: ChannelSegment<WaveformTypes.Waveform> = {
      id,
      units: Units.HERTZ,
      timeseriesType: TimeseriesType.WAVEFORM,
      timeseries: waveforms,
      maskedBy: processingMaps,
      missingInputChannels: timeRangeByChannelMap
    };

    const actual: Wasm.ChannelSegment = convertToWasmChannelSegment(gmsInteropModule, payload);
    expect(actual.id.channel.name).toBe('RALPH');
    expect(actual.id.channel.effectiveAt).toBe(channel.effectiveAt);
    expect(actual.creationTime).toBe(id.creationTime);
    expect(actual.startTime).toBe(id.startTime);
    expect(actual.endTime).toBe(id.endTime);
    actual.delete();
  });

  test('convertProcessingOperationToWasm', () => {
    const expected: Wasm.ProcessingOperation = gmsInteropModule.ProcessingOperation.ROTATION;
    const payload: ProcessingOperation = ProcessingOperation.ROTATION;
    const actual = convertToWasmProcessingOperation(gmsInteropModule, payload);
    expect(actual).toEqual(expected);
  });

  test('convertProcessingMaskToWasm', () => {
    const channel: EntityReference<'name', Channel> = {
      name: 'RALPH'
    };
    const payload: ProcessingMask = {
      id: 'RALPH',
      effectiveAt: 31536000.123456,
      startTime: 31536001.123456,
      endTime: 31536003.123456,
      appliedToRawChannel: channel,
      processingOperation: ProcessingOperation.ROTATION,
      maskedQcSegmentVersions: []
    };
    const actual: Wasm.ProcessingMask = convertToWasmProcessingMask(gmsInteropModule, payload);
    expect(actual.effectiveAt).toBe(payload.effectiveAt);
    expect(actual.startTime).toBe(payload.startTime);
    expect(actual.endTime).toBe(payload.endTime);
    expect(actual.appliedToRawChannel.channelName).toBe(payload.appliedToRawChannel.name);
  });

  test('convertTaperDefinitionToWasm', () => {
    const payload: TaperDefinition = {
      taperLengthSamples: 100,
      taperFunction: TaperFunction.COSINE
    };
    const actual: Wasm.TaperDefinition = convertToWasmTaperDefinition(gmsInteropModule, payload);
    expect(actual.taperFunction.value).toEqual(
      Object.keys(TaperFunction).indexOf(payload.taperFunction)
    );
    expect(actual.taperLengthSamples).toEqual(payload.taperLengthSamples);
    actual.delete();
  });

  test('convertSignalDetectionHypothesisIdToWasm', () => {
    const payload: SignalDetectionHypothesisId = {
      id: '20cc9505-efe3-3068-b7d5-59196f37992c',
      signalDetectionId: '012de1b9-8ae3-3fd4-800d-58665c3152cc'
    };
    const actual: Wasm.SignalDetectionHypothesisId = convertToWasmSignalDetectionHypothesisId(
      gmsInteropModule,
      payload
    );
    expect(actual.id).toEqual(payload.id);
    expect(actual.signalDetectionId).toEqual(payload.signalDetectionId);
    actual.delete();
  });

  test('convertRelativePositionToWasm', () => {
    const payload: RelativePosition = Object.values(pdar.relativePositionsByChannel)[0];
    const actual: Wasm.RelativePosition = convertToWasmRelativePosition(gmsInteropModule, payload);
    expect(actual.northDisplacementKm).toEqual(payload.northDisplacementKm);
    expect(actual.eastDisplacementKm).toEqual(payload.eastDisplacementKm);
    expect(actual.verticalDisplacementKm).toEqual(payload.verticalDisplacementKm);
    actual.delete();
  });

  test('convertRelativePositionByChannelMapToWasm', () => {
    const payload: Record<string, RelativePosition> = pdar.relativePositionsByChannel;
    const actual: Wasm.RelativePositionByChannelMap = convertToWasmRelativePositionByChannelMap(
      gmsInteropModule,
      payload
    );
    const channelNames = Object.keys(payload);
    channelNames.forEach(channelName => {
      const actualRelativePosition = actual.get(channelName);
      const payloadRelativePosition = payload[channelName];
      expect(actualRelativePosition.northDisplacementKm).toEqual(
        payloadRelativePosition.northDisplacementKm
      );
      expect(actualRelativePosition.eastDisplacementKm).toEqual(
        payloadRelativePosition.eastDisplacementKm
      );
      expect(actualRelativePosition.verticalDisplacementKm).toEqual(
        payloadRelativePosition.verticalDisplacementKm
      );
    });
    actual.delete();
  });

  test('convertToWasmProcessingMasksByChannelMap', () => {
    const pdChannelName = 'PDAR.PD01.SHZ';
    const qcSegmentVersion: QcSegmentTypes.QcSegmentVersion = {
      id: { parentQcSegmentId: 'qcSegmentTestId', effectiveAt: 0 },
      startTime: 0,
      endTime: 100,
      createdBy: 'User 1',
      rejected: false,
      rationale: '',
      type: QcSegmentTypes.QcSegmentType.CALIBRATION,
      discoveredOn: undefined,
      stageId: undefined,
      category: QcSegmentTypes.QcSegmentCategory.ANALYST_DEFINED,
      channels: [{ name: pdChannelName, effectiveAt: 0 }]
    };
    const pd01ProcessingMask: ChannelSegmentTypes.ProcessingMask = {
      id: 'processing mask',
      effectiveAt: 0,
      startTime: 100,
      endTime: 200,
      appliedToRawChannel: { name: pdChannelName },
      processingOperation: ChannelSegmentTypes.ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM,
      maskedQcSegmentVersions: [qcSegmentVersion]
    };

    const pd01ProcessingMaskRecord: Record<string, ChannelSegmentTypes.ProcessingMask[]> = {
      [pdChannelName]: [pd01ProcessingMask]
    };
    const actual: Wasm.ProcessingMasksByChannelMap = convertToWasmProcessingMasksByChannelMap(
      gmsInteropModule,
      pd01ProcessingMaskRecord
    );
    expect(actual).toBeDefined();
    actual.delete();
  });

  test('convertChannelToWasm', () => {
    const payload: Channel = PD01Channel;
    const actual: Wasm.Channel = convertToWasmChannel(gmsInteropModule, payload);
    expect(actual.channelName).toEqual(payload.name);
    actual.delete();
  });
  test('convertStationVersionReference', () => {
    const payload: VersionReference<'name', Station> = {
      name: 'TEST',
      effectiveAt: 123
    };
    const actual: Wasm.StationVersionReference = convertToWasmStationVersionReference(
      gmsInteropModule,
      payload
    );
    expect(actual.name).toEqual(payload.name);
    actual.delete();
  });

  test('convertInstantValueToWasm', () => {
    const payload: InstantValue = {
      value: 7.121953,
      standardDeviation: 0.27,
      units: Units.SECONDS_PER_DEGREE
    };
    const actual: Wasm.InstantValue = convertToWasmInstantValue(gmsInteropModule, payload);
    expect(actual.value).toEqual(payload.value);
    expect(actual.standardDeviation).toEqual(payload.standardDeviation);
    actual.delete();
  });

  test('convertBeamDescription', () => {
    const payload = eventBeamDescription;
    const actual = convertToWasmBeamDescription(gmsInteropModule, payload);
    expect(actual).toBeTruthy();
    actual.delete();
  });

  test('convertBeamParametersToWasm', () => {
    const payload: BeamParameters = beamParameters;
    const actual = convertToWasmBeamParameters(gmsInteropModule, payload);
    expect(actual).toBeTruthy();
    actual.delete();
  });

  describe('Fk Compute to WASM converter', () => {
    test('convertToWasmFkSpectraDefinition', () => {
      const payload: FkTypes.FkSpectraDefinition = defaultSpectraDefinition;
      const actual: Wasm.FkSpectraDefinition = convertToWasmFkSpectraDefinition(
        gmsInteropModule,
        payload
      );

      expect(actual.fkParameters.phase).toEqual(payload.fkParameters.phase);
      expect(actual.orientationAngles.horizontalAngleDeg).toEqual(
        payload.orientationAngles.horizontalAngleDeg
      );
      actual.delete();
    });

    test('convertToWasmFkSpectra', () => {
      const payload: FkTypes.FkSpectraCOI = fkData;
      const actual: Wasm.FkSpectra = convertToWasmFkSpectra(gmsInteropModule, payload);
      expect(actual.startTime).toEqual(payload.startTime);
      expect(actual.endTime).toEqual(payload.endTime);
      expect(actual.sampleRateHz).toEqual(payload.sampleRateHz);
      expect(actual.fkSpectraMetadata?.fkSpectrumWindow.duration).toEqual(
        payload.fkSpectraMetadata?.fkSpectrumWindow.duration
      );
    });
  });
});
