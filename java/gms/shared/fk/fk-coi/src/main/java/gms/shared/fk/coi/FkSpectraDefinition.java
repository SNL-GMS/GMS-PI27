package gms.shared.fk.coi;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.PhaseType;
import java.time.Duration;

/**
 * Describes parameters used to calculate {@link FkSpectrum}, but does not include input waveform
 * data. This allows this class to be used to describe general Fk Spectrum calculations, instead of
 * a calculation for a specific time interval. Describes the slowness grid independently for east
 * and north dimensions, channel positioning, and the amount of waveform data used to compute each
 * Fk Spectra.
 */
@AutoValue
@JsonSerialize(as = FkSpectraDefinition.class)
@JsonDeserialize(builder = AutoValue_FkSpectraDefinition.Builder.class)
public abstract class FkSpectraDefinition {

  /**
   * Obtain the sample rate of the FkSpectra as a double (Units: Hz)
   *
   * @return startTime, not null.
   */
  public abstract double getSampleRateHz();

  /**
   * Obtain {@link Duration} used to offset the window of waveform data used to compute each Fk
   * Spectrum
   *
   * @return windowLead, not null
   */
  public abstract Duration getWindowLead();

  /**
   * Obtain {@link Duration} of waveform data used to compute each Fk Spectra
   *
   * @return {@code windowLength, > 0, not null }
   */
  public abstract Duration getWindowLength();

  /**
   * Obtain the low pass-band frequency used to calculate Fk Spectra
   *
   * @return {@code lowFrequency, in Hz, >= 0}
   */
  public abstract double getLowFrequencyHz();

  /**
   * Obtain the high pass-band frequency used to calculate Fk Spectra
   *
   * @return {@code highFrequency, in Hz, > lowFrequency }
   */
  public abstract double getHighFrequencyHz();

  /**
   * Obtain whether to use channel vertical position when computing time delays
   *
   * @return useChannelVerticalOffsets
   */
  public abstract boolean isUseChannelVerticalOffsets();

  public abstract boolean isNormalizeWaveforms();

  public abstract PhaseType getPhaseType();

  /**
   * Obtain first east slowness value in each Fk Spectra
   *
   * @return eastSlowStart, in s/km
   */
  public abstract double getSlowStartXSecPerKm();

  /**
   * Obtain step between east slowness values in each Fk Spectra
   *
   * @return eastSlowDelta, in s/km
   */
  public abstract double getSlowDeltaXSecPerKm();

  /**
   * Obtain total number of east slowness values in each Fk Spectra
   *
   * @return eastSlowCount
   */
  public abstract int getSlowCountX();

  /**
   * Obtain first north slowness value in each Fk Spectra
   *
   * @return eastSlowEnd, in s/km
   */
  public abstract double getSlowStartYSecPerKm();

  /**
   * Obtain step between north slowness values in each Fk Spectra
   *
   * @return northSlowStart, in s/km
   */
  public abstract double getSlowDeltaYSecPerKm();

  /**
   * Obtain total number of north slowness values in each Fk Spectra
   *
   * @return northSlowCount
   */
  public abstract int getSlowCountY();

  /**
   * Obtain the nominal sample rate of the waveforms used to compute the Fk Spectra
   *
   * @return {@literal waveformSampleRateHz, > 0 }
   */
  public abstract double getWaveformSampleRateHz();

  /**
   * Obtain the allowed deviation from waveformSampleRateHz
   *
   * @return {@literal waveformSampleRateToleranceHz, >= 0 }
   */
  public abstract double getWaveformSampleRateToleranceHz();

  /**
   * Obtains the minimum number of waveforms needed to create an FkSpectra
   *
   * @return the minimum number of waveforms needed to create an FkSpectra, greater than 1
   */
  public abstract int getMinimumWaveformsForSpectra();

  public static Builder builder() {
    return new AutoValue_FkSpectraDefinition.Builder();
  }

  public abstract Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    public abstract Builder setSampleRateHz(double sampleRate);

    public abstract Builder setWindowLead(Duration windowLead);

    public abstract Builder setWindowLength(Duration windowLength);

    public abstract Builder setLowFrequencyHz(double lowFrequency);

    public abstract Builder setHighFrequencyHz(double highFrequency);

    public abstract Builder setUseChannelVerticalOffsets(boolean useChannelVerticalOffsets);

    public abstract Builder setNormalizeWaveforms(boolean normalizeWaveforms);

    public abstract Builder setPhaseType(PhaseType phaseType);

    public abstract Builder setSlowStartXSecPerKm(double slowStartX);

    public abstract Builder setSlowDeltaXSecPerKm(double slowDeltaX);

    public abstract Builder setSlowCountX(int slowCountX);

    public abstract Builder setSlowStartYSecPerKm(double slowStartY);

    public abstract Builder setSlowDeltaYSecPerKm(double slowDeltaY);

    public abstract Builder setSlowCountY(int slowCountY);

    public abstract Builder setWaveformSampleRateHz(double nominalWaveformSampleRateHz);

    public abstract Builder setWaveformSampleRateToleranceHz(
        double nominalWaveformSampleRateToleranceHz);

    public abstract Builder setMinimumWaveformsForSpectra(int minimumWaveformsForSpectra);

    protected abstract FkSpectraDefinition autobuild();

    public FkSpectraDefinition build() {
      FkSpectraDefinition definition = autobuild();

      Preconditions.checkState(
          definition.getWindowLength().compareTo(Duration.ZERO) > 0,
          "FkSpectraDefinition requires windowLength of Duration > 0");
      Preconditions.checkState(
          definition.getSampleRateHz() > 0.0, "FkSpectraDefinition requires sampleRate > 0.0");
      Preconditions.checkState(
          definition.getLowFrequencyHz() >= 0.0,
          "FkSpectraDefinition requires lowFrequency >= 0.0");
      Preconditions.checkState(
          definition.getHighFrequencyHz() > definition.getLowFrequencyHz(),
          "FkSpectraDefinition requires lowFrequency < highFrequency");
      Preconditions.checkState(
          definition.getSlowCountX() > 0, "FkSpectraDefinition requires slowCountX > 0");
      Preconditions.checkState(
          definition.getSlowCountY() > 0, "FkSpectraDefinition requires slowCountY > 0");
      Preconditions.checkState(
          definition.getWaveformSampleRateHz() > 0.0,
          "FkSpectraDefinition requires waveformSampleRateHz > 0.0");
      Preconditions.checkState(
          definition.getWaveformSampleRateToleranceHz() >= 0.0,
          "FkSpectraDefinition requires waveformSampleRateToleranceHz >= 0.0");
      Preconditions.checkState(
          definition.getMinimumWaveformsForSpectra() > 1,
          "FkSpectraDefinition requires minimumWaveformsForSpectra > 1");

      return definition;
    }
  }
}
