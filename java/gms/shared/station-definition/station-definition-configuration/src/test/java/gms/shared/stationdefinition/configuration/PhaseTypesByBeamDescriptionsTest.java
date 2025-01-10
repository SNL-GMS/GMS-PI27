package gms.shared.stationdefinition.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class PhaseTypesByBeamDescriptionsTest {

  @Test
  void testSerialization() throws JsonProcessingException {
    Map<String, PhaseType> inputMap = new HashMap<>();
    inputMap.put("pKp", PhaseType.IPx);
    inputMap.put("PaPo", PhaseType.Iw);
    inputMap.put("hPs", PhaseType.IPx);

    PhaseTypesByBeamDescriptions expectedPhaseTypesByBeamDescriptions =
        PhaseTypesByBeamDescriptions.from(inputMap);
    JsonTestUtilities.assertSerializes(
        expectedPhaseTypesByBeamDescriptions, PhaseTypesByBeamDescriptions.class);
  }
}
