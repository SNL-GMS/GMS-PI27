package gms.shared.stationdefinition.configuration;

import com.google.common.base.Preconditions;

/**
 * Value class for holding the configuration values used to interpolate the frequency list stored in
 * a {@link FrequencyAmplitudePhase} object
 */
public record FrequencyAmplitudePhaseDefinition(
    double lowerFrequencyBoundHz,
    double upperFrequencyBoundHz,
    FrequencySamplingMode frequencySamplingMode,
    int frequencySamplingCount) {

  public FrequencyAmplitudePhaseDefinition {
    Preconditions.checkArgument(
        lowerFrequencyBoundHz > 0.0, "The lowerFrequencyBoundHz must be positive");
    Preconditions.checkArgument(
        upperFrequencyBoundHz > lowerFrequencyBoundHz,
        "The upperFrequencyBoundHz must be greater than the lowerFrequencyBoundHz");
    Preconditions.checkNotNull(frequencySamplingMode);
    Preconditions.checkArgument(
        frequencySamplingCount > 0.0, "The frequencySamplingCount must be positive");
  }
}
