package gms.shared.stationdefinition.configuration;

import gms.shared.common.coi.types.SamplingType;
import gms.shared.derivedchannel.coi.BeamTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class BeamDefinitionConfigurationTest {
  @Test
  void testSerialization() {
    var beamDescription = BeamTestFixtures.getDefaultBeamDescription();
    var samplingType = SamplingType.NEAREST_SAMPLE;
    BeamDefinitionConfiguration beamDefinitionConfig =
        new BeamDefinitionConfiguration(1.0, 2, beamDescription, samplingType, false);

    JsonTestUtilities.assertSerializes(beamDefinitionConfig, BeamDefinitionConfiguration.class);
  }
}
