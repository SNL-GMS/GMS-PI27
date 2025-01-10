package gms.shared.event.coi;

import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import java.util.Collection;

/**
 * Defines the NetworkMagnitudeSolution - measures the size of an {@link Event} occurring at a
 * {@link LocationSolution}
 */
@AutoValue
@JsonSerialize(as = NetworkMagnitudeSolution.class)
@JsonDeserialize(builder = AutoValue_NetworkMagnitudeSolution.Builder.class)
public abstract class NetworkMagnitudeSolution {

  public abstract MagnitudeType getType();

  public abstract DoubleValue getMagnitude();

  public abstract Builder toBuilder();

  public abstract ImmutableList<NetworkMagnitudeBehavior> getMagnitudeBehaviors();

  public static Builder builder() {
    return new AutoValue_NetworkMagnitudeSolution.Builder();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    private static final double MAX_MAGNITUDE = 10.0;

    public abstract Builder setType(MagnitudeType type);

    public abstract Builder setMagnitude(DoubleValue magnitude);

    abstract Builder setMagnitudeBehaviors(
        ImmutableList<NetworkMagnitudeBehavior> networkMagnitudeBehaviors);

    public Builder setMagnitudeBehaviors(
        Collection<NetworkMagnitudeBehavior> networkMagnitudeBehaviors) {
      return Builder.this.setMagnitudeBehaviors(ImmutableList.copyOf(networkMagnitudeBehaviors));
    }

    abstract ImmutableList.Builder<NetworkMagnitudeBehavior> magnitudeBehaviorsBuilder();

    public Builder addMagnitudeBehavior(NetworkMagnitudeBehavior networkMagnitudeBehavior) {
      magnitudeBehaviorsBuilder().add(networkMagnitudeBehavior);
      return this;
    }

    protected abstract NetworkMagnitudeSolution autoBuild();

    public NetworkMagnitudeSolution build() {
      NetworkMagnitudeSolution solution = autoBuild();

      checkState(
          solution.getMagnitude().getValue() <= MAX_MAGNITUDE,
          "Error creating NetworkMagnitudeSolution: magnitude must be <= %s, but was %s",
          MAX_MAGNITUDE,
          solution.getMagnitude());

      return solution;
    }
  }
}
