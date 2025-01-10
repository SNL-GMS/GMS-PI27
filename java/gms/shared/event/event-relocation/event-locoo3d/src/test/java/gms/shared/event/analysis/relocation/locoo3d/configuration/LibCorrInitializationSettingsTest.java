package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Properties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class LibCorrInitializationSettingsTest {

  public static final LibCorrInitializationSettings libCorrInitializationSettings =
      new LibCorrInitializationSettings(
          "corrections root",
          "corrections relative path",
          true,
          0,
          LibCorrInterpolatorType.LINEAR,
          0,
          true);

  @Test
  void testSerialization() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(
        libCorrInitializationSettings, LibCorrInitializationSettings.class);
  }

  @Test
  void testPropertiesPopulation() {
    Properties properties = new Properties();
    libCorrInitializationSettings.setProperties("prefix", properties);
    Assertions.assertEquals(7, properties.size());
  }
}
