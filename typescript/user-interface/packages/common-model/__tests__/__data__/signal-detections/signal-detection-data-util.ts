import cloneDeep from 'lodash/cloneDeep';

import type { SignalDetection } from '../../../src/ts/signal-detection';
import type { Channel } from '../../../src/ts/station-definitions/channel-definitions/channel-definitions';
import type { Station } from '../../../src/ts/station-definitions/station-definitions/station-definitions';
import { signalDetectionAsarEventBeam } from './signal-detection-data';

export function createSignalDetectionForTest(
  station: Station,
  channel: Channel,
  id?: string
): SignalDetection {
  const signalDetection = { ...cloneDeep(signalDetectionAsarEventBeam) };
  const sdId = id ?? signalDetection.id;
  signalDetection.id = sdId;
  signalDetection.station.name = station.name;
  signalDetection.signalDetectionHypotheses.map(signalDetectionHypothesis => {
    return {
      ...signalDetectionHypothesis,
      id: {
        ...signalDetectionHypothesis.id,
        signalDetectionId: sdId
      },
      station: {
        ...signalDetectionHypothesis.station,
        name: station.name
      },
      featureMeasurements: signalDetectionHypothesis.featureMeasurements.map(
        featureMeasurement => ({
          ...featureMeasurement,
          channel: {
            ...featureMeasurement.channel,
            name: channel.name
          },
          measuredChannelSegment: {
            ...featureMeasurement.measuredChannelSegment,
            id: {
              ...featureMeasurement.measuredChannelSegment?.id,
              channel: {
                ...featureMeasurement.measuredChannelSegment?.id.channel,
                name: channel.name
              }
            }
          }
        })
      )
    };
  });

  return signalDetection;
}
