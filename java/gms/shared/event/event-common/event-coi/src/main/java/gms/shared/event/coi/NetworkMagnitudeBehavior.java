package gms.shared.event.coi;

import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;

/**
 * Defines the NetworkMagnitudeBehavior class - represents the relationship between a {@link
 * NetworkMagnitudeSolution} and each {@link StationMagnitudeSolution}
 */
@AutoValue
@JsonSerialize(as = NetworkMagnitudeBehavior.class)
@JsonDeserialize(builder = AutoValue_NetworkMagnitudeBehavior.Builder.class)
public abstract class NetworkMagnitudeBehavior {

  public abstract boolean isDefining();

  public abstract double getResidual();

  public abstract double getWeight();

  public abstract StationMagnitudeSolution getStationMagnitudeSolution();

  public static Builder builder() {
    return new AutoValue_NetworkMagnitudeBehavior.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    private static final double MIN_RESIDUAL = -10.0;
    private static final double MAX_RESIDUAL = 10.0;

    public abstract Builder setDefining(boolean defining);

    public abstract Builder setResidual(double residual);

    public abstract Builder setWeight(double weight);

    public abstract Builder setStationMagnitudeSolution(
        StationMagnitudeSolution stationMagnitudeSolution);

    protected abstract NetworkMagnitudeBehavior autoBuild();

    public NetworkMagnitudeBehavior build() {
      NetworkMagnitudeBehavior behavior = autoBuild();

      checkState(
          behavior.getResidual() >= MIN_RESIDUAL && behavior.getResidual() <= MAX_RESIDUAL,
          "Error creating NetworkMagnitudeBehavior: residual must be in [%s, %s], but was %s",
          MIN_RESIDUAL,
          MAX_RESIDUAL,
          behavior.getResidual());

      checkState(
          behavior.getWeight() >= 0,
          "Error creating NetworkMagnitudeBehavior: weight must be >= 0, but was "
              + behavior.getWeight());

      return behavior;
    }
  }
}
