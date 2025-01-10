package gms.shared.waveform.qc.mask.cache.util;

import gms.shared.frameworks.cache.utils.CacheInfo;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.util.List;
import org.apache.commons.lang3.Validate;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;

/** QcMask cache factory for setting up the cache configurations */
public final class QcMaskCacheFactory {
  public static final CacheInfo QC_SEGMENT_CACHE =
      new CacheInfo("qc-segment-cache", CacheMode.PARTITIONED, CacheAtomicityMode.TRANSACTIONAL);
  public static final CacheInfo QC_SEGMENT_VERSION_CACHE =
      new CacheInfo(
          "qc-segment-version-cache", CacheMode.PARTITIONED, CacheAtomicityMode.TRANSACTIONAL);
  public static final CacheInfo QC_MASK_DAO_CACHE =
      new CacheInfo("qc-mask-dao-cache", CacheMode.PARTITIONED, CacheAtomicityMode.TRANSACTIONAL);

  private static final List<CacheInfo> CACHE_INFO_LIST =
      List.of(QC_SEGMENT_CACHE, QC_SEGMENT_VERSION_CACHE, QC_MASK_DAO_CACHE);

  private QcMaskCacheFactory() {}

  /**
   * Setup the IgniteCache using {@link SystemConfig}
   *
   * @param systemConfig system configuration
   */
  public static void setUpCache(SystemConfig systemConfig) {
    Validate.notNull(systemConfig, "SystemConfig is required");
    IgniteConnectionManager.initialize(systemConfig, CACHE_INFO_LIST);
  }
}
