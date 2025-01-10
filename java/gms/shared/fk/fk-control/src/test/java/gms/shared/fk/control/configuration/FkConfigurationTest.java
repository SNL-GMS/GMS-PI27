package gms.shared.fk.control.configuration;

import static gms.shared.fk.testfixtures.FkTestFixtures.DEFINITION;
import static gms.shared.fk.testfixtures.FkTestFixtures.REQUEST;
import static gms.shared.fk.testfixtures.FkTestFixtures.WF_SAMPLE_RATE;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FkConfigurationTest {

  @Mock private ConfigurationConsumerUtility configurationConsumerUtility;

  private FkConfiguration configuration;

  @BeforeEach
  void setup() {
    configuration = FkConfiguration.create(configurationConsumerUtility);
  }

  @Test
  void testCreateValidation() {
    Exception ex = assertThrows(NullPointerException.class, () -> FkConfiguration.create(null));
    assertEquals(
        "FkConfiguration cannot be created with null ConfigurationConsumerUtility",
        ex.getMessage());
  }

  @Test
  void testCreate() {
    FkConfiguration configuration =
        assertDoesNotThrow(() -> FkConfiguration.create(configurationConsumerUtility));
    assertNotNull(configuration);
  }

  @Test
  void testCreateFkSpectraParametersValidation() {
    Exception ex =
        assertThrows(
            NullPointerException.class, () -> configuration.createFkSpectraParameters(null, 0));
    assertEquals("Cannot create FkSpectraParameters from null FkStreamingRequest", ex.getMessage());
  }

  @Test
  void testCreateFkSpectraParameters() {
    when(configurationConsumerUtility.resolve(
            "fk-control.fk-spectra-definitions", List.of(), FkSpectraDefinition.class))
        .thenReturn(DEFINITION);
    FkSpectraParameters parameters =
        configuration.createFkSpectraParameters(REQUEST, WF_SAMPLE_RATE);
    assertEquals("caponFkSpectraPlugin", parameters.getPluginName());
    assertEquals(REQUEST.getChannels().size(), parameters.getChannels().size());
    assertTrue(parameters.getChannels().containsAll(REQUEST.getChannels()));
    assertEquals(DEFINITION, parameters.getDefinition());
  }

  @Test
  void testCreateFkAttributesParametersValidation() {
    Exception ex =
        assertThrows(
            NullPointerException.class, () -> FkConfiguration.createFkAttributesParameters(null));
    assertEquals(
        "Cannot create FkAttributesParameters from null FkSpectraDefinition", ex.getMessage());
  }

  @Test
  void testCreateFkAttributesParameters() {
    List<FkAttributesParameters> parametersList =
        FkConfiguration.createFkAttributesParameters(DEFINITION);
    assertEquals(1, parametersList.size());

    FkAttributesParameters parameters = parametersList.get(0);
    assertEquals("maxPowerFkAttributesPlugin", parameters.getPluginName());

    Map<String, Object> pluginParameters = parameters.getPluginParameters();
    assertEquals(DEFINITION.getLowFrequencyHz(), pluginParameters.get("lowFrequency"));
    assertEquals(DEFINITION.getHighFrequencyHz(), pluginParameters.get("highFrequency"));
    assertEquals(DEFINITION.getSlowStartXSecPerKm(), pluginParameters.get("eastSlowStart"));
    assertEquals(DEFINITION.getSlowDeltaXSecPerKm(), pluginParameters.get("eastSlowDelta"));
    assertEquals(DEFINITION.getSlowStartYSecPerKm(), pluginParameters.get("northSlowStart"));
    assertEquals(DEFINITION.getSlowDeltaYSecPerKm(), pluginParameters.get("northSlowDelta"));
  }
}
