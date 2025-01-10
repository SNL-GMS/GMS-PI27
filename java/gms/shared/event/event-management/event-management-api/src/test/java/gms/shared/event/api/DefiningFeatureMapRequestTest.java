package gms.shared.event.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class DefiningFeatureMapRequestTest {

  @Test
  void testSerialize() throws JsonProcessingException {
    var request =
        new DefiningFeatureMapRequest(
            ImmutableList.of(PhaseType.P),
            ImmutableList.of(UtilsTestFixtures.CHANNEL_VERSION_REAL_ASAR));

    JsonTestUtilities.assertSerializes(request, DefiningFeatureMapRequest.class);
  }
}
