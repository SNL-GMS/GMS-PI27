package gms.shared.event.analysis.relocation.locoo3d.configuration;

import java.util.Properties;

/**
 * Contains information needed for the 3d/2d lookup settings.
 *
 * @param model - model name corresponding to the 3d bender settings
 * @param allowMohoDiffraction - asserts wether or not the the allowed moho diffraction is used.
 * @param allowCMBDiffraction - asserts wether or not the the allowed CMBD diffraction is used.
 * @param ttModelUncertaintyScale - denotes the uncertainty scale to be used in the tt model.
 * @param ttModelUncertaintyScaleOffset - denotes the uncertainty offset to be used in the tt model.
 * @param azSloUncertaintyFile - location for azimuth/slow uncertainty file.
 * @param benderUncertaintyType - enumeration type corresponding to {@link BenderTTUncertaintyType}.
 */
public record LocOo3dBenderSettings(
    String model,
    boolean allowMohoDiffraction,
    boolean allowCMBDiffraction,
    double ttModelUncertaintyScale,
    double ttModelUncertaintyScaleOffset,
    String azSloUncertaintyFile,
    BenderTTUncertaintyType benderUncertaintyType)
    implements PropertiesSetter {

  /** {@inheritDoc} */
  @Override
  public Properties setProperties(Properties properties) {
    properties.setProperty("benderModel", model);
    properties.setProperty("benderAllowMOHODiffraction", Boolean.toString(allowCMBDiffraction));
    properties.setProperty("benderAllowCMBDiffraction", Boolean.toString(allowCMBDiffraction));
    properties.setProperty(
        "benderUncertaintyModel",
        Double.toString(ttModelUncertaintyScale)
            + ", "
            + Double.toString(ttModelUncertaintyScaleOffset));
    properties.setProperty("benderAzSloUncertaintyFile", azSloUncertaintyFile);
    benderUncertaintyType.setProperties(properties);
    return properties;
  }
}
