package gms.shared.frameworks.control;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import gms.shared.frameworks.configuration.ConfigurationRepository;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ControlContextTest {
  private static final String CONTROL_NAME = "control-name";

  private static final Duration EXPIRATION = Duration.ofDays(1);

  @Test
  void testBuilderValidatesParameters() {
    assertEquals(
        "ControlContext.Builder requires non-null controlName",
        assertThrows(NullPointerException.class, () -> ControlContext.builder(null)).getMessage());
  }

  @Test
  void testBuilderOverrideConfigRepo() {
    final SystemConfig sysConfig = mock(SystemConfig.class);
    final ConfigurationRepository configRepo = mock(ConfigurationRepository.class);
    try (MockedStatic<SystemConfig> create = Mockito.mockStatic(SystemConfig.class)) {
      create.when(() -> SystemConfig.create(CONTROL_NAME)).thenReturn(sysConfig);
      mockSystemConfig(sysConfig);
      final ControlContext context =
          ControlContext.builder(CONTROL_NAME)
              .processingConfigurationRepository(configRepo)
              .build();
      checkContextContains(context, sysConfig, configRepo);
    }
  }

  @Test
  void testBuilderWithSystemConfigAndProcessingConfigRepo() {
    final SystemConfig sysConfig = mock(SystemConfig.class);
    final ConfigurationRepository configRepo = mock(ConfigurationRepository.class);
    mockSystemConfig(sysConfig);
    final ControlContext context =
        ControlContext.builder(CONTROL_NAME)
            .systemConfig(sysConfig)
            .processingConfigurationRepository(configRepo)
            .build();
    checkContextContains(context, sysConfig, configRepo);
  }

  private static void checkContextContains(
      ControlContext context, SystemConfig sysConfig, ConfigurationRepository configRepo) {
    assertNotNull(context);
    assertEquals(sysConfig, context.getSystemConfig());
    assertEquals(configRepo, context.getProcessingConfigurationRepository());
  }

  private void mockSystemConfig(SystemConfig mockConfig) {
    given(mockConfig.getValueAsDuration(any())).willReturn(EXPIRATION);
    given(mockConfig.getValueAsInt("processing-retry-initial-delay")).willReturn(1);
    given(mockConfig.getValueAsInt("processing-retry-max-delay")).willReturn(10);
    given(mockConfig.getValue("processing-retry-delay-units")).willReturn("SECONDS");
    given(mockConfig.getValueAsInt("processing-retry-max-attempts")).willReturn(1);
  }
}
