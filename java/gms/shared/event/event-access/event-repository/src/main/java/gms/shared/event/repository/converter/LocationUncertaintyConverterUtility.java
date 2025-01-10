package gms.shared.event.repository.converter;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.event.coi.Ellipse;
import gms.shared.event.coi.LocationUncertainty;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.OrigerrDao;
import gms.shared.event.repository.BridgedEhInformation;
import gms.shared.signaldetection.dao.css.converter.DurationToDoubleConverter;
import java.util.Set;

/** Utility class the help create {@link LocationUncertainty} objects */
public final class LocationUncertaintyConverterUtility {

  private static final DurationToDoubleConverter durationToDoubleConverter =
      new DurationToDoubleConverter();
  private static final double ALLOWABLE_DELTA = 0.01;
  private static final double NA_FLAG = -1.0;
  private static final double NA_FLAG_COV = -999.0;

  private LocationUncertaintyConverterUtility() {
    // Hide implicit public constructor
  }

  /**
   * Creates a {@link LocationUncertainty} from {@link OrigerrDao} and {@link EventControlDao}
   *
   * @param ehInfo relevant bridged event hypothesis info
   * @return {@link LocationUncertainty}
   */
  public static LocationUncertainty fromLegacyToLocationUncertainty(BridgedEhInformation ehInfo) {
    checkNotNull(ehInfo, "Bridged EventHypothesis Information must not be null");
    var origErrDao = ehInfo.getOrigerrDao();

    var locationUncertaintyBuilder = LocationUncertainty.builder().setEllipsoids(Set.of());

    setSpatialCovariances(locationUncertaintyBuilder, origErrDao);
    setTimeCovariancesAndStdError(locationUncertaintyBuilder, origErrDao);

    var confidenceEllipse = buildConfidenceEllipse(origErrDao);
    var coverageEllipse =
        ehInfo
            .getEventControlDao()
            .map(eventControlDao -> buildCoverageEllipse(origErrDao, eventControlDao));

    locationUncertaintyBuilder.addEllipse(confidenceEllipse);
    coverageEllipse.ifPresent(locationUncertaintyBuilder::addEllipse);

    return locationUncertaintyBuilder.build();
  }

  private static Ellipse buildConfidenceEllipse(OrigerrDao origErrDao) {

    var confidenceEllipseBuilder =
        Ellipse.builder()
            .setScalingFactorType(ScalingFactorType.CONFIDENCE)
            .setkWeight(0.0)
            .setConfidenceLevel(origErrDao.getConfidence());

    setConfidenceEllipseOptionals(confidenceEllipseBuilder, origErrDao);

    return confidenceEllipseBuilder.build();
  }

  private static Ellipse buildCoverageEllipse(
      OrigerrDao origErrDao, EventControlDao eventControlDao) {

    var coverageEllipseBuilder =
        Ellipse.builder()
            .setScalingFactorType(ScalingFactorType.COVERAGE)
            .setkWeight(Double.POSITIVE_INFINITY)
            .setConfidenceLevel(origErrDao.getConfidence());

    setCoverageEllipseOptionals(coverageEllipseBuilder, origErrDao, eventControlDao);

    return coverageEllipseBuilder.build();
  }

  private static boolean isValid(double value) {
    return Math.abs(value - NA_FLAG) >= ALLOWABLE_DELTA;
  }

  private static boolean isValidCov(double value) {
    return Math.abs(value - NA_FLAG_COV) >= ALLOWABLE_DELTA;
  }

  private static void setSpatialCovariances(
      LocationUncertainty.Builder locationUncertaintyBuilder, OrigerrDao origErrDao) {

    if (isValid(origErrDao.getCovarianceMatrixSxx())) {
      locationUncertaintyBuilder.setXx(origErrDao.getCovarianceMatrixSxx());
    }

    if (isValid(origErrDao.getCovarianceMatrixSxy())) {
      locationUncertaintyBuilder.setXy(origErrDao.getCovarianceMatrixSxy());
    }

    if (isValid(origErrDao.getCovarianceMatrixSxz())) {
      locationUncertaintyBuilder.setXz(origErrDao.getCovarianceMatrixSxz());
    }

    if (isValid(origErrDao.getCovarianceMatrixSyy())) {
      locationUncertaintyBuilder.setYy(origErrDao.getCovarianceMatrixSyy());
    }

    if (isValid(origErrDao.getCovarianceMatrixSyz())) {
      locationUncertaintyBuilder.setYz(origErrDao.getCovarianceMatrixSyz());
    }

    if (isValid(origErrDao.getCovarianceMatrixSzz())) {
      locationUncertaintyBuilder.setZz(origErrDao.getCovarianceMatrixSzz());
    }
  }

