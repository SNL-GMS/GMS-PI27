package gms.shared.event.analysis.relocation.locoo3d.configuration;

import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

// This resolver will use the config consumer utility to resolve actual configurations
@Component
public class LocOo3dConfigurationResolver {
  private final ConfigurationConsumerUtility configurationConsumerUtility;
  private final String locOo3dSettingsForLocOo3dConfig;

  @Autowired
  public LocOo3dConfigurationResolver(
      ConfigurationConsumerUtility configurationConsumerUtility,
      @Value("${locOo3dSettingsForLocOo3dConfig}") String locOo3dSettingsForLocOo3dConfig) {
    this.locOo3dSettingsForLocOo3dConfig = locOo3dSettingsForLocOo3dConfig;
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  /**
   * Retrieves configured locoOo3d settings if such configuration exists
   *
   * @return LocoOo3d settings from the configuration and transform it into @link LocOo3dSettings}
   *     settings.
   */
  public LocOo3dSettings getLocOo3dSettings() {
    return configurationConsumerUtility.resolve(
        locOo3dSettingsForLocOo3dConfig, List.of(), LocOo3dSettings.class);
  }
}
