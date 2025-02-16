package gms.shared.frameworks.osd.coi.provenance;

import gms.shared.frameworks.osd.coi.util.TestUtilities;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class InformationSourceTest {

  @Test
  void testParameters() throws Exception {
    TestUtilities.checkStaticMethodValidatesNullArguments(
        InformationSource.class, "from", "abc", Instant.now(), "xyz");
  }

  @Test
  void testSerialization() throws Exception {
    TestUtilities.testSerialization(
        ProvenanceTestFixtures.informationSource, InformationSource.class);
  }
}
