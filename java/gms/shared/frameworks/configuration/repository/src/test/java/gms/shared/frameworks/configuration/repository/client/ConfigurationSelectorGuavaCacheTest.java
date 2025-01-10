package gms.shared.frameworks.configuration.repository.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.google.common.collect.Lists;
import gms.shared.frameworks.configuration.Configuration;
import gms.shared.frameworks.configuration.ConfigurationResolver;
import gms.shared.frameworks.configuration.Selector;
import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ConfigurationSelectorGuavaCacheTest {

  private static final Duration CACHE_EXPIRATION = Duration.ofDays(1);
  private static final long CACHE_MAX_ENTRIES = 100;

  @Mock Configuration mockConfiguration;

  @Test
  void testUpdatesCache() {
    ConfigurationSelectorGuavaCache cache =
        ConfigurationSelectorGuavaCache.create(
            mockConfiguration, CACHE_EXPIRATION, CACHE_MAX_ENTRIES);

    Map<String, Object> testFieldMap = Map.of("TEST", "TEST");
    List<Selector<?>> dummySelectors = Collections.emptyList();

    try (MockedStatic<ConfigurationResolver> resolve =
        Mockito.mockStatic(ConfigurationResolver.class)) {

      resolve
          .when(() -> ConfigurationResolver.resolve(mockConfiguration, dummySelectors))
          .thenReturn(new HashMap<>(testFieldMap));
      var fieldMapCache = cache.getFieldMapCache();

      assertNull(fieldMapCache.getIfPresent(Set.copyOf(dummySelectors)));

      assertEquals(testFieldMap, cache.resolveFieldMap(dummySelectors));
      assertEquals(testFieldMap, fieldMapCache.getIfPresent(Set.copyOf(dummySelectors)));
    }
  }

  @Test
  void testResolveSameSelectors() {
    ConfigurationSelectorGuavaCache cache =
        ConfigurationSelectorGuavaCache.create(
            mockConfiguration, CACHE_EXPIRATION, CACHE_MAX_ENTRIES);

    Map<String, Object> testFieldMap = Map.of("TEST", "TEST");
    var selectors = List.of(Selector.from("TEST", 1), Selector.from("TEST2", "TEST"));

    try (MockedStatic<ConfigurationResolver> resolve =
        Mockito.mockStatic(ConfigurationResolver.class)) {

      resolve
          .when(() -> ConfigurationResolver.resolve(mockConfiguration, selectors))
          .thenReturn(new HashMap<>(testFieldMap));
      var fieldMapCache = cache.getFieldMapCache();

      assertNull(fieldMapCache.getIfPresent(Set.copyOf(selectors)));

      assertEquals(testFieldMap, cache.resolveFieldMap(selectors));
      assertEquals(testFieldMap, fieldMapCache.getIfPresent(Set.copyOf(selectors)));

      var reverse = Lists.reverse(selectors);
      assertEquals(testFieldMap, cache.resolveFieldMap(reverse));
      assertEquals(1, fieldMapCache.size());
    }
  }

  @Test
  void testResolveDifferentSelectorsSameFieldMap() {
    ConfigurationSelectorGuavaCache cache =
        ConfigurationSelectorGuavaCache.create(
            mockConfiguration, CACHE_EXPIRATION, CACHE_MAX_ENTRIES);

    Map<String, Object> testFieldMap = Map.of("TEST", "TEST");
    var selectors1 = List.of(Selector.from("TEST", 1));
    var selectors2 = List.of(Selector.from("TEST", 2));

    try (MockedStatic<ConfigurationResolver> resolve =
        Mockito.mockStatic(ConfigurationResolver.class)) {

      resolve
          .when(() -> ConfigurationResolver.resolve(mockConfiguration, selectors1))
          .thenReturn(new HashMap<>(testFieldMap));
      resolve
          .when(() -> ConfigurationResolver.resolve(mockConfiguration, selectors2))
          .thenReturn(new HashMap<>(testFieldMap));

      Map<String, Object> resolvedMap1 = cache.resolveFieldMap(selectors1);
      Map<String, Object> resolvedMap2 = cache.resolveFieldMap(selectors2);
      assertEquals(testFieldMap, resolvedMap1);
      assertEquals(testFieldMap, resolvedMap2);
      assertSame(resolvedMap1, resolvedMap2);
      assertSame(resolvedMap1, cache.resolveFieldMap(selectors1));
      assertSame(resolvedMap2, cache.resolveFieldMap(selectors2));
    }
  }

  @ParameterizedTest
  @MethodSource("exceptionSource")
  void testResolutionFailureThrowsException(RuntimeException exception) {
    ConfigurationSelectorGuavaCache cache =
        ConfigurationSelectorGuavaCache.create(
            mockConfiguration, CACHE_EXPIRATION, CACHE_MAX_ENTRIES);

    try (MockedStatic<ConfigurationResolver> resolve =
        Mockito.mockStatic(ConfigurationResolver.class)) {

      resolve
          .when(() -> ConfigurationResolver.resolve(mockConfiguration, List.of()))
          .thenThrow(exception);
      List<? extends Selector<?>> emptyList = List.of();
      var result =
          assertThrows(
              ConfigurationResolutionException.class, () -> cache.resolveFieldMap(emptyList));

      assertEquals(exception, result.getCause());
    }
  }

  private static Stream<Arguments> exceptionSource() {
    return Stream.of(
        arguments(new NullPointerException()),
        arguments(new IllegalArgumentException()),
        arguments(new IllegalStateException()));
  }
}
