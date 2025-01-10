package gms.shared.frameworks.cache.utils;

import java.util.concurrent.TimeUnit;
import javax.cache.configuration.Factory;
import javax.cache.expiry.AccessedExpiryPolicy;
import javax.cache.expiry.Duration;
import javax.cache.expiry.ExpiryPolicy;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;

public record CacheInfo(
    String cacheName,
    CacheMode cacheMode,
    CacheAtomicityMode cacheAtomicityMode,
    Factory<? extends ExpiryPolicy> expiryPolicy) {

  private static final Duration defaultExpiryDuration = new Duration(TimeUnit.DAYS, 30);

  private static final String NODE_EXT = ".node";

  public CacheInfo(String cacheName, CacheMode cacheMode, CacheAtomicityMode cacheAtomicityMode) {
    this(
        cacheName,
        cacheMode,
        cacheAtomicityMode,
        AccessedExpiryPolicy.factoryOf(defaultExpiryDuration));
  }

  public String nodeAttr() {
    return cacheName() + NODE_EXT;
  }
}
