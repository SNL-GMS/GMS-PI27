package gms.shared.frameworks.cache.utils;

import static java.util.stream.Collectors.toMap;

import java.util.Arrays;
import java.util.Collection;
import java.util.Map;
import org.apache.ignite.configuration.CacheConfiguration;

public final class IgniteConnectionUtility {

  private IgniteConnectionUtility() {
    // Hide implicit public constructor
  }

  static CacheConfiguration[] buildCacheConfigurations(CacheInfo... cacheInfos) {
    return Arrays.stream(cacheInfos)
        .map(IgniteConnectionUtility::createCacheFromCacheInfo)
        .toArray(CacheConfiguration[]::new);
  }

  static CacheConfiguration[] buildCacheConfigurations(Collection<CacheInfo> cacheInfos) {
    return cacheInfos.stream()
        .map(IgniteConnectionUtility::createCacheFromCacheInfo)
        .toArray(CacheConfiguration[]::new);
  }

  static <T, U> CacheConfiguration<T, U> createCacheFromCacheInfo(CacheInfo cache) {
    return new CacheConfiguration<T, U>()
        .setName(cache.cacheName())
        .setCacheMode(cache.cacheMode())
        .setAtomicityMode(cache.cacheAtomicityMode())
        .setExpiryPolicyFactory(cache.expiryPolicy())
        .setBackups(1);
  }

  static Map<String, Object> buildNodeAttributes(CacheInfo... cacheInfos) {
    return buildNodeAttributes(Arrays.asList(cacheInfos));
  }

  static Map<String, Object> buildNodeAttributes(Collection<CacheInfo> cacheInfos) {
    return cacheInfos.stream().collect(toMap(CacheInfo::nodeAttr, cacheInfo -> true));
  }
}
