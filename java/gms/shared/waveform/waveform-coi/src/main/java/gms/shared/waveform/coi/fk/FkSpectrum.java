package gms.shared.waveform.coi.fk;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.waveform.coi.Immutable2dDoubleArray;
import java.util.Optional;

/** Contains the fstat and power arrays used to find the peak power and optionally fkAttributes */
public record FkSpectrum(
    Immutable2dDoubleArray fstat,
    Immutable2dDoubleArray power,
    Optional<Double> fkQual,
    Optional<FkAttributes> fkAttributes) {

  public FkSpectrum {

    Preconditions.checkNotNull(fstat);
    Preconditions.checkNotNull(power);
    Preconditions.checkArgument(
        power.rowCount() == fstat.rowCount(), "Power and Fstat must have same row count");

    Preconditions.checkArgument(
        power.columnCount() == fstat.columnCount(), "Power and Fstat must have same column count");
  }

  @JsonCreator
  public FkSpectrum(
      @JsonProperty("fstat") double[][] fstatArray,
      @JsonProperty("power") double[][] powerArray,
      @JsonProperty("fkQual") Double fkQualVal,
      @JsonProperty("fkAttributes") FkAttributes fkAttributes) {

    this(
        Immutable2dDoubleArray.from(fstatArray),
        Immutable2dDoubleArray.from(powerArray),
        Optional.ofNullable(fkQualVal),
        Optional.ofNullable(fkAttributes));
  }

  /**
   * contains the value of peakFstat and the slowness and azimuth corresponding to the location of
   * the peak
   */
  public record FkAttributes(
      double peakFstat, DoubleValue slowness, DoubleValue receiverToSourceAzimuth) {

    public FkAttributes {

      Preconditions.checkArgument(
          slowness.getStandardDeviation().orElse(0.0) >= 0,
          "Slowness uncertainty must be greater than or equal to zero");

      Preconditions.checkArgument(
          receiverToSourceAzimuth.getValue() >= 0, "Azimuth must be greater than or equal to zero");

      Preconditions.checkArgument(
          receiverToSourceAzimuth.getStandardDeviation().orElse(0.0) >= 0,
          "Azimuth uncertainty must be greater than or equal to zero");
    }
  }

  @JsonProperty("fstat")
  public double[][] getPowerMutable() {
    return power.copyOf();
  }

  @JsonProperty("power")
  public double[][] getFstatMutable() {
    return fstat.copyOf();
  }
}
