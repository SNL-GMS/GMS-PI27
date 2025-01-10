package gms.shared.stationdefinition.cache.util;

import gms.shared.frameworks.cache.utils.CacheInfo;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.util.List;
import org.apache.commons.lang3.Validate;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;

/** Factory for setting up IgniteCache connections for all cache types */
public final class StationDefinitionCacheFactory {

  public static final CacheInfo REQUEST_CACHE =
      new CacheInfo("station-definition-request", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);
  public static final CacheInfo VERSION_EFFECTIVE_TIME_CACHE =
      new CacheInfo(
          "version-effective-time-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);
  public static final CacheInfo VERSION_ENTITY_TIME_CACHE =
      new CacheInfo("version-entity-time-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);
  public static final CacheInfo RECORD_ID_WFID_CHANNEL_CACHE =
      new CacheInfo("arid-wfid-channel-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);
  public static final CacheInfo CHANNEL_RECORD_ID_WFID_CACHE =
      new CacheInfo("channel-arid-wfid-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);
  public static final CacheInfo WFID_RESPONSE_CACHE =
      new CacheInfo("wfid-response-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);
  public static final CacheInfo CHANNEL_RESPONSE_CACHE =
      new CacheInfo("channel-response-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);
  public static final CacheInfo VERSION_EFFECTIVE_TIME_DERIVED_CACHE =
      new CacheInfo(
          "version-effective-time-derived-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);
  public static final CacheInfo VERSION_ENTITY_TIME_DERIVED_CACHE =
      new CacheInfo(
          "version-entity-time-derived-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);
  public static final CacheInfo FREQUENCY_AMPLITUDE_PHASE_CACHE =
      new CacheInfo(
          "frequency-amplitude-phase-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);

  private static final List<CacheInfo> CACHE_INFO_LIST =
      List.of(
          // REQUEST
          REQUEST_CACHE,
          // VERSION
          VERSION_EFFECTIVE_TIME_CACHE,
          VERSION_ENTITY_TIME_CACHE,
          // Derived version
          VERSION_EFFECTIVE_TIME_DERIVED_CACHE,
          VERSION_ENTITY_TIME_DERIVED_CACHE,
          // WFID and RECORDID mappings
          RECORD_ID_WFID_CHANNEL_CACHE,
          CHANNEL_RECORD_ID_WFID_CACHE,
          WFID_RESPONSE_CACHE,
          CHANNEL_RESPONSE_CACHE,
          FREQUENCY_AMPLITUDE_PHASE_CACHE);

  private StationDefinitionCacheFactory() {}

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
