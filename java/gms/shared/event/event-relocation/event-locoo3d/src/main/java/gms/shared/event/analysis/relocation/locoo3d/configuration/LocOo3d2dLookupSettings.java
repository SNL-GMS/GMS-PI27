package gms.shared.event.analysis.relocation.locoo3d.configuration;

import java.util.Properties;

/**
 * Contains information needed for the 3d/2d lookup settings.
 *
 * @param model - model name corresponding to the 3d/2d lookup settings
 * @param seismicBaseData - location for the seismic data base location.
 * @param maxIterationCount - maximun iteration count corresponding to the obtained corrections.
 * @param useEllipticityCorrections - asserts wether or not the elliptic corrections will need to be
 *     used.
 * @param useElevationCorrections - asserts wether or not the elevation corrections will need to be
 *     used.
 * @param sedimentaryVeloctiyP - denotes the velocity in the P direction.
 * @param sedimentaryVelocityS - denotes the velocity in the S direction.
 * @param ttModelUncertaintyScale - denotes the uncertainty scale to be used in the tt model.
 * @param ttModelUncertaintyOffset - denotes the uncertainty offset to be used in the tt model.
 * @param azSloUncertaintyFile - location for azimuth/slow uncertainty file.
 */
public record LocOo3d2dLookupSettings(
    String model,
    String seismicBaseData,
    int maxIterationCount,
    boolean useEllipticityCorrections,
    boolean useElevationCorrections,
    double sedimentaryVeloctiyP,
    double sedimentaryVelocityS,
    double ttModelUncertaintyScale,
    double ttModelUncertaintyOffset,
    String azSloUncertaintyFile)
    implements PropertiesSetter {

  /** {@inheritDoc} */
  @Override
  public Properties setProperties(Properties properties) {
    properties.setProperty("lookup2dModel", model);
    properties.setProperty("lookup2dTableDirectory", seismicBaseData);
    properties.setProperty("lsq_max_iterations", Integer.toString(maxIterationCount));
    properties.setProperty(
        "lookup2dUseEllipticityCorrections", Boolean.toString(useEllipticityCorrections));
    properties.setProperty(
        "lookup2dUseElevationCorrections", Boolean.toString(useElevationCorrections));
    properties.setProperty("lookup2dSedmentaryVelocityP", Double.toString(sedimentaryVeloctiyP));
    properties.setProperty("lookup2dSedimentaryvelocityS", Double.toString(sedimentaryVelocityS));
    properties.setProperty(
        "lookup2dTTUncertaintyScale",
        Double.toString(ttModelUncertaintyScale)
            + ", "
            + Double.toString(ttModelUncertaintyOffset));

    properties.setProperty("lookup2dAzSloUncertaintyFile", azSloUncertaintyFile);

    return properties;
  }
}
