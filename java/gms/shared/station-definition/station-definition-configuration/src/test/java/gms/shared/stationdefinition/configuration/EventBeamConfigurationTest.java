package gms.shared.stationdefinition.configuration;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.io.File;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class EventBeamConfigurationTest {

  private ConfigurationConsumerUtility configurationConsumerUtility;
  EventBeamConfiguration eventBeamConfiguration;

  @BeforeAll
  void init() {
    var configurationRoot =
        checkNotNull(
                Thread.currentThread().getContextClassLoader().getResource("configuration-base"))
            .getPath();

    configurationConsumerUtility =
        ConfigurationConsumerUtility.builder(
                FileConfigurationRepository.create(new File(configurationRoot).toPath()))
            .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
            .build();
  }

  @BeforeEach
  void setUp() {
    eventBeamConfiguration = new EventBeamConfiguration(configurationConsumerUtility);

    eventBeamConfiguration.beamPhaseConfig =
        "station-definition-manager" + ".event-beam-configuration";
  }

  @Test
  void testResolvePhaseTypesByBeamDescriptions() {
    Map<String, PhaseType> inputMap = new HashMap<>();
    inputMap.put("szb", PhaseType.P);
    inputMap.put("Pgb", PhaseType.Pg);
    inputMap.put("Pnb", PhaseType.Pn);
    inputMap.put("MTB", PhaseType.LQ);
    inputMap.put("MZB", PhaseType.LR);
    inputMap.put("lzb", PhaseType.LR);
    inputMap.put("ltb", PhaseType.LQ);

    PhaseTypesByBeamDescriptions expectedPhaseTypesByBeamDescriptions =
        PhaseTypesByBeamDescriptions.from(inputMap);

    PhaseTypesByBeamDescriptions actualPhaseTypesByBeamDescriptions =
        eventBeamConfiguration.getPhaseTypesByBeamDescriptions();

    Assertions.assertEquals(
        expectedPhaseTypesByBeamDescriptions, actualPhaseTypesByBeamDescriptions);
  }
}
