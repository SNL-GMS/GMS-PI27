package gms.shared.derivedchannel.coi;

import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class BeamDefinitionTest extends BeamErrorTest {

  @Test
  void testSerialization() {
    BeamDefinition.Builder builder = BeamDefinition.builder();
    var beamDescription = BeamTestFixtures.getDefaultBeamDescription();
    var beamParameters = BeamTestFixtures.getDefaultBeamParametersBuilder();
    builder.setBeamDescription(beamDescription);
    builder.setBeamParameters(beamParameters.build());

    JsonTestUtilities.assertSerializes(builder.build(), BeamDefinition.class);
  }

  @Test
  void testEmptyEventHypothesis() {
    BeamDefinition.Builder builder = BeamDefinition.builder();
    var beamDescription = BeamTestFixtures.getDefaultBeamDescription();
    var beamParametersBuilder = BeamTestFixtures.getDefaultBeamParametersBuilder();
    beamDescription = beamDescription.toBuilder().setBeamType(BeamType.EVENT).build();
    var beamParameters = beamParametersBuilder.noEventHypothesis().build();

    builder.setBeamDescription(beamDescription);
    builder.setBeamParameters(beamParameters);

    assertErrorThrown(
        IllegalArgumentException.class,
        BeamDefinition.EMPTY_EVENT_HYPOTHESIS,
        () -> builder.build());
  }

  @Test
  void testEmptySignalDetectionHypothesis() {
    BeamDefinition.Builder builder = BeamDefinition.builder();
    var beamDescription = BeamTestFixtures.getDefaultBeamDescription();
    var beamParametersBuilder = BeamTestFixtures.getDefaultBeamParametersBuilder();
    beamDescription = beamDescription.toBuilder().setBeamType(BeamType.FK).build();
    var beamParameters = beamParametersBuilder.noSignalDetectionHypothesis().build();

    builder.setBeamDescription(beamDescription);
    builder.setBeamParameters(beamParameters);

    assertErrorThrown(
        IllegalArgumentException.class,
        BeamDefinition.EMPTY_SIGNAL_DETECTION_HYPOTHESIS,
        () -> builder.build());
  }

  @Test
  void testEmptyLocation() {
    BeamDefinition.Builder builder = BeamDefinition.builder();
    var beamDescription = BeamTestFixtures.getDefaultBeamDescription();
    var beamParametersBuilder = BeamTestFixtures.getDefaultBeamParametersBuilder();
    beamDescription = beamDescription.toBuilder().setBeamType(BeamType.CONTINUOUS_LOCATION).build();
    var beamParameters = beamParametersBuilder.noLocation().build();

    builder.setBeamDescription(beamDescription);
    builder.setBeamParameters(beamParameters);

    assertErrorThrown(
        IllegalArgumentException.class, BeamDefinition.EMPTY_LOCATION, () -> builder.build());
  }
}
