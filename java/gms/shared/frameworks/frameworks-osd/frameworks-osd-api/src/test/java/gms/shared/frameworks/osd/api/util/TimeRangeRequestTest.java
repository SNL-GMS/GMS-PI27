package gms.shared.frameworks.osd.api.util;

import gms.shared.utilities.test.JsonTestUtilities;
import java.io.IOException;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class TimeRangeRequestTest {

  @Test
  void testSerialization() throws IOException {
    TimeRangeRequest request = TimeRangeRequest.create(Instant.EPOCH, Instant.EPOCH.plusSeconds(3));
    JsonTestUtilities.assertSerializes(request, TimeRangeRequest.class);
  }
}
