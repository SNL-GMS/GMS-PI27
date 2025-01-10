package gms.shared.frameworks.configuration;

import com.fasterxml.jackson.core.type.TypeReference;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SelectorTest {

  private static final String CRITERION = "criterion";

  @Test
  void testSerializationString() throws Exception {
    JsonTestUtilities.assertSerializes(Selector.from(CRITERION, "geres"), new TypeReference<>() {});
  }

  @Test
  void testSerializationUUID() throws Exception {
    JsonTestUtilities.assertSerializes(
        Selector.from(CRITERION, UUID.fromString("10000000-100-0000-1000-100000000104")),
        new TypeReference<>() {});
  }

  @Test
  void testSerializationDoubleNumericRange() throws Exception {
    final double value = 1.2345;
    JsonTestUtilities.assertSerializes(Selector.from(CRITERION, value), new TypeReference<>() {});
  }
}