  private static void setTimeCovariancesAndStdError(
      LocationUncertainty.Builder locationUncertaintyBuilder, OrigerrDao origErrDao) {

    if (isValid(origErrDao.getCovarianceMatrixStx())) {
      locationUncertaintyBuilder.setXt(origErrDao.getCovarianceMatrixStx());
    }

    if (isValid(origErrDao.getCovarianceMatrixSty())) {
      locationUncertaintyBuilder.setYt(origErrDao.getCovarianceMatrixSty());
    }

    if (isValid(origErrDao.getCovarianceMatrixStz())) {
      locationUncertaintyBuilder.setZt(origErrDao.getCovarianceMatrixStz());
    }

    if (isValid(origErrDao.getCovarianceMatrixStt())) {
      locationUncertaintyBuilder.setTt(origErrDao.getCovarianceMatrixStt());
    }

    if (isValid(origErrDao.getStandardErrorOfObservations())) {
      locationUncertaintyBuilder.setStdDevOneObservation(
          origErrDao.getStandardErrorOfObservations());
    }
  }

  private static void setConfidenceEllipseOptionals(
      Ellipse.Builder confidenceEllipseBuilder, OrigerrDao origErrDao) {
    if (isValid(origErrDao.getSemiMajorAxisOfError())) {
      confidenceEllipseBuilder.setSemiMajorAxisLengthKm(origErrDao.getSemiMajorAxisOfError());
    }

    if (isValid(origErrDao.getStrikeOfSemiMajorAxis())) {
      confidenceEllipseBuilder.setSemiMajorAxisTrendDeg(origErrDao.getStrikeOfSemiMajorAxis());
    }

    if (isValid(origErrDao.getSemiMinorAxisOfError())) {
      confidenceEllipseBuilder.setSemiMinorAxisLengthKm(origErrDao.getSemiMinorAxisOfError());
    }

    if (isValid(origErrDao.getOriginTimeError())) {
      confidenceEllipseBuilder.setTimeUncertainty(
          durationToDoubleConverter.convertToEntityAttribute(origErrDao.getOriginTimeError()));
    }

    if (isValid(origErrDao.getDepthError())) {
      confidenceEllipseBuilder.setDepthUncertaintyKm(origErrDao.getDepthError());
    }
  }

  private static void setCoverageEllipseOptionals(
      Ellipse.Builder coverageEllipseBuilder,
      OrigerrDao origErrDao,
      EventControlDao eventControlDao) {

    if (isValid(origErrDao.getSemiMajorAxisOfError())
        && isValidCov(eventControlDao.getEllipseSemiaxisConversionFactor())) {
      coverageEllipseBuilder.setSemiMajorAxisLengthKm(
          origErrDao.getSemiMajorAxisOfError()
              * eventControlDao.getEllipseSemiaxisConversionFactor());
    }

    if (isValid(origErrDao.getStrikeOfSemiMajorAxis())) {
      coverageEllipseBuilder.setSemiMajorAxisTrendDeg(origErrDao.getStrikeOfSemiMajorAxis());
    }

    if (isValid(origErrDao.getSemiMinorAxisOfError())
        && isValidCov(eventControlDao.getEllipseSemiaxisConversionFactor())) {
      coverageEllipseBuilder.setSemiMinorAxisLengthKm(
          origErrDao.getSemiMinorAxisOfError()
              * eventControlDao.getEllipseSemiaxisConversionFactor());
    }

    if (isValid(origErrDao.getOriginTimeError())
        && isValidCov(eventControlDao.getEllipseDepthTimeConversionFactor())) {
      coverageEllipseBuilder.setTimeUncertainty(
          durationToDoubleConverter.convertToEntityAttribute(
              origErrDao.getOriginTimeError()
                  * eventControlDao.getEllipseDepthTimeConversionFactor()));
    }

    if (isValid(origErrDao.getDepthError())
        && isValidCov(eventControlDao.getEllipseDepthTimeConversionFactor())) {
      coverageEllipseBuilder.setDepthUncertaintyKm(
          origErrDao.getDepthError() * eventControlDao.getEllipseDepthTimeConversionFactor());
    }
  }
}
