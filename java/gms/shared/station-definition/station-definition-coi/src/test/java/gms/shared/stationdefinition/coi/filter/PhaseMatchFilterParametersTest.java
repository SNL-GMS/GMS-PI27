package gms.shared.stationdefinition.coi.filter;

import gms.shared.stationdefinition.testfixtures.FilterParametersTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class PhaseMatchFilterParametersTest {
  private static final PhaseMatchFilterParameters PARAMETERS =
      FilterParametersTestFixtures.getDefaultPhaseMatchFilterParameters();

  @Test
  void testSerialize() {
    JsonTestUtilities.assertSerializes(PARAMETERS, PhaseMatchFilterParameters.class);
  }
}
