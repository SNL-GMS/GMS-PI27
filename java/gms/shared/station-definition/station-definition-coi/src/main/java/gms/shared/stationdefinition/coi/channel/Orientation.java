package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import java.util.Optional;

@AutoValue
public abstract class Orientation {

  public abstract Optional<Double> getHorizontalAngleDeg();

  public abstract Optional<Double> getVerticalAngleDeg();

  @JsonCreator
  public static Orientation from(
      @JsonProperty("horizontalAngleDeg") Optional<Double> horizontalAngleDeg,
      @JsonProperty("verticalAngleDeg") Optional<Double> verticalAngleDeg) {
    return new AutoValue_Orientation(horizontalAngleDeg, verticalAngleDeg);
  }
}
