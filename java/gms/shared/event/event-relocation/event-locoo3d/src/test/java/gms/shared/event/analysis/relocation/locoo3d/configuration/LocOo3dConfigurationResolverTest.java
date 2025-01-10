package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.google.common.base.Preconditions;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.io.File;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@TestInstance(Lifecycle.PER_CLASS)
class LocOo3dConfigurationResolverTest {
  private ConfigurationConsumerUtility configurationConsumerUtility;
  private LocOo3dConfigurationResolver resolver;

  @BeforeAll
  void init() {
    var configurationRoot =
        Preconditions.checkNotNull(
                Thread.currentThread().getContextClassLoader().getResource("configuration"))
            .getPath();
    configurationConsumerUtility =
        ConfigurationConsumerUtility.builder(
                FileConfigurationRepository.create(new File(configurationRoot).toPath()))
            .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
            .build();
  }

  @BeforeEach
  void setUp() {
    resolver =
        new LocOo3dConfigurationResolver(
            configurationConsumerUtility, "event-relocation-service.locoo_3d_settings_for_loco_3d");
  }

  @Test
  void testResolveLocOo3dSettings() {
    var loco3dSettings = resolver.getLocOo3dSettings();
    Assertions.assertNotNull(loco3dSettings);
  }
}
