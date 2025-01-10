package gms.shared.frameworks.cache.utils;

import static java.util.Collections.singleton;
import static org.assertj.core.api.Assertions.assertThat;

import javax.cache.expiry.CreatedExpiryPolicy;
import javax.cache.expiry.Duration;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;
import org.apache.ignite.configuration.CacheConfiguration;
import org.junit.jupiter.api.Test;

class IgniteConnectionUtilityTest {

  @Test
  void testBuildCacheConfigurations() {
    CacheInfo inputCacheInfo =
        new CacheInfo(
            "test-cache",
            CacheMode.PARTITIONED,
            CacheAtomicityMode.ATOMIC,
            CreatedExpiryPolicy.factoryOf(Duration.FIVE_MINUTES));

    var actualConfigurations = IgniteConnectionUtility.buildCacheConfigurations(inputCacheInfo);

    assertThat(actualConfigurations)
        .singleElement()
        .returns(inputCacheInfo.cacheName(), CacheConfiguration::getName)
        .returns(inputCacheInfo.cacheMode(), CacheConfiguration::getCacheMode)
        .returns(inputCacheInfo.expiryPolicy(), CacheConfiguration::getExpiryPolicyFactory);

    assertThat(IgniteConnectionUtility.buildCacheConfigurations(singleton(inputCacheInfo)))
        .isEqualTo(actualConfigurations);
  }

  @Test
  void testBuildNodeAttributes() {
    CacheInfo inputCacheInfo =
        new CacheInfo("test-cache", CacheMode.PARTITIONED, CacheAtomicityMode.TRANSACTIONAL);

    var actualNodeAttributes = IgniteConnectionUtility.buildNodeAttributes(inputCacheInfo);
    assertThat(actualNodeAttributes).hasSize(1).containsEntry(inputCacheInfo.nodeAttr(), true);

    assertThat(IgniteConnectionUtility.buildNodeAttributes(singleton(inputCacheInfo)))
        .isEqualTo(actualNodeAttributes);
  }
}
