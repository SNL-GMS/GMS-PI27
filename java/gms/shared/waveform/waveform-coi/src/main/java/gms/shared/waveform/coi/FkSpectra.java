package gms.shared.waveform.coi;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.PhaseType;
import java.time.Instant;
import java.util.List;

/**
 * A type of {@link Timeseries} where each element in the series is an {@link FkSpectrum}. Each
 * FkSpectrum in a FkSpectra is computed in the same way, so the {@link Metadata} is stored at the
 * FkSpectra level. {@link Timeseries#getSampleRate()} determines the separation in FkSpectrum
 * times.
 */
@Deprecated(since = "Aug. 2023", forRemoval = true)
@AutoValue
@JsonSerialize(as = FkSpectra.class)
@JsonDeserialize(builder = AutoValue_FkSpectra.Builder.class)
public abstract class FkSpectra extends Timeseries {
  public static Builder builder() {
    return new AutoValue_FkSpectra.Builder();
  }

  public abstract Builder toBuilder();

  /**
   * An immutable {@link List} of Fk Spectrum with the same metadata, incrementing in time
   * continuously given this {@link Timeseries}'s start time and sample rate.
   */
  public abstract List<FkSpectrum> getValues();

  /**
   * Obtain the {@link Metadata} associated with the FkSpectra. This metadata should be assumed to
   * associate with each {@link FkSpectrum} of this FkSpectra.
   *
   * @return The metadata for this FkSpectra
   */
  public abstract Metadata getMetadata();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    private static final int NO_NEED_TO_FIND_MORE_THAN_TWO = 2;

    abstract Builder setType(Type value);

    public abstract Builder setStartTime(Instant value);

    public abstract Builder setSampleRateHz(double value);

    public abstract Builder setSampleCount(int value);

    public abstract Builder setValues(List<FkSpectrum> values);

    abstract List<FkSpectrum> getValues();

    public Builder withValues(List<FkSpectrum> values) {
      return setValues(values).setSampleCount(values.size());
    }

    public abstract Builder setMetadata(Metadata value);

    public abstract Metadata.Builder metadataBuilder();

    abstract FkSpectra autobuild();

    public FkSpectra build() {
      setType(Type.FK_SPECTRA_OLD).setValues(ImmutableList.copyOf(getValues()));
      var fkSpectra = autobuild();

      Preconditions.checkState(
          !fkSpectra.getValues().isEmpty(), "cannot contain empty FkSpectrum values");

      Preconditions.checkState(
          fkSpectra.getValues().stream()
                  .map(FkSpectrum::getPower)
                  .mapToInt(Immutable2dDoubleArray::rowCount)
                  .distinct()
                  .limit(NO_NEED_TO_FIND_MORE_THAN_TWO)
                  .count()
              <= 1,
          "Power must contain the same number of rows");
      Preconditions.checkState(
          fkSpectra.getValues().stream()
                  .map(FkSpectrum::getPower)
                  .mapToInt(Immutable2dDoubleArray::columnCount)
                  .distinct()
                  .limit(NO_NEED_TO_FIND_MORE_THAN_TWO)
                  .count()
              <= 1,
          "Power must contain the same number of columns");

      var sampleError =
          String.format(
              "The number of FkSpectrum objects found in the FkSpectra"
                  + " does not match the Sample Count specified in the Channel Segment object "
                  + "(expected %d, found %d).",
              fkSpectra.getSampleCount(), fkSpectra.getValues().size());
      Preconditions.checkState(
          fkSpectra.getSampleCount() == fkSpectra.getValues().size(), sampleError);
      return fkSpectra;
    }
  }

  @AutoValue
  @JsonSerialize(as = Metadata.class)
  @JsonDeserialize(builder = AutoValue_FkSpectra_Metadata.Builder.class)
  public abstract static class Metadata {

    public static Metadata.Builder builder() {
      return new AutoValue_FkSpectra_Metadata.Builder();
    }

    public abstract Metadata.Builder toBuilder();

    /** The assumed phase used to calculate this FkSpectra */
    public abstract PhaseType getPhaseType();

    /** The start of the slowness grid in the X (East/West) direction */
    public abstract double getSlowStartX();

    /** The start of the slowness grid in the Y (North/South) direction */
    public abstract double getSlowStartY();

    /** The step size of the slowness grid in the X (East/West) direction */
    public abstract double getSlowDeltaX();

    /** The step size of the slowness grid in the Y (North/South) direction */
    public abstract double getSlowDeltaY();

    @AutoValue.Builder
    @JsonPOJOBuilder(withPrefix = "set")
    public interface Builder {

      Builder setPhaseType(PhaseType value);

      Builder setSlowStartX(double value);

      Builder setSlowStartY(double value);

      Builder setSlowDeltaX(double value);

      Builder setSlowDeltaY(double value);

      Metadata build();
    }
  }
}
