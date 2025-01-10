package gms.shared.signalenhancement.configuration.utils;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.io.File;
import java.time.temporal.ChronoUnit;

/** Utility class used in unit testing to test against real{@link ConfigurationConsumerUtility}s */
public class TestCcuUtils {

  private TestCcuUtils() {}

  /**
   * Resolves a {@link ConfigurationConsumerUtility} using file-based configuration loaded from a
   * given context and base directory.
   *
   * @param configBase Base directory for the utility to read configurations from
   * @param context Loader context to search for the base config directory in
   * @return A file-based consumer utility capable of resolving processing configuration
   */
  public static ConfigurationConsumerUtility getTestCcu(String configBase, ClassLoader context) {
    var configurationRoot = checkNotNull(context.getResource(configBase)).getPath();

    return ConfigurationConsumerUtility.builder(
            FileConfigurationRepository.create(new File(configurationRoot).toPath()))
        .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
        .build();
  }
}
