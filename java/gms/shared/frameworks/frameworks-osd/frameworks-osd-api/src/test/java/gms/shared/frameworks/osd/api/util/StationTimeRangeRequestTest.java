package gms.shared.frameworks.osd.api.util;

import gms.shared.utilities.test.JsonTestUtilities;
import java.io.IOException;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class StationTimeRangeRequestTest {

  @Test
  void testSerialization() throws IOException {
    StationTimeRangeRequest request =
        StationTimeRangeRequest.create("test", Instant.EPOCH, Instant.EPOCH.plusSeconds(3));
    JsonTestUtilities.assertSerializes(request, StationTimeRangeRequest.class);
  }
}
