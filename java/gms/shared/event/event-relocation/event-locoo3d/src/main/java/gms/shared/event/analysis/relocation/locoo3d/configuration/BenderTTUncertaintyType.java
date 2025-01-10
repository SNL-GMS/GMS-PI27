package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Properties;

/**
 * Enumeration class containing the BenderTTUncertaintyType corresponding to LocOo3dBenderSettings
 */
public enum BenderTTUncertaintyType implements PropertiesSetter {
  DISTANCE_DEPENDENT,
  SOURCE_DEPENDENT;

  private final String label;

  /** Construct an uncertainty type whose label matches the enum. */
  BenderTTUncertaintyType() {
    this.label = this.name();
  }

  /**
   * Returns the {@link String} label corresponding to the enum type
   *
   * @return the associated {@link String} label corresponding to the enum type
   */
  @JsonValue
  public String getLabel() {
    return label;
  }

  /** {@inheritDoc} */
  @Override
  public Properties setProperties(Properties properties) {
    properties.setProperty("benderUncertaintyType", label);
    return properties;
  }
}
