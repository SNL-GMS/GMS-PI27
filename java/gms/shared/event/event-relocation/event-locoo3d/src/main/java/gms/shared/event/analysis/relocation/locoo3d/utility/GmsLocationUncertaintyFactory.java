package gms.shared.event.analysis.relocation.locoo3d.utility;

import gms.shared.event.analysis.LocationUncertaintyDefinition;
import gms.shared.event.coi.Ellipse;
import gms.shared.event.coi.Ellipsoid;
import gms.shared.event.coi.LocationUncertainty;
import gov.sandia.gmp.baseobjects.Source;
import gov.sandia.gmp.baseobjects.hyperellipse.HyperEllipse;
import java.util.Collection;
import java.util.Optional;

/** Utility class for calculating Location Uncertainty ellipses and ellipsoids */
final class GmsLocationUncertaintyFactory {

  private GmsLocationUncertaintyFactory() {
    // utility class
  }

  /**
   * Translates the Native LocationUncertainty information into GMS COI format.
   *
   * @param source the Native LocationUncertainty
   * @return the {@link LocationUncertainty} in GMS COI format
   * @throws IllegalArgumentException if the underlying HyperEllipse does not have an Ellipse or
   *     Ellipsoid
   */
  // TODO: Determine if we need to add apriori variance to Ellipse and Ellipsoid
  static LocationUncertainty create(
      Source source, Collection<LocationUncertaintyDefinition> ellipseParameters)
      throws IllegalArgumentException {

    // get a reference to the LocOO3D hyper-ellipse and set desired statistical parameters
    var he = source.getHyperEllipse();

    var luBuilder =
        LocationUncertainty.builder()
            // sdobs is the standard deviation of the weighted residuals, including weighted
            // residuals of all defining travel time, azimuth and slowness observation components
            .setStdDevOneObservation(source.getSdobs())
            .setXx(he.getSxx())
            .setXy(he.getSxy())
            .setXz(he.getSxz())
            .setXt(he.getStx())
            .setYy(he.getSyy())
            .setYz(he.getSyz())
            .setYt(he.getSty())
            .setZz(he.getSzz())
            .setZt(he.getStz())
            .setTt(he.getStt());

    ellipseParameters.stream().forEach(parameters -> addEllipses(luBuilder, he, parameters));

    return luBuilder.build();
  }

  /**
   * Adds an {@link Ellipse} and possibly an {@link Ellipsoid} for each set of {@link
   * EllipseParameters} from the original {@link LocationUncertaintyDefinition}
   *
   * @param luBuilder
   * @param parameters
   * @throws IllegalArgumentException if the HyperEllipse does not have an Ellipse or Ellipsoid
   */
  private static void addEllipses(
      LocationUncertainty.Builder luBuilder,
      HyperEllipse he,
      LocationUncertaintyDefinition parameters)
      throws IllegalArgumentException {

    var scalingFactorType = parameters.scalingFactorType();

    he.setK((int) (Double.isInfinite(parameters.kWeight()) ? -1.0 : parameters.kWeight()));
    he.setConfidence(parameters.confidenceLevel());
    Optional.ofNullable(parameters.aprioriStandardError()).ifPresent(he::setAprioriVariance);

    var kWeight = parameters.kWeight();

    Ellipse e2;
    try {
      var heEllipse = he.getEllipse();
      e2 =
          Ellipse.builder()
              .setSemiMajorAxisLengthKm(heEllipse.getMajaxLength())
              .setSemiMinorAxisLengthKm(heEllipse.getMinaxLength())
              .setSemiMajorAxisTrendDeg(heEllipse.getMajaxTrend())
              .setDepthUncertaintyKm(he.getSdepth())
              .setTimeUncertainty(GmsOutputConverter.durationFromSeconds(he.getStime()))
              .setScalingFactorType(scalingFactorType)
              .setConfidenceLevel(parameters.confidenceLevel())
              .setkWeight(kWeight)
              .build();
    } catch (Exception e) {
      throw new IllegalArgumentException("HyperEllipse does not contain a valid Ellipse", e);
    }

    luBuilder.addEllipse(e2);

    // should only compute the ellipsoid upon request since it is rarely used and expensive
    Ellipsoid e3;
    try {
      if (parameters.ellipsoid()) {
        e3 =
            Ellipsoid.builder()
                .setSemiMajorAxisLengthKm(he.getEllipsoid().getMajaxLength())
                .setSemiMajorAxisTrendDeg(he.getEllipsoid().getMajaxTrend())
                .setSemiMajorAxisPlungeDeg(he.getEllipsoid().getMajaxPlunge())
                .setSemiIntermediateAxisLengthKm(he.getEllipsoid().getIntaxLength())
                .setSemiIntermediateAxisTrendDeg(he.getEllipsoid().getIntaxTrend())
                .setSemiIntermediateAxisPlungeDeg(he.getEllipsoid().getIntaxPlunge())
                .setSemiMinorAxisLengthKm(he.getEllipsoid().getMinaxLength())
                .setSemiMinorAxisTrendDeg(he.getEllipsoid().getMinaxTrend())
                .setSemiMinorAxisPlungeDeg(he.getEllipsoid().getMinaxPlunge())
                .setTimeUncertainty(GmsOutputConverter.durationFromSeconds(he.getStime()))
                .setScalingFactorType(scalingFactorType)
                .setConfidenceLevel(parameters.confidenceLevel())
                .setkWeight(kWeight)
                .build();

        luBuilder.addEllipsoid(e3);
      }
    } catch (Exception e) {
      throw new IllegalArgumentException("HyperEllipse does not contain a valid Ellipsoid", e);
    }
  }
}
