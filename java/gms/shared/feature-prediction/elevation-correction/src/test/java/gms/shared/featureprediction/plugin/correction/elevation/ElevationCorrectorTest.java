package gms.shared.featureprediction.plugin.correction.elevation;

import static org.mockito.ArgumentMatchers.any;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.featureprediction.plugin.api.correction.elevation.mediumvelocity.MediumVelocityEarthModelPlugin;
import gms.shared.signaldetection.coi.values.DurationValue;
import gms.shared.stationdefinition.coi.channel.Location;
import java.time.Duration;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ElevationCorrectorTest {

  private static final String PLUGIN_NAME = "MyBeautifulPlugin";

  private static final String MODEL_NAME = "Ak135";

  @Mock private ElevationCorrectorConfiguration mockElevationCorrectorConfiguration;

  private ElevationCorrector elevationCorrector;

  @Mock private ElevationCorrectorDefinition mockElevationCorrectorDefinition;

  @Mock private MediumVelocityEarthModelPlugin mockMediumVelocityEarthModelPlugin;

  @BeforeEach()
  void initialize() {
    var modelPluginMap = Map.of(PLUGIN_NAME, mockMediumVelocityEarthModelPlugin);

    elevationCorrector =
        new ElevationCorrector(mockElevationCorrectorConfiguration, modelPluginMap);
  }

  @Test
  void testCorrect() {

    Mockito.when(mockElevationCorrectorDefinition.getPluginNameForEarthModel(MODEL_NAME))
        .thenReturn(PLUGIN_NAME);

    Mockito.when(mockElevationCorrectorConfiguration.getCurrentElevationCorrectorDefinition())
        .thenReturn(mockElevationCorrectorDefinition);

    Mockito.when(mockMediumVelocityEarthModelPlugin.getValue(any(), any())).thenReturn(4.0);

    var result =
        elevationCorrector
            .correct(MODEL_NAME, Location.from(0.0, 0.0, 0.0, 1.0), 0.0, PhaseType.P)
            .orElse(null);

    Assertions.assertEquals(
        FeaturePredictionComponent.from(
            DurationValue.from(Duration.ofMillis(250), null),
            false,
            FeaturePredictionComponentType.ELEVATION_CORRECTION),
        result);
  }

  @Test
  void testInvalidPhaseReturnsEmpty() {

    var result =
        elevationCorrector.correct(
            MODEL_NAME, Location.from(0.0, 0.0, 0.0, 1.0), 0.0, PhaseType.Lg);

    Assertions.assertTrue(result.isEmpty());
  }

  @Test
  void testPluginFromDefinitionNotFound() {
    Mockito.when(mockElevationCorrectorDefinition.getPluginNameForEarthModel(MODEL_NAME))
        .thenReturn("MyBeautifullInvalidPlugin");

    Mockito.when(mockElevationCorrectorConfiguration.getCurrentElevationCorrectorDefinition())
        .thenReturn(mockElevationCorrectorDefinition);

    var location = Location.from(0.0, 0.0, 0.0, 1.0);

    var result = elevationCorrector.correct(MODEL_NAME, location, 0.0, PhaseType.P);

    Assertions.assertTrue(result.isEmpty());
  }

  @Test
  void testNoPluginInDefinition() {
    Mockito.when(mockElevationCorrectorDefinition.getPluginNameForEarthModel(MODEL_NAME))
        .thenReturn(null);

    Mockito.when(mockElevationCorrectorConfiguration.getCurrentElevationCorrectorDefinition())
        .thenReturn(mockElevationCorrectorDefinition);

    var location = Location.from(0.0, 0.0, 0.0, 1.0);

    var result = elevationCorrector.correct(MODEL_NAME, location, 0.0, PhaseType.P);

    Assertions.assertTrue(result.isEmpty());
  }

  @Test
  void testInit() {
    Mockito.when(
            mockElevationCorrectorDefinition.getMediumVelocityEarthModelPluginNameByModelNameMap())
        .thenReturn(Map.of(MODEL_NAME, PLUGIN_NAME));

    Mockito.when(mockElevationCorrectorConfiguration.getCurrentElevationCorrectorDefinition())
        .thenReturn(mockElevationCorrectorDefinition);

    elevationCorrector.init();

    Mockito.verify(mockMediumVelocityEarthModelPlugin).initialize();
  }
}
