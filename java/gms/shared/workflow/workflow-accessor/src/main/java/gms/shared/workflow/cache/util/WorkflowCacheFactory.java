package gms.shared.workflow.cache.util;

import gms.shared.frameworks.cache.utils.CacheInfo;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.util.List;
import org.apache.commons.lang3.Validate;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;

/** Factory for setting up IgniteCache connections for all cache types */
public final class WorkflowCacheFactory {

  public static final CacheInfo INTERVAL_CACHE =
      new CacheInfo("interval-cache", CacheMode.PARTITIONED, CacheAtomicityMode.TRANSACTIONAL);

  private static final List<CacheInfo> CACHE_INFO_LIST = List.of(INTERVAL_CACHE);

  private WorkflowCacheFactory() {
    // Hide implicit public constructor
  }

  /**
   * Set up the IgniteCache using {@link SystemConfig}
   *
   * @param systemConfig System configuration
   */
  public static void setUpCache(SystemConfig systemConfig) {
    Validate.notNull(systemConfig, "SystemConfig is required");
    IgniteConnectionManager.initialize(systemConfig, CACHE_INFO_LIST);
  }
}
