package gms.shared.signaldetection.coi.detection;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.util.Optional;

/** Represents the precursor {@link ChannelSegment} to the measuredChannelSegment */
@AutoValue
@JsonSerialize(as = WaveformAndFilterDefinition.class)
@JsonDeserialize(builder = AutoValue_WaveformAndFilterDefinition.Builder.class)
public abstract class WaveformAndFilterDefinition {

  /**
   * @return the precursor {@link ChannelSegment}
   */
  public abstract ChannelSegment<Waveform> getWaveform();

  /**
   * @return the filter applied to waveform to create the measuredChannelSegment
   */
  public abstract Optional<FilterDefinition> getFilterDefinition();

  /**
   * @return the intent behind applying the filter; only populated for ARRIVAL_TIME {@link
   *     FeatureMeasurement}s
   */
  public abstract Optional<FilterDefinitionUsage> getFilterDefinitionUsage();

  public static Builder builder() {
    return new AutoValue_WaveformAndFilterDefinition.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    /**
     * @param waveform the precursor {@link ChannelSegment}
     * @return the updated WaveformAndFilterDefinition builder
     */
    public abstract Builder setWaveform(ChannelSegment<Waveform> waveform);

    /**
     * @param filterDefinitionOptional the filter applied to waveform to create the
     *     measuredChannelSegment
     * @return the updated WaveformAndFilterDefinition builder
     */
    public abstract Builder setFilterDefinition(
        Optional<FilterDefinition> filterDefinitionOptional);

    /**
     * @param filterDefinition the filter applied to waveform to create the measuredChannelSegment
     * @return the updated WaveformAndFilterDefinition builder
     */
    public Builder setFilterDefinition(FilterDefinition filterDefinition) {
      return setFilterDefinition(Optional.ofNullable(filterDefinition));
    }

    /**
     * @param filterDefinitionUsageOptional the intent behind applying the filter; only populated
     *     for ARRIVAL_TIME {@link FeatureMeasurement}s
     * @return the updated WaveformAndFilterDefinition builder
     */
    public abstract Builder setFilterDefinitionUsage(
        Optional<FilterDefinitionUsage> filterDefinitionUsageOptional);

    /**
     * @param filterDefinitionUsage the intent behind applying the filter; only populated for
     *     ARRIVAL_TIME {@link FeatureMeasurement}s
     * @return the updated WaveformAndFilterDefinition builder
     */
    public Builder setFilterDefinitionUsage(FilterDefinitionUsage filterDefinitionUsage) {
      return setFilterDefinitionUsage(Optional.ofNullable(filterDefinitionUsage));
    }

    public abstract WaveformAndFilterDefinition build();
  }
}
