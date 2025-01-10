package gms.shared.derivedchannel.coi;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import com.google.common.collect.ImmutableList;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.station.Station;
import java.time.Duration;
import java.util.Optional;
import javax.annotation.Nullable;
import org.apache.commons.lang3.Validate;

/** Beamforming Template contains parameters describing beam attributes */
@AutoValue
@JsonSerialize(as = BeamformingTemplate.class)
@JsonDeserialize(builder = AutoValue_BeamformingTemplate.Builder.class)
public abstract class BeamformingTemplate {

  static final double MAX_ORIENTATION_TOLERANCE = 360.0;

  static final String EMPTY_CHANNNELS = "BeamformingTemplate cannot have empty channels";

  static final String EMPTY_BEAM_DURATION =
      "BeamformingTemplate cannot have "
          + "empty beamDuration when the BeamType is either EVENT or FK";

  static final String EMPTY_LEAD_DURATION =
      "BeamformingTemplate cannot have "
          + "empty leadDuration when the BeamType is either EVENT or FK";

  static final String NEGATIVE_BEAM_DURATION =
      "BeamformingTemplate cannot have negative beamDuration";

  static final String NEGATIVE_LEAD_DURATION =
      "BeamformingTemplate cannot have negative leadDuration";

  static final String EMPTY_MIN_WAVEFORMS_TO_BEAM =
      "BeamformingTemplate cannot have empty minWaveformsToBeam";

  static final String NEGATIVE_SAMPLE_RATE_TOLERANCE =
      "BeamformingTemplate cannot have negative sampleRateToleranceHz";

  static final String OUT_OF_RANGE_ORIENTATION_TOLERANCE =
      "BeamformingTemplate orientationAngleTolerance";

  public static BeamformingTemplate.Builder builder() {
    return new AutoValue_BeamformingTemplate.Builder();
  }

  public abstract BeamformingTemplate.Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    BeamformingTemplate autobuild();

    Builder setLeadDuration(@Nullable Duration leadDuration);

    default Builder noLeadDuration() {
      return setLeadDuration(null);
    }

    Builder setBeamDuration(@Nullable Duration beamDuration);

    default Builder noBeamDuration() {
      return setBeamDuration(null);
    }

    Builder setOrientationAngleToleranceDeg(double orientationAngleToleranceDeg);

    Builder setSampleRateToleranceHz(double sampleRateToleranceHz);

    Builder setMinWaveformsToBeam(int minWaveformsToBeam);

    Builder setBeamDescription(BeamDescription beamDescription);

    Builder setInputChannels(ImmutableList<Channel> channels);

    Builder setStation(Station station);

    default BeamformingTemplate build() {
      validateFields(autobuild());

      return autobuild();
    }
  }

  static void validateFields(BeamformingTemplate beamformingTemplate) {
    var channels = beamformingTemplate.getInputChannels();
    Validate.notEmpty(channels, EMPTY_CHANNNELS);

    var beamDescription = beamformingTemplate.getBeamDescription();

    var beamDuration = beamformingTemplate.getBeamDuration();
    var leadDuration = beamformingTemplate.getLeadDuration();

    if (beamDescription.getBeamType() == BeamType.EVENT
        || beamDescription.getBeamType() == BeamType.FK) {
      Validate.isTrue(beamDuration.isPresent(), EMPTY_BEAM_DURATION);
      Validate.isTrue(leadDuration.isPresent(), EMPTY_LEAD_DURATION);
    }

    if (beamDuration.isPresent()) {
      Validate.isTrue(beamDuration.get().getSeconds() >= 0.0, NEGATIVE_BEAM_DURATION);
    }

    if (leadDuration.isPresent()) {
      Validate.isTrue(leadDuration.get().getSeconds() >= 0.0, NEGATIVE_LEAD_DURATION);
    }

    var minWaveformsToBeam = beamformingTemplate.getMinWaveformsToBeam();
    Validate.isTrue(minWaveformsToBeam > 0, EMPTY_MIN_WAVEFORMS_TO_BEAM);

    var sampleRateToleranceHz = beamformingTemplate.getSampleRateToleranceHz();
    Validate.isTrue(sampleRateToleranceHz >= 0, NEGATIVE_SAMPLE_RATE_TOLERANCE);

    var orientationAngleToleranceDeg = beamformingTemplate.getOrientationAngleToleranceDeg();
    Validate.isTrue(
        orientationAngleToleranceDeg >= 0.0
            && orientationAngleToleranceDeg <= MAX_ORIENTATION_TOLERANCE,
        OUT_OF_RANGE_ORIENTATION_TOLERANCE);
  }

  public abstract Optional<Duration> getLeadDuration();

  public abstract double getOrientationAngleToleranceDeg();

  public abstract Optional<Duration> getBeamDuration();

  public abstract double getSampleRateToleranceHz();

  public abstract int getMinWaveformsToBeam();

  public abstract BeamDescription getBeamDescription();

  public abstract ImmutableList<Channel> getInputChannels();

  public abstract Station getStation();
}
