package gms.shared.frameworks.configuration.repository.client;

import static gms.shared.frameworks.configuration.repository.ConfigurationTestFixtures.configurationKey;
import static gms.shared.frameworks.configuration.repository.ConfigurationTestFixtures.filterDescConfig;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import gms.shared.frameworks.configuration.ConfigurationRepository;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.ConfigurationTestFixtures;
import gms.shared.frameworks.configuration.repository.FooParameters;
import gms.shared.frameworks.configuration.repository.TestUtilities;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.exceptions.misusing.InvalidUseOfMatchersException;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.stubbing.Answer;

@ExtendWith(MockitoExtension.class)
class ConfigurationConsumerUtilityTest {

  private static final RetryConfig retryConfig = RetryConfig.create(1, 10, ChronoUnit.SECONDS, 1);

  @Mock private ConfigurationRepository configurationRepository;

  /**
   * Mocks configurationRepository to return an List of Configurations containing
   * configurationSnrIs5 when queried with configurationKey. Does not return any configurations for
   * the global configuration key prefix.
   */
  private void mockGmsConfigurationToReturnPresentConfigurationItemNoGlobalDefaults() {
    Mockito.when(configurationRepository.getKeyRange(Mockito.anyString()))
        .thenAnswer(
            invocation -> {
              Object argument = invocation.getArguments()[0];
              if (argument.equals(configurationKey) || "unknown-key".equals(argument)) {
                return List.of(ConfigurationTestFixtures.configurationSnrIs5);
              } else if (argument.equals(
                  GlobalConfigurationReferenceResolver.REFERENCED_CONFIGURATION_KEY_PREFIX)) {
                return List.of();
              }
              throw new InvalidUseOfMatchersException(
                  String.format("Argument %s does not match", argument));
            });
  }

  /**
   * Mocks configurationRepository to return a List of Configurations containing global reference
   * configurations for the global configuration key prefix.
   */
  private void mockGmsConfigurationToReturnGlobalReferences() {
    Mockito.when(configurationRepository.getKeyRange(Mockito.anyString()))
        .thenAnswer(
            invocation -> {
              Object argument = invocation.getArguments()[0];
              if (argument
                  .toString()
                  .contains(
                      GlobalConfigurationReferenceResolver.REFERENCED_CONFIGURATION_KEY_PREFIX)) {
                return List.of(ConfigurationTestFixtures.filterDefNestedConfig, filterDescConfig);
              } else if (argument.equals(configurationKey) || "unknown-key".equals(argument)) {
                return List.of();
              }
              throw new InvalidUseOfMatchersException(
                  String.format("Argument %s does not match", argument));
            });
  }

  private ConfigurationConsumerUtility getClientUtilMockGmsConfig() {
    mockGmsConfigurationToReturnPresentConfigurationItemNoGlobalDefaults();
    return ConfigurationConsumerUtility.builder(configurationRepository)
        .retryConfiguration(retryConfig)
        .configurationNamePrefixes(List.of(configurationKey))
        .build();
  }

  private ConfigurationConsumerUtility getClientUtilOverrideCache(
      Duration expiration, long maxEntries) {
    return ConfigurationConsumerUtility.builder(configurationRepository)
        .selectorCacheExpiration(expiration)
        .selectorCacheMaxEntries(maxEntries)
        .retryConfiguration(retryConfig)
        .configurationNamePrefixes(List.of(configurationKey))
        .build();
  }

  /** Mocks configurationRepository to return an empty List when queried with configurationKey */
  private void mockGmsConfigurationToReturnEmptyListNoGlobalDefaults() {
    Mockito.when(configurationRepository.getKeyRange(Mockito.anyString()))
        .thenAnswer(
            invocation -> {
              Object argument = invocation.getArguments()[0];
              if (argument.equals(configurationKey)) {
                return List.of();
              } else if (argument.equals(
                  GlobalConfigurationReferenceResolver.REFERENCED_CONFIGURATION_KEY_PREFIX)) {
                return List.of();
              }
              throw new InvalidUseOfMatchersException(
                  String.format("Argument %s does not match", argument));
            });
  }

