package gms.shared.stationdefinition.coi.filter;

import static com.google.common.base.Preconditions.checkArgument;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import java.time.Duration;
import java.util.Optional;

@AutoValue
public abstract class PhaseMatchFilterDescription implements FilterDescription {

  public abstract String getDispersionModelName();

  public abstract double getLowFrequencyHz();

  public abstract Optional<Double> getLowFrequencyTaperWidthHz();

  public abstract double getHighFrequencyHz();

  public abstract Optional<Double> getHighFrequencyTaperWidthHz();

  public abstract TaperFunction getFrequencyTaperFunction();

  public abstract int getNumFrequencies();

  public abstract Duration getReferencePeriod();

  public abstract Duration getExpansionDuration();

  public abstract PhaseType getPhase();

  public abstract TaperDefinition getTimeDomainTaperDefinition();

  public abstract Optional<PhaseMatchFilterParameters> getParameters();

  @Override
  public FilterType getFilterType() {
    return FilterType.PHASE_MATCH;
  }

  @JsonCreator
  public static PhaseMatchFilterDescription from(
      @JsonProperty("comments") String comments,
      @JsonProperty("response") FrequencyAmplitudePhase response,
      @JsonProperty("causal") boolean causal,
      @JsonProperty("dispersionModelName") String dispersionModelName,
      @JsonProperty("lowFrequencyHz") double lowFrequencyHz,
      @JsonProperty("lowFrequencyTaperWidthHz") Double lowFrequencyTaperWidthHz,
      @JsonProperty("highFrequencyHz") double highFrequencyHz,
      @JsonProperty("highFrequencyTaperWidthHz") Double highFrequencyTaperWidthHz,
      @JsonProperty("frequencyTaperFunction") TaperFunction frequencyTaperFunction,
      @JsonProperty("numFrequencies") int numFrequencies,
      @JsonProperty("referencePeriod") Duration referencePeriod,
      @JsonProperty("expansionDuration") Duration expansionDuration,
      @JsonProperty("phase") PhaseType phase,
      @JsonProperty("timeDomainTaperDefinition") TaperDefinition timeDomainTaperDefinition,
      @JsonProperty("parameters") PhaseMatchFilterParameters parameters) {

    checkArgument(causal, "causal must be true");

    checkDurationGreaterThanState(referencePeriod);
    checkDurationGreaterThanEqualToState(expansionDuration);

    checkArgument(highFrequencyHz > 0.0, "High frequency must be greater than zero");
    checkArgument(
        highFrequencyHz > lowFrequencyHz, "High frequency must be greater than lower frequency");
    checkArgument(lowFrequencyHz > 0.0, "Low frequency must be greater than zero");
    checkArgument(numFrequencies > 0, "Number of frequencies must be greater than zero");

    checkFrequencyGreaterThanState(lowFrequencyTaperWidthHz);
    checkFrequencyGreaterThanState(highFrequencyTaperWidthHz);

    return new AutoValue_PhaseMatchFilterDescription(
        Optional.ofNullable(comments),
        Optional.ofNullable(response),
        causal,
        dispersionModelName,
        lowFrequencyHz,
        Optional.ofNullable(lowFrequencyTaperWidthHz),
        highFrequencyHz,
        Optional.ofNullable(highFrequencyTaperWidthHz),
        frequencyTaperFunction,
        numFrequencies,
        referencePeriod,
        expansionDuration,
        phase,
        timeDomainTaperDefinition,
        Optional.ofNullable(parameters));
  }

  private static void checkDurationGreaterThanEqualToState(Duration duration) {
    checkArgument(duration.toNanos() >= 0, "Duration values must be greater than or equal to 0");
  }

  private static void checkDurationGreaterThanState(Duration duration) {
    checkArgument(duration.toNanos() > 0, "Duration values must be greater than 0");
  }

  private static void checkFrequencyGreaterThanState(Double frequency) {
    checkArgument(frequency > 0, "Frequency taper values must be greater than 0");
  }
}
