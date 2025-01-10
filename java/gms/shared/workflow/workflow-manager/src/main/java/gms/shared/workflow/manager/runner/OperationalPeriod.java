package gms.shared.workflow.manager.runner;

import com.google.auto.value.AutoValue;
import java.time.Duration;
import java.time.Instant;

/** Small POJO for holding information about the current Operational Time Period */
@AutoValue
public abstract class OperationalPeriod {

  public abstract Instant getOperationalStartTime();

  public abstract Instant getOperationalEndTime();

  public static OperationalPeriod now(
      Duration operationalStartPeriod, Duration operationalEndPeriod) {
    return from(Instant.now(), operationalStartPeriod, operationalEndPeriod);
  }

  public static OperationalPeriod from(
      Instant currentTime, Duration operationalStartPeriod, Duration operationalEndPeriod) {
    var operationalStartTime = currentTime.minus(operationalStartPeriod);
    var operationalEndTime = currentTime.minus(operationalEndPeriod);

    return create(operationalStartTime, operationalEndTime);
  }

  public static OperationalPeriod create(Instant operationalStartTime, Instant operationalEndTime) {
    return new AutoValue_OperationalPeriod(operationalStartTime, operationalEndTime);
  }
}
