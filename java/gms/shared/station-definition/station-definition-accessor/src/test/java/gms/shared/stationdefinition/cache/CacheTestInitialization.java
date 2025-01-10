package gms.shared.stationdefinition.cache;

import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.REQUEST_CACHE;
import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.VERSION_EFFECTIVE_TIME_CACHE;
import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.VERSION_ENTITY_TIME_CACHE;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public class CacheTestInitialization {
  public CacheTestInitialization() {}

  public static void setup(SystemConfig systemConfig) throws IOException {
    Path tempIgniteDirectory = Files.createTempDirectory("ignite-work");
    System.setProperty("IGNITE_HOME", tempIgniteDirectory.toString());

    IgniteConnectionManager.initialize(
        systemConfig,
        List.of(REQUEST_CACHE, VERSION_EFFECTIVE_TIME_CACHE, VERSION_ENTITY_TIME_CACHE));
  }
}
