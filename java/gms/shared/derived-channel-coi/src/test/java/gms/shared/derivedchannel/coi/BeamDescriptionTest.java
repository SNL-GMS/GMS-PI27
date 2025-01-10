package gms.shared.derivedchannel.coi;

import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class BeamDescriptionTest {

  @Test
  void testBuilderSerialization() {
    var beamDescription = BeamTestFixtures.getDefaultBeamDescription();

    JsonTestUtilities.assertSerializes(beamDescription, BeamDescription.class);
  }

  @Test
  void testNoPreFilterDefiniton() {
    var beamDescription =
        BeamTestFixtures.getDefaultBeamDescription().toBuilder().noPreFilterDefinition().build();

    assertEquals(Optional.empty(), beamDescription.getPreFilterDefinition());
  }
}
