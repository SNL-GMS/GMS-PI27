package gms.shared.waveform.coi.fk;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.fk.FkWindow;
import gms.shared.stationdefinition.coi.fk.SlownessGrid;
import gms.shared.waveform.coi.Immutable2dDoubleArray;
import gms.shared.waveform.coi.Timeseries;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import javax.annotation.Nullable;
import org.apache.commons.lang3.Validate;

@AutoValue
@JsonSerialize(as = FkSpectra.class)
@JsonDeserialize(builder = AutoValue_FkSpectra.Builder.class)
/**
 * A type of {@link Timeseries} where each element in the series is an {@link FkSpectrum}. Each
 * FkSpectrum in a FkSpectra is computed with the same parameters outlined in {@link Metadata}.
 */
public abstract class FkSpectra extends Timeseries {

  /** An {@link Collection} of Fk Spectrum generated for the spectra */
  public abstract Collection<FkSpectrum> getSamples();

  /**
   * Obtain the Optional of {@link Metadata} associated with the FkSpectra. This metadata is
   * associated with each {@link FkSpectrum} of this FkSpectra.
   *
   * @return The metadata for this FkSpectra
   */
  public abstract Optional<Metadata> getFkSpectraMetadata();

  public static Builder builder() {
    return new AutoValue_FkSpectra.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    abstract Builder setType(Type value);

    public abstract Builder setStartTime(Instant value);

    public abstract Builder setSampleRateHz(double value);

    public abstract Builder setSampleCount(int value);

    abstract int getSampleCount();

    public abstract Builder setSamples(Collection<FkSpectrum> values);

    abstract Collection<FkSpectrum> getSamples();

    public Builder withSamples(Collection<FkSpectrum> values) {
      return setSamples(values).setSampleCount(values.size());
    }

    public abstract Builder setFkSpectraMetadata(@Nullable Metadata value);

    abstract FkSpectra autobuild();

    public FkSpectra build() {

      setType(Type.FK_SPECTRA).setSamples(ImmutableList.copyOf(getSamples()));
      validateFkSpectra();
      return autobuild();
    }

    private void validateFkSpectra() {

      Validate.notEmpty(getSamples(), "Collection of FkSpectrum must not be empty");

      var sampleErrorString =
          String.format(
              "The number of FkSpectrum objects found in the FkSpectra"
                  + " does not match the Sample Count specified in the Channel Segment object "
                  + "(expected %d, found %d).",
              getSampleCount(), getSamples().size());
      Preconditions.checkArgument(getSampleCount() == getSamples().size(), sampleErrorString);

      Preconditions.checkArgument(
          getSamples().stream()
                  .map(FkSpectrum::power)
                  .mapToInt(Immutable2dDoubleArray::columnCount)
                  .distinct()
                  .count()
              <= 1,
          "Power array must contain the same number of columns in each fk spectrum");

      Preconditions.checkArgument(
          getSamples().stream()
                  .map(FkSpectrum::power)
                  .mapToInt(Immutable2dDoubleArray::rowCount)
                  .distinct()
                  .count()
              <= 1,
          "Power array must contain the same number of rows in each fk spectrum");
    }
  }

  public record Metadata(
      FkWindow fkSpectrumWindow, SlownessGrid slownessGrid, PhaseType phaseType) {}
}
