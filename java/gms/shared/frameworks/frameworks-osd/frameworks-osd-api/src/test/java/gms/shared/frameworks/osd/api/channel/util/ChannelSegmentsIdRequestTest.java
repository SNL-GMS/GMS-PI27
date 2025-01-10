package gms.shared.frameworks.osd.api.channel.util;

import gms.shared.utilities.test.JsonTestUtilities;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ChannelSegmentsIdRequestTest {

  @Test
  void testSerialization() throws IOException {
    ChannelSegmentsIdRequest request =
        ChannelSegmentsIdRequest.create(
            List.of(
                UUID.fromString("10000000-100-0000-1000-100000000036"),
                UUID.fromString("10000000-100-0000-1000-100000000037")),
            true);
    JsonTestUtilities.assertSerializes(request, ChannelSegmentsIdRequest.class);
  }
}
