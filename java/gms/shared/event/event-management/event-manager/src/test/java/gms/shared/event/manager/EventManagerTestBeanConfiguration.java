package gms.shared.event.manager;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.io.File;
import java.time.temporal.ChronoUnit;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

@TestConfiguration
@ComponentScan(basePackages = {"gms.shared.spring.utilities.webmvc"})
class EventManagerTestBeanConfiguration {

  @Bean
  ConfigurationConsumerUtility configurationConsumerUtility() {
    var configurationRoot =
        checkNotNull(
                Thread.currentThread()
                    .getContextClassLoader()
                    .getResource("EventManagerTest-configuration-base"))
            .getPath();

    return ConfigurationConsumerUtility.builder(
            FileConfigurationRepository.create(new File(configurationRoot).toPath()))
        .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
        .build();
  }
}
