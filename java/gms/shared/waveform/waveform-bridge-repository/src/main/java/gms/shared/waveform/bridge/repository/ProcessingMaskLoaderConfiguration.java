package gms.shared.waveform.bridge.repository;

import static java.util.Locale.ENGLISH;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.accessor.DefaultStationDefinitionAccessor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.annotation.RequestScope;

/**
 * Configuration service for returning the correct type of {@link ProcessingMaskLoader} depending on
 * the set environment variable or the default value in SystemConfig
 */
@Configuration
public class ProcessingMaskLoaderConfiguration {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(ProcessingMaskLoaderConfiguration.class);
  private static final String FLAG = "USE_CANNED_DATA";

  /**
   * Returns a canned {@link ProcessingMaskLoader} if the USE_CANNED_DATA environment variable is
   * set to TRUE during deployment and a bridged {@link ProcessingMaskLoader} if it set to FALSE.
   *
   * <p>If the USE_CANNED_DATA variable is not set during deployment, the default value in
   * SystemConfig is used instead.
   *
   * @param systemConfig the GMS system configuration
   * @param accessor the {@link DefaultStationDefinitionAccessor}, used for bridged data
   * @param repository the {@link BridgedProcessingMaskRepository}, used for bridged data
   * @return the proper type of {@link ProcessingMaskLoader}
   */
  @Bean
  @RequestScope
  public ProcessingMaskLoader processingMaskLoader(
      SystemConfig systemConfig,
      DefaultStationDefinitionAccessor accessor,
      BridgedProcessingMaskRepository repository) {

    var useCannedData =
        systemConfig.getValueAsBoolean("bridgedWaveformRespository.useCannedProcessingMasks");

    var flagValue = System.getenv(FLAG);
    if (flagValue != null) {
      useCannedData =
          switch (flagValue.toLowerCase(ENGLISH)) {
            case "true" -> true;
            case "false" -> false;
            default -> {
              LOGGER.error("Expected 'true' or 'false' for {}, got: {}", FLAG, flagValue);
              yield useCannedData;
            }
          };
    }

    if (useCannedData) {
      return new CannedProcessingMaskLoader();
    } else {
      return new BridgedProcessingMaskLoader(accessor, repository);
    }
  }
}
