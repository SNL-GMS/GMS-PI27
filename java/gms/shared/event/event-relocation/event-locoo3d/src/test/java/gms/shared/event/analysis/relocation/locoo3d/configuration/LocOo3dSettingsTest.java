package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Map;
import java.util.Properties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class LocOo3dSettingsTest {
  public static final LocOo3d2dLookupSettings locOo3d2dLookupSettings =
      new LocOo3d2dLookupSettings(
          "2d Model", "some other file", 0, true, true, 1.0, 2.0, 3.0, 4.0, "some file");
  public static final LocOo3dRSTTSettings locOo3dRSTTSettings =
      new LocOo3dRSTTSettings(
          "RSTT model", 0, 0, 0, 1.0, 2.0, "az file", RSTTTTUncertaintyType.DISTANCE_DEPENDENT);
  public static final LocOo3dBenderSettings locOo3dBenderSettings =
      new LocOo3dBenderSettings(
          "Bender model",
          true,
          true,
          1.0,
          2.0,
          "az file",
          BenderTTUncertaintyType.DISTANCE_DEPENDENT);
  public static final LibCorrInitializationSettings libCorrInitializationSettings =
      new LibCorrInitializationSettings(
          "corrections root",
          "corrections relative path",
          true,
          0,
          LibCorrInterpolatorType.LINEAR,
          0,
          true);
  public static final Map<String, LibCorrInitializationSettings> predictorToLibCorrSettings =
      Map.of("predictor 1", libCorrInitializationSettings);
  public static final LocOo3dSettings locOo3dSettings =
      new LocOo3dSettings(
          locOo3d2dLookupSettings,
          locOo3dRSTTSettings,
          locOo3dBenderSettings,
          predictorToLibCorrSettings,
          true,
          true,
          true,
          true,
          true,
          true);

  @Test
  void testSerialization() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(locOo3dSettings, LocOo3dSettings.class);
  }

  @Test
  void testPropertiesPopulation() {
    Properties properties = new Properties();
    locOo3dSettings.setProperties(properties);
    Assertions.assertEquals(35, properties.size());
  }
}
