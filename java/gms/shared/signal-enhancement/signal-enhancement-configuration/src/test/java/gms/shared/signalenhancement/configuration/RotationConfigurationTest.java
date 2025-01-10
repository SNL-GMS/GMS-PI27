package gms.shared.signalenhancement.configuration;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.signalenhancement.configuration.utils.TestCcuUtils;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class RotationConfigurationTest {

  private RotationConfiguration rotationConfiguration;

  @BeforeAll
  void init() {

    var configurationConsumerUtility =
        TestCcuUtils.getTestCcu(
            "configuration-base", Thread.currentThread().getContextClassLoader());

    rotationConfiguration = getRotationConfig(configurationConsumerUtility);
  }

  private static RotationConfiguration getRotationConfig(ConfigurationConsumerUtility ccu) {
    var rc = new RotationConfiguration(ccu);
    rc.rotationTemplateConfig = "signal-enhancement.rotation-template-config";

    return rc;
  }

  @ParameterizedTest
  @MethodSource("validRotationTemplateConfigSource")
  void testValidRotationTemplatesFromConfig(Station station, PhaseType phase) {
    Assertions.assertDoesNotThrow(() -> rotationConfiguration.getRotationTemplate(station, phase));
  }

  private static Stream<Arguments> validRotationTemplateConfigSource() {
    var matchStation = Station.createEntityReference("ASAR");
    var missStation = Station.createEntityReference("MISS");
    var nonEntityRefStation = Station.createVersionReference(matchStation);
    return Stream.of(
        Arguments.arguments(matchStation, PhaseType.S),
        Arguments.arguments(missStation, PhaseType.S),
        Arguments.arguments(matchStation, PhaseType.UNSET),
        Arguments.arguments(missStation, PhaseType.UNSET),
        Arguments.arguments(nonEntityRefStation, PhaseType.S));
  }
}
