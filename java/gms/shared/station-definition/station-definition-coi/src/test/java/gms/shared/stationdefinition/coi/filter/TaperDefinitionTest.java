package gms.shared.stationdefinition.coi.filter;

import gms.shared.stationdefinition.coi.utils.TaperFunction;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class TaperDefinitionTest {

  @Test
  void testSerialization() {
    JsonTestUtilities.assertSerializes(
        new TaperDefinition(Duration.ofSeconds(5), TaperFunction.BLACKMAN), TaperDefinition.class);
  }
}
