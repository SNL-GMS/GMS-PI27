package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Properties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class LocOo3dBenderSettingsTest {
  public static final LocOo3dBenderSettings locOo3dBenderSettings =
      new LocOo3dBenderSettings(
          "Bender model",
          true,
          true,
          1.0,
          2.0,
          "az file",
          BenderTTUncertaintyType.DISTANCE_DEPENDENT);

  @Test
  void testSerialization() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(locOo3dBenderSettings, LocOo3dBenderSettings.class);
  }

  @Test
  void testPropertiesPopulation() {
    Properties properties = new Properties();
    locOo3dBenderSettings.setProperties(properties);
    Assertions.assertEquals(6, properties.size());
  }
}
