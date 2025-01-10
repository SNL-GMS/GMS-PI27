package gms.shared.event.analysis.relocation.locoo3d.configuration;

import java.util.Properties;

/**
 * Contains information for mapping the phase interface to the model.
 *
 * @param requestedInterface - the interface type needed for the model.
 * @param modelInterface - the model name that will be remapped.
 */
public record PhaseInterfaceToModelInterfaceRemap(String requestedInterface, String modelInterface)
    implements PropertiesSetter {

  /** {@inheritDoc} */
  @Override
  public Properties setProperties(Properties properties) {
    properties.setProperty(
        "benderPhaseInterfaceToModelInterfaceRemap", requestedInterface + " " + modelInterface);
    return properties;
  }
}
