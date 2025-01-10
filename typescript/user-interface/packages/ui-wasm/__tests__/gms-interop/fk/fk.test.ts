import type { ChannelTypes, StationTypes, WaveformTypes } from '@gms/common-model';
import { ChannelSegmentTypes, FkTypes, QcSegmentTypes } from '@gms/common-model';
import { PD01Channel, pdar } from '@gms/common-model/__tests__/__data__/station-definitions';

import type { ComputeFkArgs } from '../../../src/ts/gms-interop/fk/fk';
import { computeFkWasm, getPeakFkAttributesWasm } from '../../../src/ts/gms-interop/fk/fk';
import { defaultSpectraDefinition, fkData } from '../test-data/fk-data';
import { genericTestData } from '../test-data/generic-test-data-3s';

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

const relativePositionByChannelMap: Record<string, ChannelTypes.RelativePosition> =
  pdar.relativePositionsByChannel;

describe('ComputeFk', () => {
  /**
   * TODO: This test is handing the wrong channel segments for PDAR, they are coming in from
   * std::invalid_argument: Failed to retrieve the relative position for channel name MA2.MA2.BHE
   */
  test('interop computeFkWasm', async () => {
    const chanSegs: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[] = [];
    const chanSeg: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform> = {
      ...genericTestData[0],
      id: {
        ...genericTestData[0].id,
        channel: {
          name: PD01Channel.name,
          effectiveAt: PD01Channel.effectiveAt
        }
      }
    };
    chanSegs.push(chanSeg);

    const props: ComputeFkArgs = {
      fkSpectraDefinition: defaultSpectraDefinition,
      station: {
        name: 'PDAR',
        effectiveAt: 100,
        relativePositionsByChannel: relativePositionByChannelMap
      } as StationTypes.Station,
      inputChannelNames: [pdChannelName],
      detectionTime: 200,
      startTime: 100,
      endTime: 310,
      channelSegments: chanSegs,
      processingMasksByChannel: pd01ProcessingMaskRecord,
      maskTaperDefinition: {
        taperLengthSamples: 100,
        taperFunction: FkTypes.TaperFunction.COSINE
      }
    };

    const result = await computeFkWasm(props);
    expect(result).toBeDefined();
    expect(result.missingInputChannels).toHaveLength(1);
    expect(result.missingInputChannels).toMatchSnapshot();
    expect(result.timeseries).toHaveLength(1);
    expect(result.timeseries[0].startTime).toEqual(props.startTime);
    expect(result.timeseries[0].endTime).toEqual(props.endTime);
    expect(result.timeseries[0]).toMatchSnapshot();
  });
});

describe('GetPeakAttributes', () => {
  test('interop getPeakFkAttributesWasm', async () => {
    const result = await getPeakFkAttributesWasm(fkData);
    expect(result).toBeDefined();
    expect(result.peakFStat).not.toBeUndefined();
    expect(result.receiverToSourceAzimuth).not.toBeUndefined();
    expect(result.slowness).not.toBeUndefined();
    expect(result).toMatchSnapshot();
  });
});
