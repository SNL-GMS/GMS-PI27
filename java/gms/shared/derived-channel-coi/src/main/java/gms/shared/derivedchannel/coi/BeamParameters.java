package gms.shared.derivedchannel.coi;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.Orientation;
import java.util.Optional;
import javax.annotation.Nullable;
import org.apache.commons.lang3.Validate;

/** Beam parameters contains all attribute parameters for Beams */
@AutoValue
@JsonSerialize(as = AutoValue_BeamParameters.class)
@JsonDeserialize(builder = AutoValue_BeamParameters.Builder.class)
public abstract class BeamParameters {

  private static final double MAX_AZIMUTH_DEGREE_RANGE = 360.0;
  private static final double MAX_ORIENTATION_TOL_DEGREE_RANGE = 360.0;

  static final String BEAM_PARAM_MESSAGE = "BeamParameters cannot have a";

  static final String EMPTY_MIN_WAVEFORMS_TO_BEAM =
      BEAM_PARAM_MESSAGE + "n empty minWaveformsToBeam";

  static final String NEGATIVE_SAMPLE_RATE = BEAM_PARAM_MESSAGE + " negative sampleRateHz";

  static final String NEGATIVE_SAMPLE_RATE_TOLERANCE =
      BEAM_PARAM_MESSAGE + " negative sampleRateToleranceHz";

  static final String NEGATIVE_SLOWNESS = BEAM_PARAM_MESSAGE + " negative slownessSecPerDeg";

  static final String SOURCE_AZIMUTH_DEGREE_RANGE =
      BEAM_PARAM_MESSAGE + " receiverToSourceAzimuthDeg outside 0 to 360 degrees";

  static final String ORIENTATION_ANGLE_DEGREE_RANGE =
      BEAM_PARAM_MESSAGE + " orientationAngleToleranceDeg outside 0 to 360 degrees";

  public static BeamParameters.Builder builder() {
    return new AutoValue_BeamParameters.Builder();
  }

  public abstract BeamParameters.Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    BeamParameters.Builder setMinWaveformsToBeam(Integer minWaveformsToBeam);

    BeamParameters.Builder setOrientationAngles(Orientation orientation);

    BeamParameters.Builder setOrientationAngleToleranceDeg(Double angle);

    BeamParameters.Builder setSampleRateHz(Double sampleRateHz);

    BeamParameters.Builder setSampleRateToleranceHz(Double sampleRateToleranceHz);

    BeamParameters.Builder setSlownessSecPerDeg(Double slownessSecPerDeg);

    BeamParameters.Builder setReceiverToSourceAzimuthDeg(Double receiverToSourceAzimuthDeg);

    BeamParameters.Builder setEventHypothesis(@Nullable EventHypothesis eventHypothesis);

    default BeamParameters.Builder noEventHypothesis() {
      return this.setEventHypothesis(null);
    }

    BeamParameters.Builder setLocation(@Nullable Location location);

    default BeamParameters.Builder noLocation() {
      return this.setLocation(null);
    }

    BeamParameters.Builder setSignalDetectionHypothesis(
        @Nullable SignalDetectionHypothesis signalDetectionHypothesis);

    default BeamParameters.Builder noSignalDetectionHypothesis() {
      return this.setSignalDetectionHypothesis(null);
    }

    BeamParameters autoBuild();

    default BeamParameters build() {
      validateFields(autoBuild());

      return autoBuild();
    }
  }

  static void validateFields(BeamParameters beamParameters) {

    // check field values for parameters
    var minWaveformsToBeam = beamParameters.getMinWaveformsToBeam();
    var sampleRateHz = beamParameters.getSampleRateHz();
    var sampleRateToleranceHz = beamParameters.getSampleRateToleranceHz();
    var slownessSecPerDeg = beamParameters.getSlownessSecPerDeg();
    var receiverToSourceAzimuthDeg = beamParameters.getReceiverToSourceAzimuthDeg();
    var orientationAngleToleranceDeg = beamParameters.getOrientationAngleToleranceDeg();

    Validate.isTrue(minWaveformsToBeam > 0, EMPTY_MIN_WAVEFORMS_TO_BEAM);
    Validate.isTrue(sampleRateHz > 0.0, NEGATIVE_SAMPLE_RATE);
    Validate.isTrue(sampleRateToleranceHz >= 0.0, NEGATIVE_SAMPLE_RATE_TOLERANCE);
    Validate.isTrue(slownessSecPerDeg >= 0.0, NEGATIVE_SLOWNESS);
    Validate.isTrue(
        receiverToSourceAzimuthDeg >= 0.0 && receiverToSourceAzimuthDeg <= MAX_AZIMUTH_DEGREE_RANGE,
        SOURCE_AZIMUTH_DEGREE_RANGE);
    Validate.isTrue(
        orientationAngleToleranceDeg >= 0.0
            && orientationAngleToleranceDeg <= MAX_ORIENTATION_TOL_DEGREE_RANGE,
        ORIENTATION_ANGLE_DEGREE_RANGE);
  }

  public abstract Integer getMinWaveformsToBeam();

  public abstract Orientation getOrientationAngles();

  public abstract Double getOrientationAngleToleranceDeg();

  public abstract Double getSampleRateHz();

  public abstract Double getSampleRateToleranceHz();

  public abstract Double getSlownessSecPerDeg();

  public abstract Double getReceiverToSourceAzimuthDeg();

  public abstract Optional<EventHypothesis> getEventHypothesis();

  public abstract Optional<Location> getLocation();

  public abstract Optional<SignalDetectionHypothesis> getSignalDetectionHypothesis();
}
