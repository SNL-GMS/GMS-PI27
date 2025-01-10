package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Properties;

/** Construct an uncertainty type whose label matches the enum. */
public enum RSTTTTUncertaintyType implements PropertiesSetter {
  DISTANCE_DEPENDENT,
  PATH_DEPENDENT;

  private final String label;

  /** Construct an uncertainty type whose label matches the enum. */
  RSTTTTUncertaintyType() {
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
    properties.setProperty("slbmUncertaintyType", label);
    return properties;
  }
}
