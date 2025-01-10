package gms.shared.frameworks.cache.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.systemconfig.SystemConfig;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import javax.cache.configuration.Factory;
import javax.cache.expiry.CreatedExpiryPolicy;
import javax.cache.expiry.Duration;
import javax.cache.expiry.ExpiryPolicy;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;
import org.apache.ignite.configuration.CacheConfiguration;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled("Determine usefulness")
class IgniteConnectionManagerTest {

  SystemConfig systemConfig;

  @BeforeAll
  static void setIgniteHome() throws IOException {
    Path tempIgniteDirectory = Files.createTempDirectory("ignite-work");
    System.setProperty("IGNITE_HOME", tempIgniteDirectory.toString());
  }

  //    -----example of setting ExpiryPolicy-----
  public static CacheInfo DATA_WITH_EXPIRY_POLICY =
      new CacheInfo(
          "data",
          CacheMode.PARTITIONED,
          CacheAtomicityMode.ATOMIC,
          CreatedExpiryPolicy.factoryOf(Duration.FIVE_MINUTES));

  //    -----example of setting no EvictionPolicy-----
  public static CacheInfo DATA =
      new CacheInfo("data", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);

  @Test
  void testPassingNullConfigToCacheFactoryThrowsError() {
    assertThrows(NullPointerException.class, () -> IgniteConnectionManager.initialize(null, null));
  }

  @Test
  void testExpiryPolicy() {
    IgniteConnectionManager.initialize(systemConfig, List.of(DATA_WITH_EXPIRY_POLICY));
    IgniteCache<String, String> cache =
        IgniteConnectionManager.getOrCreateCache(DATA_WITH_EXPIRY_POLICY);
    CacheConfiguration<?, ?> configuration = cache.getConfiguration(CacheConfiguration.class);
    Factory<? extends ExpiryPolicy> expiryPolicy = configuration.getExpiryPolicyFactory();

    assertEquals(DATA_WITH_EXPIRY_POLICY.expiryPolicy(), expiryPolicy);
    IgniteConnectionManager.close();
  }

  @Test
  void testMultipleCreateError() {
    IgniteConnectionManager.initialize(systemConfig, List.of(DATA));
    assertThrows(
        java.lang.IllegalStateException.class,
        () -> IgniteConnectionManager.initialize(systemConfig, List.of(DATA)));
    IgniteConnectionManager.close();
  }

  @Test
  void testConnectionClose() {
    IgniteConnectionManager.initialize(systemConfig, List.of(DATA));
    IgniteCache<String, String> cache = IgniteConnectionManager.getOrCreateCache(DATA);

    IgniteConnectionManager.close();
    assertThrows(java.lang.IllegalStateException.class, () -> cache.put("Hello", "world?"));
  }

  @Test
  void testCacheCreation() {
    IgniteConnectionManager.initialize(systemConfig, List.of(DATA));
    IgniteCache<String, String> cache = IgniteConnectionManager.getOrCreateCache(DATA);
    assertEquals(DATA.cacheName(), cache.getName());
    assertEquals(0, cache.size());

    cache.put("station", "Terrapin");
    assertEquals(1, cache.size());
    assertTrue(cache.containsKey("station"));
    assertEquals("Terrapin", cache.get("station"));
    IgniteConnectionManager.close();
  }
}
