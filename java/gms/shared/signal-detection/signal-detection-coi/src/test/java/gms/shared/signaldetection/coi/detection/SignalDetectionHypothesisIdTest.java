package gms.shared.signaldetection.coi.detection;

import gms.shared.utilities.test.JsonTestUtilities;
import java.io.IOException;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SignalDetectionHypothesisIdTest {

  @Test
  void testSerialization() throws IOException {
    SignalDetectionHypothesisId id =
        SignalDetectionHypothesisId.from(
            UUID.fromString("10000000-100-0000-1000-100000000049"),
            UUID.fromString("10000000-100-0000-1000-100000000050"));
    JsonTestUtilities.assertSerializes(id, SignalDetectionHypothesisId.class);
  }
}
