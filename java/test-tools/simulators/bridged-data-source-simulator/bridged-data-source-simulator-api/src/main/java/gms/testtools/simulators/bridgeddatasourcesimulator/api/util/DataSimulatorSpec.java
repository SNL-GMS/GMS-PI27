package gms.testtools.simulators.bridgeddatasourcesimulator.api.util;

import static com.google.common.base.Preconditions.checkArgument;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import java.time.Duration;
import java.time.Instant;

@AutoValue
@JsonSerialize(as = AutoValue_DataSimulatorSpec.class)
@JsonDeserialize(builder = AutoValue_DataSimulatorSpec.Builder.class)
public abstract class DataSimulatorSpec {

  public static DataSimulatorSpec.Builder builder() {
    return new AutoValue_DataSimulatorSpec.Builder();
  }

  public abstract DataSimulatorSpec.Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    DataSimulatorSpec.Builder setSeedDataStartTime(Instant seedDataStartTime);

    DataSimulatorSpec.Builder setSeedDataEndTime(Instant seedDataEndTime);

    DataSimulatorSpec.Builder setSimulationStartTime(Instant simulationStartTime);

    DataSimulatorSpec.Builder setOperationalTimePeriod(Duration operationalTimePeriod);

    DataSimulatorSpec.Builder setCalibUpdateFrequency(Duration calibUpdateFrequency);

    DataSimulatorSpec autoBuild();

    default DataSimulatorSpec build() {
      var bridgedDataSourceSimulatorSpec = autoBuild();
      // first make sure everything is correctly populated...
      checkArgument(
          bridgedDataSourceSimulatorSpec.getSeedDataStartTime().isBefore(Instant.now()),
          "Seed Data Start Time has to be in the past.");
      checkArgument(
          bridgedDataSourceSimulatorSpec.getSeedDataEndTime().isBefore(Instant.now()),
          "Seed Data End Time has to be in the past.");
      checkArgument(
          bridgedDataSourceSimulatorSpec
              .getSeedDataStartTime()
              .isBefore(bridgedDataSourceSimulatorSpec.getSeedDataEndTime()),
          "Start Time has to be before End Time.");
      checkArgument(
          (!bridgedDataSourceSimulatorSpec.getOperationalTimePeriod().isZero()
              && !bridgedDataSourceSimulatorSpec.getOperationalTimePeriod().isNegative()),
          "An Operational Time Period has to be set (in hours) as greater than 0.");
      checkArgument(
          (!bridgedDataSourceSimulatorSpec.getCalibUpdateFrequency().isZero()
              && !bridgedDataSourceSimulatorSpec.getCalibUpdateFrequency().isNegative()),
          "A Calibration Update Frequency has to be set (in hours) as greater to 0.");
      return bridgedDataSourceSimulatorSpec;
    }
  }

  public abstract Instant getSeedDataStartTime();

  public abstract Instant getSeedDataEndTime();

  public abstract Instant getSimulationStartTime();

  public abstract Duration getOperationalTimePeriod();

  public abstract Duration getCalibUpdateFrequency();
}
