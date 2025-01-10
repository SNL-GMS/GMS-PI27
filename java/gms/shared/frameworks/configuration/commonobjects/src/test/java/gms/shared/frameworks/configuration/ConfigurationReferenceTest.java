package gms.shared.frameworks.configuration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.utilities.test.JsonTestUtilities;
import java.util.List;
import org.junit.jupiter.api.Test;

class ConfigurationReferenceTest {

  @Test
  void testIsConfigurationReferenceKey() {
    assertTrue(
        ConfigurationReference.isConfigurationReferenceKey(
            ConfigurationReference.REF_COMMAND + "global"));
    assertFalse(
        ConfigurationReference.isConfigurationReferenceKey(
            "global" + ConfigurationReference.REF_COMMAND));
  }

  @Test
  void testSerialization() {
    ConfigurationReference gt =
        ConfigurationReference.from("global", List.of(Selector.from("criterion", "value")));
    JsonTestUtilities.assertSerializes(gt, ConfigurationReference.class);
  }
}
