package gms.shared.signalenhancement.api.webclient.config;

import gms.shared.frameworks.systemconfig.SystemConfig;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import reactor.util.retry.Retry;
import reactor.util.retry.RetryBackoffSpec;

/** Configuration for a {@link SignalEnhancementConfigurationClient} */
@Configuration
@ComponentScan(basePackages = "gms.shared.spring")
public class SignalEnhancementConfigurationClientConfig {

  private static final String MAX_ATTEMPTS_KEY = "sec-client-max-retry-attempts";
  private static final String MIN_BACKOFF_KEY = "sec-client-min-backoff-duration";

  @Value("${signalEnhancementConfiguration.hostname}")
  private String signalEnhancementConfigHostname;

  @Value("${signalEnhancementConfiguration.port}")
  private long signalEnhancementConfigPort;

  @Value("${signalEnhancementConfiguration.contextPath}")
  private String signalEnhancementConfigContextPath;

  @Value("${signalEnhancementConfiguration.urlPaths.filterDefsByUsageForSDHs}")
  private String filterDefsByUsageForSDHsUrlPath;

  private RetryBackoffSpec retrySpec;

  @Autowired
  public SignalEnhancementConfigurationClientConfig(SystemConfig systemConfig) {
    this.retrySpec =
        Retry.backoff(
                systemConfig.getValueAsLong(MAX_ATTEMPTS_KEY),
                systemConfig.getValueAsDuration(MIN_BACKOFF_KEY))
            .transientErrors(true);
  }

  /**
   * Returns the URI for the {@link SignalDetectionHypothesis} endpoint
   *
   * @return the URI
   */
  public URI filterDefsByUsageForSDHsUrl() {
    var filterDefsByUsageForSdhUrlString =
        String.format(
            "http://%s:%d/%s%s%s",
            signalEnhancementConfigHostname,
            signalEnhancementConfigPort,
            signalEnhancementConfigHostname,
            signalEnhancementConfigContextPath,
            filterDefsByUsageForSDHsUrlPath);

    try {
      return new URL(filterDefsByUsageForSdhUrlString).toURI();
    } catch (MalformedURLException | URISyntaxException e) {
      throw new IllegalStateException(
          String.format("Configured URL %s is malformed", filterDefsByUsageForSdhUrlString), e);
    }
  }

  /**
   * Returns the retry backoff spec for this client
   *
   * @return the RetryBackoffSpec
   */
  public RetryBackoffSpec retrySpec() {
    return this.retrySpec;
  }
}
