package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Properties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class LocOo3dRSTTSettingsTest {
  public static final LocOo3dRSTTSettings locOo3dRSTTSettings =
      new LocOo3dRSTTSettings(
          "RSTT model", 0, 0, 0, 1.0, 2.0, "az file", RSTTTTUncertaintyType.DISTANCE_DEPENDENT);

  @Test
  void testSerialization() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(locOo3dRSTTSettings, LocOo3dRSTTSettings.class);
  }

  @Test
  void testPropertiesPopulation() {
    Properties properties = new Properties();
    locOo3dRSTTSettings.setProperties(properties);
    Assertions.assertEquals(7, properties.size());
  }
}
