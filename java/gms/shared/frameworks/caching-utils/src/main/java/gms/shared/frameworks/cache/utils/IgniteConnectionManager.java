package gms.shared.frameworks.cache.utils;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.frameworks.systemconfig.SystemConfig;
import java.io.Closeable;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collection;
import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.IgniteTransactions;
import org.apache.ignite.Ignition;
import org.apache.ignite.configuration.IgniteConfiguration;
import org.apache.ignite.configuration.NearCacheConfiguration;
import org.apache.ignite.kubernetes.configuration.KubernetesConnectionConfiguration;
import org.apache.ignite.logger.slf4j.Slf4jLogger;
import org.apache.ignite.spi.discovery.tcp.TcpDiscoverySpi;
import org.apache.ignite.spi.discovery.tcp.ipfinder.kubernetes.TcpDiscoveryKubernetesIpFinder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The {@link IgniteConnectionManager} is used to create {@link IgniteCache} instances from an
 * Ignite node. This way a client just need to adhere to accessing the cache via the JCache API
 * rather than using an Ignite-specific query mechanism.
 *
 * <p>The class implements the {@link Closeable} interface in order to allow us to close the Ignite
 * node upon shutdown of a given application or use try-with-resources when scoping down the access
 * to an Ignite node specifically.
 */
public final class IgniteConnectionManager {

  private static final String CONFIG_IGNITE_INSTANCE_NAME = "ignite-instance-name";
  private static final String NAMESPACE_LOCATION =
      "/var/run/secrets/kubernetes.io/serviceaccount/namespace";

  private static Ignite ignite;

  private static final Logger LOGGER = LoggerFactory.getLogger(IgniteConnectionManager.class);

  private IgniteConnectionManager() {
    // private constructor for factory class
  }

  /**
   * Create {@link IgniteConnectionManager} that controls configuration of cache and registers
   * creator as a server node server nodes participate in the cluster to store data
   *
   * <p>Clients can simply call
   * IgniteConnectionManager.getInstance().getOrCreateCache(CacheName.{name}); to retrieve data from
   * the cluster
   *
   * @param systemConfig - system config to setup cache cluster
   * @param cacheList - caches to create in the cluster. The node calling this will host (some of)
   *     the data
   */
  public static synchronized void initialize(
      SystemConfig systemConfig, Collection<CacheInfo> cacheList) {
    initialize(createConfiguration(systemConfig, cacheList));
  }

  static synchronized void initialize(IgniteConfiguration configuration) {
    if (ignite == null) {
      LOGGER.info("Initializing ignite cache");
      ignite = Ignition.start(configuration);
    } else {
      LOGGER.warn("Ignite cache already initialized");
    }
  }

  private static IgniteConfiguration createConfiguration(
      SystemConfig systemConfig, Collection<CacheInfo> cacheList) {
    checkNotNull(systemConfig);
    checkNotNull(cacheList);

    KubernetesConnectionConfiguration kcc =
        new KubernetesConnectionConfiguration()
            .setNamespace(getKubernetesNamespace())
            .setServiceName("ignite");
    var kipFinder = new TcpDiscoveryKubernetesIpFinder(kcc);
    TcpDiscoverySpi spi = new TcpDiscoverySpi().setIpFinder(kipFinder);

    return new IgniteConfiguration()
        .setIgniteInstanceName(systemConfig.getValue(CONFIG_IGNITE_INSTANCE_NAME))
        .setGridLogger(new Slf4jLogger())
        .setClientMode(true)
        .setCacheConfiguration(IgniteConnectionUtility.buildCacheConfigurations(cacheList))
        .setDiscoverySpi(spi);

    // TBD: Other potentially useful configuration settings
    //      long timeout = systemConfig.getValueAsLong("ignite-failure-detection-timeout");
    //      .setPeerClassLoadingEnabled(true);
    //      .setUserAttributes(IgniteConnectionUtility.buildNodeAttributes(cacheList))
    //      .setNetworkTimeout(timeout)
    //      .setFailureDetectionTimeout(timeout)
    //      .setNetworkSendRetryDelay(timeout)
    //      .setIncludeEventTypes(INCLUDED_EVENT_TYPES)
    //      .setEventStorageSpi(new MemoryEventStorageSpi().setExpireAgeMs(60000))
    //      .setMetricsLogFrequency(0);
  }

  /**
   * retrieve a given {@link IgniteCache} by the cacheName.
   *
   * @param cacheInfo all configuration necessary to create an Ignite cache.
   * @param <K> the type of the key to retrieve a {@link IgniteCache.Entry} instance.
   * @param <V> the type of the value of the retrieved {@link IgniteCache.Entry} instance.
   * @return instance of {@link IgniteCache} representing the requested Cache retrieved. null if all
   *     server nodes are down
   */
  public static <K, V> IgniteCache<K, V> getOrCreateCache(CacheInfo cacheInfo) {
    checkNotNull(cacheInfo);
    checkNotNull(ignite, "Ignite has not been initialized.  Did you call create()?");
    return ignite.getOrCreateCache(IgniteConnectionUtility.createCacheFromCacheInfo(cacheInfo));
  }

  /**
   * retrieve a given {@link IgniteCache} by the cacheName and dynamically creates a respective
   * near-cache given the input {@link NearCacheConfiguration}
   *
   * @param cacheInfo all configuration necessary to create an Ignite cache.
   * @param nearCacheConfig all configuration necessary to create an Ignite near-cache
   * @param <K> the type of the key to retrieve a {@link IgniteCache.Entry} instance.
   * @param <V> the type of the value of the retrieved {@link IgniteCache.Entry} instance.
   * @return instance of {@link IgniteCache} representing the requested Cache retrieved. null if all
   *     server nodes are down
   */
  public static <K, V> IgniteCache<K, V> getOrCreateCache(
      CacheInfo cacheInfo, NearCacheConfiguration<K, V> nearCacheConfig) {
    checkNotNull(cacheInfo);
    checkNotNull(ignite, "Ignite has not been initialized.  Did you call create()?");
    checkNotNull(nearCacheConfig);
    return ignite.getOrCreateCache(
        IgniteConnectionUtility.createCacheFromCacheInfo(cacheInfo), nearCacheConfig);
  }

  public static IgniteTransactions getIgniteTransactions() {
    return ignite.transactions();
  }

  public static void close() {
    if (ignite != null) {
      ignite.close();
    }
    IgniteConnectionManager.ignite = null;
  }

  private static String getKubernetesNamespace() {
    var nameSpaceFile = Path.of(NAMESPACE_LOCATION);
    var namespace = "default";
    try {
      namespace = Files.readString(nameSpaceFile);
    } catch (IOException e) {
      LOGGER.error("Could not load namespace from {}", NAMESPACE_LOCATION, e);
    }
    LOGGER.info("Ignite kubernetesIpFinder using namespace {}", namespace);
    return namespace;
  }
}
