package gms.shared.signaldetection.coi.values;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/** Represents a measure of time with a standard deviation. */
@AutoValue
public abstract class InstantValue {

  /**
   * Gets the value (time)
   *
   * @return the time
   */
  public abstract Instant getValue();

  /**
   * Gets the standard deviation of this value
   *
   * @return duration of the standard deviation
   */
  public abstract Optional<Duration> getStandardDeviation();

  /**
   * Recreation factory method (sets the InstantValue entity identity). Used for deserialization and
   * recreating from persistence.
   *
   * @param value The arrival time
   * @param standardDeviation The standard deviation
   * @return InstantValue
   * @throws IllegalArgumentException if any of the parameters are null
   */
  @JsonCreator
  public static InstantValue from(
      @JsonProperty("value") Instant value,
      @JsonProperty("standardDeviation") Duration standardDeviation) {
    return new AutoValue_InstantValue(value, Optional.ofNullable(standardDeviation));
  }

  /**
   * Recreation factory method (sets the InstantValue entity identity).
   *
   * @param value The arrival time
   * @return InstantValue
   */
  public static InstantValue from(@JsonProperty("value") Instant value) {
    return new AutoValue_InstantValue(value, Optional.empty());
  }
}