  @Test
  void testBuildNoKeys() {
    final ConfigurationConsumerUtility clientUtility =
        ConfigurationConsumerUtility.builder(configurationRepository)
            .retryConfiguration(retryConfig)
            .build();

    // When no keys are provided only the globally reference configuration should be loaded
    verify(configurationRepository, Mockito.times(1)).getKeyRange(Mockito.anyString());
    verify(configurationRepository, Mockito.times(1))
        .getKeyRange(GlobalConfigurationReferenceResolver.REFERENCED_CONFIGURATION_KEY_PREFIX);

    // TODO: verify watches are setup

    assertNotNull(clientUtility);
  }

  @Test
  void testBuildNullConfigurationRepositoryExpectNullPointerException() {
    TestUtilities.expectExceptionAndMessage(
        () -> ConfigurationConsumerUtility.builder(null),
        NullPointerException.class,
        "Requires non-null ConfigurationRepository");
  }

  @Test
  void testBuildLoadsKeys() {
    final ConfigurationConsumerUtility clientUtility = getClientUtilMockGmsConfig();

    verify(configurationRepository, Mockito.times(1)).getKeyRange(configurationKey);

    // TODO: verify watches are setup
    assertNotNull(clientUtility);
  }

  @Test
  void testBuildWithOrWithoutExpiration() throws NoSuchFieldException, IllegalAccessException {
    ConfigurationConsumerUtility clientUtility = getClientUtilMockGmsConfig();
    assertEquals(
        ConfigurationConsumerUtility.DEFAULT_CACHE_EXPIRATION,
        clientUtility.getSelectorCacheExpiration());
    assertEquals(
        ConfigurationConsumerUtility.DEFAULT_CACHE_MAX_ENTRIES,
        clientUtility.getSelectorCacheMaxEntries());

    Duration expirationOverride = Duration.ofSeconds(1);
    long maxEntriesOverride = 5;
    ConfigurationConsumerUtility clientUtilityExpirationOverride =
        getClientUtilOverrideCache(expirationOverride, maxEntriesOverride);
    assertEquals(expirationOverride, clientUtilityExpirationOverride.getSelectorCacheExpiration());
    assertEquals(maxEntriesOverride, clientUtilityExpirationOverride.getSelectorCacheMaxEntries());
  }

  @Test
  void testBuildNullConfigurationKeysExpectNullPointerException() {
    TestUtilities.expectExceptionAndMessage(
        () ->
            ConfigurationConsumerUtility.builder(configurationRepository)
                .configurationNamePrefixes(null),
        NullPointerException.class,
        "Requires non-null configurationNamePrefixes");
  }

  @Test
  void testBuildLoadsGlobalDefaults() {
    mockGmsConfigurationToReturnPresentConfigurationItemNoGlobalDefaults();

    ConfigurationConsumerUtility.builder(configurationRepository)
        .configurationNamePrefixes(List.of(configurationKey))
        .retryConfiguration(retryConfig)
        .build();

    verify(configurationRepository, Mockito.times(1))
        .getKeyRange(GlobalConfigurationReferenceResolver.REFERENCED_CONFIGURATION_KEY_PREFIX);
  }

  @Test
  void testToBuilder() {
    var ccu =
        ConfigurationConsumerUtility.builder(configurationRepository)
            .configurationNamePrefixes(List.of(configurationKey))
            .retryConfiguration(retryConfig)
            .build();

    var ccuBuilder = ccu.toBuilder();

    assertAll(
        () -> assertEquals(1, ccuBuilder.getConfigurationNamePrefixes().size()),
        () -> assertTrue(ccuBuilder.getConfigurationNamePrefixes().contains(configurationKey)),
        () -> assertEquals(configurationRepository, ccuBuilder.getConfigurationRepository()),
        () ->
            assertEquals(ccu.getSelectorCacheExpiration(), ccuBuilder.getSelectorCacheExpiration()),
        () ->
            assertEquals(ccu.getSelectorCacheMaxEntries(), ccuBuilder.getSelectorCacheMaxEntries()),
        () -> assertEquals(retryConfig, ccuBuilder.getRetryConfiguration()));
  }

