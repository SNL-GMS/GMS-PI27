package gms.shared.frameworks.configuration.constraints;

import static java.util.concurrent.TimeUnit.HOURS;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import java.time.Duration;
import java.time.LocalTime;

/** A {@link ModuloRange} using {@link LocalTime} values. */
@AutoValue
public abstract class TimeOfDayRange extends ModuloRange<LocalTime> {

  private static final int HOURS_PER_DAY = 24;

  @JsonCreator
  public static TimeOfDayRange from(
      @JsonProperty("min") LocalTime min, @JsonProperty("max") LocalTime max) {

    return new AutoValue_TimeOfDayRange(min, max);
  }

  TimeOfDayRange() {
    super(HOURS.toNanos(HOURS_PER_DAY));
  }

  public abstract LocalTime getMin();

  public abstract LocalTime getMax();

  public long getDuration(LocalTime min, LocalTime max) {
    return Duration.between(min, max).toNanos();
  }

  public LocalTime toSupportedValue(LocalTime val) {
    return val;
  }
}
