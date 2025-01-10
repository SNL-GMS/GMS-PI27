package gms.shared.waveform.coi;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;

/** A container for attributes associated with an FK. */
@AutoValue
@JsonSerialize(as = FkAttributes.class)
@JsonDeserialize(builder = AutoValue_FkAttributes.Builder.class)
public abstract class FkAttributes {

  public abstract double getAzimuth();

  public abstract double getSlowness();

  public abstract double getAzimuthUncertainty();

  public abstract double getSlownessUncertainty();

  public abstract double getPeakFStat();

  public static Builder builder() {
    return new AutoValue_FkAttributes.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Builder setAzimuth(double azimuth);

    public abstract Builder setSlowness(double slowness);

    public abstract Builder setAzimuthUncertainty(double azimuthUncertainty);

    public abstract Builder setSlownessUncertainty(double slownessUncertainty);

    public abstract Builder setPeakFStat(double peakFStat);

    protected abstract FkAttributes autobuild();

    public FkAttributes build() {
      FkAttributes attributes = autobuild();

      Preconditions.checkArgument(
          attributes.getAzimuthUncertainty() >= 0,
          "Azimuth uncertainty must be greater than or equal to zero");
      Preconditions.checkArgument(
          attributes.getSlownessUncertainty() >= 0,
          "Slowness uncertainty must be greater than or equal to zero");

      return attributes;
    }
  }
}
