package gms.shared.frameworks.configuration.repository.client;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.google.common.util.concurrent.UncheckedExecutionException;
import gms.shared.frameworks.configuration.Configuration;
import gms.shared.frameworks.configuration.ConfigurationResolver;
import gms.shared.frameworks.configuration.Selector;
import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.function.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Implementation of {@link ConfigurationSelectorCache} using a guava {@link Cache}. */
public final class ConfigurationSelectorGuavaCache implements ConfigurationSelectorCache {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(ConfigurationSelectorGuavaCache.class);

  private final Configuration configuration;

  private final Cache<Set<Selector>, Map<String, Object>> fieldMapCache;

  private final Collection<Map<String, Object>> cacheValues;

  private ConfigurationSelectorGuavaCache(
      Configuration configuration, Duration expiration, long maxEntries) {
    this.configuration = configuration;
    this.fieldMapCache =
        CacheBuilder.newBuilder().expireAfterAccess(expiration).maximumSize(maxEntries).build();
    this.cacheValues = fieldMapCache.asMap().values();
  }

  /**
   * Factory method
   *
   * @param configuration Configuration used to resolve cacheable options
   * @param expiration Time-to-live of a given cache entry
   * @param maxEntries Maximum entries allowed before programmatic eviction
   * @return
   */
  public static ConfigurationSelectorGuavaCache create(
      Configuration configuration, Duration expiration, long maxEntries) {
    return new ConfigurationSelectorGuavaCache(configuration, expiration, maxEntries);
  }

  /**
   * {@inheritDoc}
   *
   * @throws ConfigurationResolutionException if there is a failure to resolve a value from the
   *     cached field map
   */
  @Override
  public Map<String, Object> resolveFieldMap(List<? extends Selector<?>> selectors) {
    Set<Selector> selectorSet = Set.copyOf(selectors);
    try {
      return fieldMapCache.get(selectorSet, () -> resolveAndCheckExistingFieldMap(selectors));
    } catch (ExecutionException | UncheckedExecutionException e) {
      // Need to unwrap the exception if it's unchecked.
      LOGGER.debug("Execution exception encountered in cached field map resolution", e);
      Throwable cause = e.getCause();
      throw new ConfigurationResolutionException(
          "Failure attempting to resolve configuration field map from cache",
          cause,
          configuration.getName());
    }
  }

  private Map<String, Object> resolveAndCheckExistingFieldMap(
      List<? extends Selector<?>> selectors) {
    var fieldMap = ConfigurationResolver.resolve(configuration, selectors);
    var existingFieldMap = cacheValues.stream().filter(Predicate.isEqual(fieldMap)).findAny();
    return existingFieldMap.orElse(fieldMap);
  }

  protected Cache<Set<Selector>, Map<String, Object>> getFieldMapCache() {
    return fieldMapCache;
  }
}
