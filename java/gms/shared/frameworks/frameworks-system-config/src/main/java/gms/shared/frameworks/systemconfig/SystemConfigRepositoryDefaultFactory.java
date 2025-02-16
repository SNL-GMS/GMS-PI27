package gms.shared.frameworks.systemconfig;

import java.util.List;

public final class SystemConfigRepositoryDefaultFactory {

  private SystemConfigRepositoryDefaultFactory() {}

  public static List<SystemConfigRepository> create() {
    return List.of(
        EnvironmentSystemConfigRepository.builder().build(),
        FileSystemConfigRepository.builder().build(),
        EtcdSystemConfigRepository.builder().fromEnvironment().build());
  }
}
