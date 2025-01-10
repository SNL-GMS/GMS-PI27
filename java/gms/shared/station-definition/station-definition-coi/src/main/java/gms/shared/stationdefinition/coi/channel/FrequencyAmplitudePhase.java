package gms.shared.stationdefinition.coi.channel;

import static gms.shared.stationdefinition.coi.utils.StationDefinitionCoiUtils.FREQUENCY_AMPLITUDE_PHASE_COMPARATOR;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.IntStream;
import org.apache.commons.lang3.Validate;

/** A value class for storing the Frequency-Amplitude-Phase response of a given instrument */
@AutoValue
@JsonSerialize(as = FrequencyAmplitudePhase.class)
@JsonDeserialize(builder = AutoValue_FrequencyAmplitudePhase.Builder.class)
public abstract class FrequencyAmplitudePhase implements Comparable<FrequencyAmplitudePhase> {

  public abstract Builder toBuilder();

  public static Builder builder() {
    return new AutoValue_FrequencyAmplitudePhase.Builder();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    Builder setId(UUID id);

    UUID getId();

    @JsonUnwrapped
    default Builder setData(Data data) {
      return setData(Optional.ofNullable(data));
    }

    Builder setData(Optional<Data> data);

    FrequencyAmplitudePhase autoBuild();

    default FrequencyAmplitudePhase build() {
      return autoBuild();
    }
  }

  public static FrequencyAmplitudePhase createEntityReference(UUID id) {
    return new AutoValue_FrequencyAmplitudePhase.Builder().setId(id).build();
  }

  /**
   * Planning to add some sort of conversion between uuid and channelName. This conversion is
   * intended to be cached at the level of the accessor.
   */
  public abstract UUID getId();

  @JsonIgnore
  public boolean isPresent() {
    return getData().isPresent();
  }

  @JsonUnwrapped
  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  public abstract Optional<FrequencyAmplitudePhase.Data> getData();

  @JsonIgnore
  Optional<FrequencyAmplitudePhase.Data> getDataOptional() {
    return getData();
  }

  @AutoValue
  @JsonSerialize(as = FrequencyAmplitudePhase.Data.class)
  @JsonDeserialize(builder = AutoValue_FrequencyAmplitudePhase_Data.Builder.class)
  public abstract static class Data {

    public static FrequencyAmplitudePhase.Data.Builder builder() {
      return new AutoValue_FrequencyAmplitudePhase_Data.Builder();
    }

    public abstract FrequencyAmplitudePhase.Data.Builder toBuilder();

    @AutoValue.Builder
    @JsonPOJOBuilder(withPrefix = "set")
    public interface Builder {

      FrequencyAmplitudePhase.Data.Builder setFrequencies(List<Double> frequencies);

      Optional<List<Double>> getFrequencies();

      FrequencyAmplitudePhase.Data.Builder setAmplitudePhaseResponses(
          List<AmplitudePhaseResponse> amplitudePhaseResponses);

      Optional<List<AmplitudePhaseResponse>> getAmplitudePhaseResponses();

      FrequencyAmplitudePhase.Data.Builder setNominalCalibration(Calibration calibration);

      Optional<Calibration> getNominalCalibration();

      FrequencyAmplitudePhase.Data.Builder setNominalSampleRateHz(double sampleRateHz);

      Optional<Double> getNominalSampleRateHz();

      FrequencyAmplitudePhase.Data autoBuild();

      default FrequencyAmplitudePhase.Data build() {

        final List<Optional<?>> allFields =
            List.of(
                getFrequencies(),
                getAmplitudePhaseResponses(),
                getNominalCalibration(),
                getNominalSampleRateHz());
        final long numPresentFields = allFields.stream().filter(Optional::isPresent).count();

        if (0 == numPresentFields) {
          return null;
        } else if (allFields.size() != numPresentFields) {
          throw new IllegalStateException(
              "Either all or none of the FacetedDataClass fields must be populated");
        } else {
          FrequencyAmplitudePhase.Data fap = autoBuild();
          Validate.isTrue(
              fap.getFrequencies().size() == fap.getAmplitudePhaseResponses().size(),
              "The frequency list and the response list must be the same length");

          // Sort both arrays by frequency
          TreeMap<Double, AmplitudePhaseResponse> sortedByFreqMap = new TreeMap<>();
          IntStream.range(0, fap.getFrequencies().size())
              .forEach(
                  i ->
                      sortedByFreqMap.put(
                          fap.getFrequencies().get(i), fap.getAmplitudePhaseResponses().get(i)));

          // Rebuild the arrays, now sorted by frequency
          var sortedFrequencies = new ArrayList<Double>(sortedByFreqMap.keySet());
          var sortedAmplitudeResponses =
              new ArrayList<AmplitudePhaseResponse>(sortedByFreqMap.values());
          setFrequencies(sortedFrequencies);
          setAmplitudePhaseResponses(sortedAmplitudeResponses);

          return autoBuild();
        }
      }
    }

    @SuppressWarnings("mutable")
    public abstract List<Double> getFrequencies();

    @SuppressWarnings("mutable")
    public abstract List<AmplitudePhaseResponse> getAmplitudePhaseResponses();

    @SuppressWarnings("mutable")
    public abstract Calibration getNominalCalibration();

    @SuppressWarnings("mutable")
    public abstract Double getNominalSampleRateHz();
  }

  @Override
  public int compareTo(FrequencyAmplitudePhase otherResponse) {
    return FREQUENCY_AMPLITUDE_PHASE_COMPARATOR.compare(this, otherResponse);
  }

  @Override
  public abstract int hashCode();

  @Override
  public abstract boolean equals(Object obj);
}
