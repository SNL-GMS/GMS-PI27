package gms.shared.stationdefinition.coi.filter;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import gms.shared.stationdefinition.coi.utils.FilterValidator;
import java.util.Optional;
import javax.annotation.Nullable;

@AutoValue
@JsonDeserialize(builder = AutoValue_LinearFilterDescription.Builder.class)
public abstract class LinearFilterDescription implements FilterDescription {

  public abstract Optional<Double> getLowFrequencyHz();

  public abstract Optional<Double> getHighFrequencyHz();

  public abstract int getOrder();

  public abstract boolean isZeroPhase();

  public abstract PassBandType getPassBandType();

  public abstract LinearFilterType getLinearFilterType();

  public abstract Optional<LinearFilterParameters> getParameters();

  public static LinearFilterDescription.Builder builder() {
    return new AutoValue_LinearFilterDescription.Builder();
  }

  public static LinearFilterDescription from(
      Optional<String> comments,
      Optional<FrequencyAmplitudePhase> response,
      boolean causal,
      FilterType filterType,
      Optional<Double> lowFrequencyHz,
      Optional<Double> highFrequencyHz,
      int order,
      boolean zeroPhase,
      PassBandType passBandType,
      LinearFilterType linearFilterType,
      Optional<LinearFilterParameters> parameters) {

    var builder =
        builder()
            .setCausal(causal)
            .setFilterType(filterType)
            .setOrder(order)
            .setZeroPhase(zeroPhase)
            .setPassBandType(passBandType)
            .setLinearFilterType(linearFilterType);

    comments.ifPresent(builder::setComments);
    response.ifPresent(builder::setResponse);
    lowFrequencyHz.ifPresent(builder::setLowFrequencyHz);
    highFrequencyHz.ifPresent(builder::setHighFrequencyHz);
    parameters.ifPresent(builder::setParameters);

    return builder.build();
  }

  public abstract Builder toBuilder();

  public LinearFilterDescription withParameters(LinearFilterParameters parameters) {
    return toBuilder().setParameters(parameters).build();
  }

  public LinearFilterDescription withoutParameters() {
    return toBuilder().noParameters().build();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    Builder setComments(@Nullable String comments);

    default Builder noComments() {
      return setComments(null);
    }

    Builder setResponse(@Nullable FrequencyAmplitudePhase response);

    default Builder noResponse() {
      return setResponse(null);
    }

    Builder setCausal(boolean causal);

    Builder setFilterType(FilterType filterType);

    Builder setLowFrequencyHz(@Nullable Double lowFrequencyHz);

    default Builder noLowFrequencyHz() {
      return setLowFrequencyHz(null);
    }

    Builder setHighFrequencyHz(@Nullable Double highFrequencyHz);

    default Builder noHighFrequencyHz() {
      return setHighFrequencyHz(null);
    }

    Builder setOrder(int order);

    Builder setZeroPhase(boolean zeroPhase);

    Builder setPassBandType(PassBandType passBandType);

    Builder setLinearFilterType(LinearFilterType linearFilterType);

    Builder setParameters(@Nullable LinearFilterParameters parameters);

    default Builder noParameters() {
      return setParameters(null);
    }

    LinearFilterDescription autoBuild();

    default LinearFilterDescription build() {
      var description = autoBuild();

      FilterValidator.validate(description);

      return description;
    }
  }
}
