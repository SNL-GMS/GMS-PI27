import type { Timeseries } from '../channel-segment';
import type { WaveformTypes } from '../common-model';

/**
 * TypeGuard to check type of a Timeseries to see if it is a {@link Waveform}.
 *
 * @param maybeWaveform a Timeseries to check if it is a Waveform timeseries and assert the type
 */
export function isWaveformTimeseries(
  maybeWaveform: Timeseries
): maybeWaveform is WaveformTypes.Waveform {
  return (
    (maybeWaveform as WaveformTypes.Waveform).samples != null ||
    (maybeWaveform as WaveformTypes.Waveform)._uiClaimCheckId != null
  );
}
