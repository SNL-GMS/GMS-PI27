package gms.shared.frameworks.osd.api.stationreference.util;

import gms.shared.frameworks.osd.coi.util.TestUtilities;
import java.io.IOException;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ReferenceSiteMembershipTest {
  @Test
  void testSerialization() throws IOException {
    TestUtilities.testSerialization(
        ReferenceSiteMembershipRequest.create(
            UUID.fromString("10000000-100-0000-1000-100000000040"), "Test Station"),
        ReferenceSiteMembershipRequest.class);
  }
}
