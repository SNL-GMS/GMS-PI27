package gms.shared.stationdefinition.coi.fk;

import com.google.common.base.Preconditions;

/** This class stores the allowable frequency range for waveforms used to calculate fk */
public record FkFrequencyRange(double lowFrequencyHz, double highFrequencyHz) {
  public FkFrequencyRange {

    Preconditions.checkArgument(
        lowFrequencyHz > 0, "Lower frequency bound must be greater than zero.");
    Preconditions.checkArgument(
        highFrequencyHz > lowFrequencyHz,
        "High frequency bound must be higher than low frequency bound.");
  }
}
