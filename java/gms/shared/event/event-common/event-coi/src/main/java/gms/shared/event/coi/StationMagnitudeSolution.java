package gms.shared.event.coi;

import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import java.util.Optional;
import javax.annotation.Nullable;

/**
 * Defines the StationMagnitudeSolution class - measures the size of an {@link Event} occuring at a
 * {@link LocationSolution}
 */
@AutoValue
@JsonSerialize(as = StationMagnitudeSolution.class)
@JsonDeserialize(builder = AutoValue_StationMagnitudeSolution.Builder.class)
public abstract class StationMagnitudeSolution {

  public abstract MagnitudeType getType();

  public abstract MagnitudeModel getModel();

  public abstract Station getStation();

  public abstract PhaseType getPhase();

  public abstract DoubleValue getMagnitude();

  public abstract Optional<Double> getModelCorrection();

  public abstract Optional<Double> getStationCorrection();

  public abstract Optional<FeatureMeasurement<AmplitudeMeasurementValue>> getMeasurement();

  public static Builder builder() {
    return new AutoValue_StationMagnitudeSolution.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    private static final double MIN_MAGNITUDE = -9.99;
    private static final double MAX_MAGNITUDE = 50.0;

    public abstract Builder setType(MagnitudeType type);

    public abstract Builder setModel(MagnitudeModel model);

    public abstract Builder setStation(Station station);

    public abstract Builder setPhase(PhaseType phase);

    public abstract Builder setMagnitude(DoubleValue magnitude);

    public abstract Builder setModelCorrection(@Nullable Double modelCorrection);

    public Builder noModelCorrection() {
      return this.setModelCorrection(null);
    }

    public abstract Builder setStationCorrection(@Nullable Double stationCorrection);

    public Builder noStationCorrection() {
      return this.setStationCorrection(null);
    }

    public abstract Builder setMeasurement(
        @Nullable FeatureMeasurement<AmplitudeMeasurementValue> measurement);

    public Builder noMeasurement() {
      return this.setMeasurement(null);
    }

    protected abstract StationMagnitudeSolution autoBuild();

    public StationMagnitudeSolution build() {
      StationMagnitudeSolution solution = autoBuild();

      var magValue = solution.getMagnitude().getValue();
      checkState(
          magValue >= MIN_MAGNITUDE && magValue <= MAX_MAGNITUDE,
          "Error creating StationMagnitudeSolution: magnitude must be in [%s, %s], but was %s",
          MIN_MAGNITUDE,
          MAX_MAGNITUDE,
          solution.getMagnitude());

      checkState(
          solution.getModelCorrection().map(mc -> mc >= 0).orElse(true),
          "Error creating StationMagnitudeSolution: modelCorrection must be >= 0 if present, but"
              + " was %s",
          solution.getModelCorrection().orElse(-1.0));

      checkState(
          solution.getStationCorrection().map(sc -> sc >= 0).orElse(true),
          "Error creating StationMagnitudeSolution: stationCorrection must be >= 0 if present, but"
              + " was %s",
          solution.getStationCorrection().orElse(-1.0));
      return solution;
    }
  }
}
