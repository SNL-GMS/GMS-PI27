package gms.shared.event.analysis.relocation.locoo3d.configuration;

import java.util.Properties;

/**
 * Contains information needed for the 3d RSTT settings.
 *
 * @param model - model name corresponding to the 3d/2d lookup settings
 * @param chMax - provides the maximun ch for this particular setting.
 * @param depthMax - provides the maximun depth for this particular setting.
 * @param distanceMax - provides the maximun distance for this particular setting.
 * @param ttModelUncertaintyScale - denotes the uncertainty scale to be used in the tt model.
 * @param ttModelUncertaintyOffset - denotes the uncertainty offset to be used in the tt model.
 * @param azSloUncertaintyFile - location for azimuth/slow uncertainty file.
 * @param ttUncertaintyType - enumeration type corresponding to {@link RSTTTTUncertaintyType}.
 */
public record LocOo3dRSTTSettings(
    String model,
    double chMax,
    double depthMax,
    double distanceMax,
    double ttModelUncertaintyScale,
    double ttModelUncertaintyOffset,
    String azSloUncertaintyFile,
    RSTTTTUncertaintyType ttUncertaintyType)
    implements PropertiesSetter {

  /** {@inheritDoc} */
  @Override
  public Properties setProperties(Properties properties) {
    properties.setProperty("slbmModel", model);
    properties.setProperty("slbm_ch_max", Double.toString(chMax));
    properties.setProperty("slbm_max_depth", Double.toString(depthMax));
    properties.setProperty("slbm_max_distance", Double.toString(distanceMax));
    properties.setProperty(
        "slbmTTModelUncertaintyScale",
        Double.toString(ttModelUncertaintyScale)
            + ", "
            + Double.toString(ttModelUncertaintyOffset));
    properties.setProperty("rsttAzSloUncertaintyFile", azSloUncertaintyFile);
    ttUncertaintyType.setProperties(properties);
    return properties;
  }
}
