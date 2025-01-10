package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Properties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class PhaseInterfaceToModelInterfaceRemapTest {
  public static final PhaseInterfaceToModelInterfaceRemap interfaceRemap =
      new PhaseInterfaceToModelInterfaceRemap("Test1", "Test2");

  @Test
  void testSerialization() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(interfaceRemap, PhaseInterfaceToModelInterfaceRemap.class);
  }

  @Test
  void testPropertiesPopulation() {
    Properties properties = new Properties();
    interfaceRemap.setProperties(properties);
    Assertions.assertEquals(1, properties.size());
  }
}
