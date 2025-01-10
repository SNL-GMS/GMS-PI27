package gms.shared.stationdefinition.configuration;

import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class EventBeamConfiguration {

  public String beamPhaseConfig = "station-definition-manager.event-beam-configuration";

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  @Autowired
  public EventBeamConfiguration(ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  /**
   * Retrieves the {@link PhaseTypesByBeamDescriptions} configuration
   *
   * @return Populated {@link PhaseTypesByBeamDescriptions} object
   */
  public PhaseTypesByBeamDescriptions getPhaseTypesByBeamDescriptions() {
    return configurationConsumerUtility.resolve(
        beamPhaseConfig, List.of(), PhaseTypesByBeamDescriptions.class);
  }
}
