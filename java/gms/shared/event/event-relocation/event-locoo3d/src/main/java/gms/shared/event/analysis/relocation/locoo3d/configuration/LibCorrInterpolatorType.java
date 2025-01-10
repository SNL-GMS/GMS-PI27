package gms.shared.event.analysis.relocation.locoo3d.configuration;

import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Properties;

/** Construct the interpolator type whose label matches the enum. */
public enum LibCorrInterpolatorType {
  LINEAR,
  NATURAL_NEIGHBOR;

  private final String label;

  /** Construct a interpolator type whose label matches the enum. */
  LibCorrInterpolatorType() {
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

  /**
   * Return the properties {@link Properties} for {@link LibCorrInterpolatorType} label
   *
   * @param predictor the {@link String} predictor that sets the type of horizontal interpolator
   *     property
   * @param properties the {@link Properties} to be set for a new label
   * @return the modified {@link Properties} label corresponding to the enum type
   */
  public Properties setProperties(String predictor, Properties properties) {
    properties.setProperty(predictor + "LibCorrInterpolatorTypeHorizontal", label);
    return properties;
  }
}