  @Test
  void testGlobalDefaultsCanBeEmpty() {
    mockGmsConfigurationToReturnPresentConfigurationItemNoGlobalDefaults();

    Assertions.assertDoesNotThrow(
        () ->
            ConfigurationConsumerUtility.builder(configurationRepository)
                .configurationNamePrefixes(List.of(configurationKey))
                .retryConfiguration(retryConfig)
                .build());
  }

  @Test
  void testLoadConfigurations() {
    mockGmsConfigurationToReturnPresentConfigurationItemNoGlobalDefaults();

    final ConfigurationConsumerUtility clientUtility =
        ConfigurationConsumerUtility.builder(configurationRepository)
            .retryConfiguration(retryConfig)
            .build();
    assertNotNull(clientUtility);

    verify(configurationRepository, Mockito.times(0)).getKeyRange(configurationKey);

    clientUtility.loadConfigurations(List.of(configurationKey));
    verify(configurationRepository, Mockito.times(1)).getKeyRange(configurationKey);
    Mockito.verifyNoMoreInteractions(configurationRepository);
  }

  @Test
  void testLoadConfigurationGlobalReferences() {
    mockGmsConfigurationToReturnGlobalReferences();

    final ConfigurationConsumerUtility clientUtility =
        ConfigurationConsumerUtility.builder(configurationRepository)
            .retryConfiguration(retryConfig)
            .build();
    assertNotNull(clientUtility);

    verify(configurationRepository, Mockito.times(0)).getKeyRange(configurationKey);

    Mockito.verifyNoMoreInteractions(configurationRepository);
  }

  @Test
  void testLoadConfigurationsDoesNotReloadExistingConfigurations() {
    final ConfigurationConsumerUtility clientUtility = getClientUtilMockGmsConfig();
    clientUtility.loadConfigurations(List.of(configurationKey));
    Mockito.verifyNoMoreInteractions(configurationRepository);
  }

  @Test
  void testLoadConfigurationsValidatesParameters() {
    final ConfigurationConsumerUtility clientUtility = getClientUtilMockGmsConfig();

    TestUtilities.expectExceptionAndMessage(
        () -> clientUtility.loadConfigurations(null),
        NullPointerException.class,
        "Requires non-null configurationNamePrefixes");
  }

  private static class NamedInt {

    @JsonProperty private int named;

    @JsonCreator
    private NamedInt(@JsonProperty("named") int named) {
      this.named = named;
    }
  }

  @Test
  void testResolveToFieldMap() {
    final Map<String, Object> resolvedParamsFieldMap =
        getClientUtilMockGmsConfig().resolve(configurationKey, List.of(Selector.from("snr", -5.0)));

    assertAll(
        () -> assertNotNull(resolvedParamsFieldMap),
        () -> assertEquals(ConfigurationTestFixtures.fooParamsDefaultsMap, resolvedParamsFieldMap));
  }

  @Test
  void testResolveUnknownConfigurationKeyExpectConfiguraitonResolutionException() {
    final String unknownKey = "unknown-key";

    TestUtilities.expectExceptionAndMessage(
        () -> getClientUtilMockGmsConfig().resolve(unknownKey, List.of(), Number.class),
        ConfigurationResolutionException.class,
        "No Configuration named " + unknownKey + " is in this");
  }

  @Test
  void testResolveToObjectFromClass() {
    final FooParameters resolvedParams =
        getClientUtilMockGmsConfig()
            .resolve(configurationKey, List.of(Selector.from("snr", -5.0)), FooParameters.class);

    assertAll(
        () -> assertNotNull(resolvedParams),
        () -> assertEquals(ConfigurationTestFixtures.fooParamsDefaults, resolvedParams));
  }

  @Test
  void testParameterClassNotCreatableExpectConfiguraitonResolutionException() {
    TestUtilities.expectExceptionAndMessage(
        () -> getClientUtilMockGmsConfig().resolve(configurationKey, List.of(), Number.class),
        ConfigurationResolutionException.class,
        "Resolved Configuration is not a valid instance of " + Number.class.getCanonicalName());
  }

  @Test
  void testResolveNullConfigurationNameExpectNullPointerException() {
    TestUtilities.expectExceptionAndMessage(
        () -> getClientUtilMockGmsConfig().resolve(null, List.of()),
        NullPointerException.class,
        "Cannot resolve Configuration for null configurationName");
  }

