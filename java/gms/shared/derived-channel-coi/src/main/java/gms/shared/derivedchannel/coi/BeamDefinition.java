package gms.shared.derivedchannel.coi;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.channel.BeamType;
import org.apache.commons.lang3.Validate;

/**
 * Beam definition represents the values describing general waveform beamforming attributes that do
 * not depend on beamforming for a specific source and receiver
 */
@AutoValue
@JsonSerialize(as = AutoValue_BeamDefinition.class)
@JsonDeserialize(builder = AutoValue_BeamDefinition.Builder.class)
public abstract class BeamDefinition {

  static final String BEAM_PARAM_MESSAGE = "BeamDefinition cannot have an ";

  static final String EMPTY_EVENT_HYPOTHESIS =
      BEAM_PARAM_MESSAGE
          + "empty BeamParameters eventHypothesis when the BeamType is either EVENT or FK";

  static final String EMPTY_SIGNAL_DETECTION_HYPOTHESIS =
      BEAM_PARAM_MESSAGE + "empty BeamParameters signalDetectionHypothesis when the BeamType is FK";

  static final String EMPTY_LOCATION =
      BEAM_PARAM_MESSAGE + "empty BeamParameters location when the BeamType is CONTINUOUS_LOCATION";

  public static BeamDefinition.Builder builder() {
    return new AutoValue_BeamDefinition.Builder();
  }

  public abstract BeamDefinition.Builder toBuilder();

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public interface Builder {

    BeamDefinition.Builder setBeamDescription(BeamDescription beamDescription);

    BeamDefinition.Builder setBeamParameters(BeamParameters beamParameters);

    BeamDefinition autoBuild();

    default BeamDefinition build() {
      validateFields(autoBuild());

      return autoBuild();
    }
  }

  static void validateFields(BeamDefinition beamDefinition) {

    // check the beam parameters based on beam type
    var beamType = beamDefinition.getBeamDescription().getBeamType();
    var beamParameters = beamDefinition.getBeamParameters();

    if (beamType == BeamType.EVENT || beamType == BeamType.FK) {
      Validate.isTrue(beamParameters.getEventHypothesis().isPresent(), EMPTY_EVENT_HYPOTHESIS);
      if (beamType == BeamType.FK) {
        Validate.isTrue(
            beamParameters.getSignalDetectionHypothesis().isPresent(),
            EMPTY_SIGNAL_DETECTION_HYPOTHESIS);
      }
    }

    if (beamType == BeamType.CONTINUOUS_LOCATION) {
      Validate.isTrue(beamParameters.getLocation().isPresent(), EMPTY_LOCATION);
    }
  }

  public abstract BeamDescription getBeamDescription();

  public abstract BeamParameters getBeamParameters();
}
