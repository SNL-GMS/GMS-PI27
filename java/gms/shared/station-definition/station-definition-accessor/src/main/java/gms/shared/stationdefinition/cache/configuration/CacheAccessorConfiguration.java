package gms.shared.stationdefinition.cache.configuration;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.cache.CacheAccessor;
import java.time.temporal.ChronoUnit;
import java.util.List;
import net.jodah.failsafe.RetryPolicy;
import org.hibernate.JDBCException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/** Configuration used for initializing {@link CacheAccessor} */
@Configuration
@ComponentScan(basePackages = {"gms.shared.spring"})
public class CacheAccessorConfiguration {

  private static final Logger LOGGER = LoggerFactory.getLogger(CacheAccessorConfiguration.class);

  static final String RETRY_INITIAL_DELAY = "retry-initial-delay";
  static final String RETRY_MAX_DELAY = "retry-max-delay";
  static final String RETRY_DELAY_UNITS = "retry-delay-units";
  static final String MAX_RETRY_ATTEMPTS = "retry-max-attempts";

  @Bean("cache-retryPolicy")
  @Autowired
  public RetryPolicy<Void> retryPolicy(SystemConfig systemConfig) {

    var delayUnit = ChronoUnit.valueOf(systemConfig.getValue(RETRY_DELAY_UNITS));
    var initialDelay = systemConfig.getValueAsLong(RETRY_INITIAL_DELAY);
    var maxDelay = systemConfig.getValueAsLong(RETRY_MAX_DELAY);
    var maxRetries = systemConfig.getValueAsInt(MAX_RETRY_ATTEMPTS);

    return new RetryPolicy<Void>()
        .withBackoff(initialDelay, maxDelay, delayUnit)
        .withMaxAttempts(maxRetries)
        .handle(List.of(JDBCException.class))
        .onFailedAttempt(
            e -> LOGGER.info("Cache population attempt failed with error{}, will try again...", e));
  }
}