  @Test
  void testResolveNullSelectorsExpectNullPointerException() {
    TestUtilities.expectExceptionAndMessage(
        () -> getClientUtilMockGmsConfig().resolve(configurationKey, null),
        NullPointerException.class,
        "Cannot resolve Configuration for null selectors");
  }

  @Test
  void testResolveNullParametersClassExpectNullPointerException() {
    TestUtilities.expectExceptionAndMessage(
        () -> getClientUtilMockGmsConfig().resolve(configurationKey, List.of(), null),
        NullPointerException.class,
        "Cannot resolve Configuration to null parametersClass");
  }

  @Test
  void testRetryWindow() {
    RetryConfig retryConfig = RetryConfig.create(1, 2, ChronoUnit.MILLIS, 10);

    ConfigurationRepository mockRepo = Mockito.mock(ConfigurationRepository.class);

    when(mockRepo.getKeyRange(configurationKey))
        .thenAnswer(
            new Answer() {
              private int count = 1;

              public Object answer(InvocationOnMock invocation) {
                if (count < 5) {
                  count++;
                  return List.of();
                }
                return List.of(ConfigurationTestFixtures.configurationSnrIs5);
              }
            });

    ConfigurationConsumerUtility util =
        ConfigurationConsumerUtility.builder(mockRepo)
            .retryConfiguration(retryConfig)
            .configurationNamePrefixes(List.of(configurationKey))
            .build();

    FooParameters resolvedParams =
        util.resolve(configurationKey, List.of(Selector.from("snr", -5.0)), FooParameters.class);

    Mockito.verify(mockRepo, times(5)).getKeyRange(configurationKey);
    assertEquals(ConfigurationTestFixtures.fooParamsDefaults, resolvedParams);
  }

  @Test
  void testRetryWindowFail() {
    var maxAttempts = 10;
    RetryConfig retryConfig = RetryConfig.create(1, 2, ChronoUnit.MILLIS, maxAttempts);

    ConfigurationRepository mockRepo = Mockito.mock(ConfigurationRepository.class);

    when(mockRepo.getKeyRange(configurationKey)).thenReturn(Collections.emptyList());

    ConfigurationConsumerUtility util =
        ConfigurationConsumerUtility.builder(mockRepo)
            .retryConfiguration(retryConfig)
            .configurationNamePrefixes(List.of(configurationKey))
            .build();

    var selectors = List.of(Selector.from("snr", -5.0));

    final Throwable actualThrowable =
        assertThrows(
            ConfigurationResolutionException.class,
            () -> util.resolve(configurationKey, selectors, FooParameters.class));
    assertTrue(
        actualThrowable
            .getMessage()
            .contains(
                "No Configuration named [component-name]-configuration is in this"
                    + " ConfigurationConsumerUtility"));

    Mockito.verify(mockRepo, times(maxAttempts + 1)).getKeyRange(configurationKey);
  }

  @Test
  void testResolveWithFinisher() {
    var expected = "TEST";
    Function<FooParameters, String> fooIntFinisher = fp -> expected;
    var result =
        assertDoesNotThrow(
            () ->
                getClientUtilMockGmsConfig()
                    .resolve(
                        configurationKey,
                        Collections.emptyList(),
                        FooParameters.class,
                        fooIntFinisher));

    assertEquals(expected, result);
  }

  @Test
  void testResolveWithFinisherFailureThrowsConfigurationResolutionException() {
    Function<FooParameters, Object> failFinisher =
        fp -> {
          throw new RuntimeException("Failed to finish translating " + fp);
        };
    var mockGmsConfig = getClientUtilMockGmsConfig();
    List<? extends Selector<?>> emptyCollection = Collections.emptyList();
    var result =
        assertThrows(
            ConfigurationResolutionException.class,
            () ->
                mockGmsConfig.resolve(
                    configurationKey, emptyCollection, FooParameters.class, failFinisher));

    assertEquals(RuntimeException.class, result.getCause().getClass());
    assertTrue(
        result
            .getMessage()
            .contains(
                "Resolved Configuration failed to be transformed from a valid instance of "
                    + FooParameters.class.getCanonicalName()));
  }
}
