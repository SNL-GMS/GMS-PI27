package gms.shared.waveform.bridge.repository.utils;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.frameworks.cache.utils.CacheInfo;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;
import org.springframework.stereotype.Component;

/** A utility providing access to previously bridged {@link ProcessingMask}s */
@Component
public class BridgedProcessingMaskCache {

  public static final CacheInfo BRIDGED_PROCESSING_MASK_CACHE =
      new CacheInfo(
          "bridged-processing-mask-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);

  private final IgniteCache<UUID, ProcessingMask> bridgedProcessingMaskIgniteCache;

  BridgedProcessingMaskCache() {
    this.bridgedProcessingMaskIgniteCache =
        IgniteConnectionManager.getOrCreateCache(BRIDGED_PROCESSING_MASK_CACHE);
  }

  /**
   * Add the provided {@link ProcessingMask}s to cache. When a {@link ProcessingMask} already exists
   * in the cache it will updated it with the provided entry.
   *
   * @param masks the collection of {@link ProcessingMask}s to cache
   * @throws NullPointerException if masks is null
   */
  public void cache(Collection<ProcessingMask> masks) {
    checkNotNull(masks);

    masks.stream().forEach(mask -> bridgedProcessingMaskIgniteCache.put(mask.getId(), mask));
  }

  /**
   * Retrieves a {@link ProcessingMask} based on its {@link UUID}
   *
   * @param id {@link UUID} of the {@link ProcessingMask} to be retrieved
   * @return an optional of the retrieved {@link ProcessingMask} if it exists; otherwise an empty
   *     optional
   * @throws NullPointerException if id is null
   */
  public Optional<ProcessingMask> findById(UUID id) {
    checkNotNull(id);

    return Optional.ofNullable(bridgedProcessingMaskIgniteCache.get(id));
  }
}
