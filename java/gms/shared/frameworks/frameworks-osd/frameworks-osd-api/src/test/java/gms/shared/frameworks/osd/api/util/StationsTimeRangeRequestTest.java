package gms.shared.frameworks.osd.api.util;

import gms.shared.utilities.test.JsonTestUtilities;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class StationsTimeRangeRequestTest {

  @Test
  void testSerialization() throws IOException {
    StationsTimeRangeRequest request =
        StationsTimeRangeRequest.create(
            List.of("test1", "test2"), Instant.EPOCH, Instant.EPOCH.plusSeconds(5));
    JsonTestUtilities.assertSerializes(request, StationsTimeRangeRequest.class);
  }
}
