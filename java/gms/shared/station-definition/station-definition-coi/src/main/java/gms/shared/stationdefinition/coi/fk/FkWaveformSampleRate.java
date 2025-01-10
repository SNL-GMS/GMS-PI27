package gms.shared.stationdefinition.coi.fk;

import com.google.common.base.Preconditions;

public record FkWaveformSampleRate(
    double waveformSampleRateHz, double waveformSampleRateToleranceHz) {

  public FkWaveformSampleRate {

    Preconditions.checkArgument(
        waveformSampleRateHz > 0, "Waveform sample rate must be greater than zero.");
    Preconditions.checkArgument(
        waveformSampleRateToleranceHz >= 0,
        "Waveform sample rate tolerance must be greater than or equal to zero.");
  }
}
