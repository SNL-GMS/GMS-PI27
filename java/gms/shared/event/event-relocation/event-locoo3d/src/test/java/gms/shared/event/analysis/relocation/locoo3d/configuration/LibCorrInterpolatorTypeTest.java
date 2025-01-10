package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Properties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class LibCorrInterpolatorTypeTest {
  public static final LibCorrInterpolatorType interpolatorType = LibCorrInterpolatorType.LINEAR;

  @Test
  void testSerialization() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(interpolatorType, LibCorrInterpolatorType.class);
  }

  @Test
  void testPropertiesPopulation() {
    Properties properties = new Properties();
    interpolatorType.setProperties("prefix", properties);
    Assertions.assertEquals(1, properties.size());
  }
}
