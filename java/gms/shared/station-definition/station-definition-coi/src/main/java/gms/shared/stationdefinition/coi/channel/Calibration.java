package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import java.time.Duration;
import java.util.Objects;

/**
 * Represents a limited set of calibration information used during the acquisition of data streams.
 */
@AutoValue
public abstract class Calibration {

  public abstract double getCalibrationPeriodSec();

  public abstract Duration getCalibrationTimeShift();

  public abstract DoubleValue getCalibrationFactor();

  @JsonCreator
  public static Calibration from(
      @JsonProperty("calibrationPeriodSec") double calibrationPeriodSec,
      @JsonProperty("calibrationTimeShift") Duration calibrationTimeShift,
      @JsonProperty("calibrationFactor") DoubleValue calibrationFactor) {
    return new AutoValue_Calibration(calibrationPeriodSec, calibrationTimeShift, calibrationFactor);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        this.getCalibrationFactor().getValue(),
        this.getCalibrationPeriodSec(),
        this.getCalibrationTimeShift());
  }

  @Override
  public boolean equals(Object obj) {
    if (obj == this) {
      return true;
    }
    if (obj == null) {
      return false;
    }
    if (this.getClass() == obj.getClass()) {
      Calibration that = (Calibration) obj;
      return Double.compare(
                  this.getCalibrationFactor().getValue(), that.getCalibrationFactor().getValue())
              == 0
          && Double.compare(this.getCalibrationPeriodSec(), that.getCalibrationPeriodSec()) == 0
          && this.getCalibrationTimeShift().equals(that.getCalibrationTimeShift());
    }
    return false;
  }
}
