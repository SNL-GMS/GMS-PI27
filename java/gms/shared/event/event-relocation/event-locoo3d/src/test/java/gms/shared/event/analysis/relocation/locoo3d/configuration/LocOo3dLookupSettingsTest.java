package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Properties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class LocOo3dLookupSettingsTest {
  public static final LocOo3d2dLookupSettings locOo3d2dLookupSettings =
      new LocOo3d2dLookupSettings(
          "2d Model", "some other file", 0, true, true, 1.0, 2.0, 3.0, 4.0, "some file");

  @Test
  void testSerialization() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(locOo3d2dLookupSettings, LocOo3d2dLookupSettings.class);
  }

  @Test
  void testPropertiesPopulation() {
    Properties properties = new Properties();
    locOo3d2dLookupSettings.setProperties(properties);
    Assertions.assertEquals(9, properties.size());
  }
}
