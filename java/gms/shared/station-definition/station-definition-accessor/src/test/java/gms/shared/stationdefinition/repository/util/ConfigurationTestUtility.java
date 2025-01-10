package gms.shared.stationdefinition.repository.util;

import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;

/** Configuration test utility for testing configuration consumer utility */
public class ConfigurationTestUtility {

  private static final String NAME_SELECTOR = "name";

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  public ConfigurationTestUtility(ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;
  }
}
