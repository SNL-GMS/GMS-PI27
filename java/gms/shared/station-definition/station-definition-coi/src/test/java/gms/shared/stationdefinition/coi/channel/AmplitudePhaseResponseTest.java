package gms.shared.stationdefinition.coi.channel;

import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class AmplitudePhaseResponseTest {

  @Test
  void testSerialization() throws Exception {
    JsonTestUtilities.assertSerializes(
        UtilsTestFixtures.amplitudePhaseResponse, AmplitudePhaseResponse.class);
  }
}
