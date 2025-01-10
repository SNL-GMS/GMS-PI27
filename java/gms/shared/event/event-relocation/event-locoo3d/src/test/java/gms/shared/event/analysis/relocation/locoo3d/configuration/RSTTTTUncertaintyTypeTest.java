package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Properties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class RSTTTTUncertaintyTypeTest {
  public static final RSTTTTUncertaintyType uncertaintyType =
      RSTTTTUncertaintyType.DISTANCE_DEPENDENT;

  @Test
  void testSerialization() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(uncertaintyType, RSTTTTUncertaintyType.class);
  }

  @Test
  void testPropertiesPopulation() {
    Properties properties = new Properties();
    uncertaintyType.setProperties(properties);
    Assertions.assertEquals(1, properties.size());
  }
}
