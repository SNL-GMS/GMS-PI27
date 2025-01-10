package gms.shared.fk.plugin.util;

import com.google.auto.value.AutoValue;

@AutoValue
public abstract class FkSpectraInfo {

  public abstract double getLowFrequency();

  public abstract double getHighFrequency();

  public abstract double getEastSlowStart();

  public abstract double getEastSlowDelta();

  public abstract double getNorthSlowStart();

  public abstract double getNorthSlowDelta();

  public static Builder builder() {
    return new AutoValue_FkSpectraInfo.Builder();
  }

  @AutoValue.Builder
  public abstract static class Builder {

    public abstract Builder setLowFrequency(double lowFrequency);

    public abstract Builder setHighFrequency(double highFrequency);

    public abstract Builder setEastSlowStart(double eastSlowStart);

    public abstract Builder setEastSlowDelta(double eastSlowDelta);

    public abstract Builder setNorthSlowStart(double northSlowStart);

    public abstract Builder setNorthSlowDelta(double northSlowDelta);

    public abstract FkSpectraInfo build();
  }
}
