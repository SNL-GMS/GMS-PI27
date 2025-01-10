package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.stationdefinition.coi.utils.Units;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;
import java.util.stream.Stream;

public final class DefaultMeasurementValueSpecVisitor<V> implements MeasurementValueSpecVisitor<V> {

  private static final int INTERMEDIARY_SCALE = 10;
  private static final int FINAL_SCALE = 2;

  private DefaultMeasurementValueSpecVisitor() {
    // Hide implicit public constructor
  }

  public static <V> DefaultMeasurementValueSpecVisitor<V> create() {
    return new DefaultMeasurementValueSpecVisitor<>();
  }

  // ------------------------------------------
  // ArrivalDao measurement value spec visitors
  // ------------------------------------------
  @Override
  public Stream<MeasurementValueSpec<V>> visit(
      ArrivalTimeMeasurementValueSpecAcceptor spec,
      FeatureMeasurementType<V> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao) {
    return Stream.of(
        MeasurementValueSpec.<V>builder()
            .setArrivalDao(arrivalDao)
            .setFeatureMeasurementType(type)
            .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(
      EmergenceAngleMeasurementValueSpecAcceptor spec,
      FeatureMeasurementType<V> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao) {
    return Stream.of(
        MeasurementValueSpec.<V>builder()
            .setArrivalDao(arrivalDao)
            .setFeatureMeasurementType(type)
            .setMeasuredValueExtractor(ArrivalDao::getEmergenceAngle)
            .setUnits(Units.DEGREES)
            .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(
      FirstMotionMeasurementValueSpecAcceptor spec,
      FeatureMeasurementType<V> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao) {
    return arrivalDao
        .getFirstMotion()
        .chars()
        .mapToObj(
            code ->
                MeasurementValueSpec.<V>builder()
                    .setArrivalDao(arrivalDao)
                    .setFeatureMeasurementType(type)
                    .setFeatureMeasurementTypeCode(Character.toString(code))
                    .build())
        .toList()
        .stream();
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(
      PhaseTypeMeasurementValueSpecAcceptor spec,
      FeatureMeasurementType<V> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao) {
    return Stream.of(
        MeasurementValueSpec.<V>builder()
            .setArrivalDao(arrivalDao)
            .setAssocDao(assocDao)
            .setFeatureMeasurementType(type)
            .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(
      ReceiverToSourceAzimuthMeasurementValueSpecAcceptor spec,
      FeatureMeasurementType<V> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao) {
    return Stream.of(
        MeasurementValueSpec.<V>builder()
            .setArrivalDao(arrivalDao)
            .setFeatureMeasurementType(type)
            .setMeasuredValueExtractor(ArrivalDao::getAzimuth)
            .setUncertaintyValueExtractor(ArrivalDao::getAzimuthUncertainty)
            .setUnits(Units.DEGREES)
            .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(
      RectilinearityMeasurementValueSpecAcceptor spec,
      FeatureMeasurementType<V> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao) {
    return Stream.of(
        MeasurementValueSpec.<V>builder()
            .setArrivalDao(arrivalDao)
            .setFeatureMeasurementType(type)
            .setMeasuredValueExtractor(ArrivalDao::getRectilinearity)
            .setUnits(Units.UNITLESS)
            .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(
      SlownessMeasurementValueSpecAcceptor spec,
      FeatureMeasurementType<V> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao) {
    return Stream.of(
        MeasurementValueSpec.<V>builder()
            .setArrivalDao(arrivalDao)
            .setFeatureMeasurementType(type)
            .setMeasuredValueExtractor(ArrivalDao::getSlowness)
            .setUncertaintyValueExtractor(
                arrivalObject ->
                    BigDecimal.valueOf(arrivalObject.getSlownessUncertainty())
                        .setScale(INTERMEDIARY_SCALE, RoundingMode.HALF_UP)
                        .setScale(FINAL_SCALE, RoundingMode.HALF_UP)
                        .doubleValue())
            .setUnits(Units.SECONDS_PER_DEGREE)
            .build());
  }

  @Override
  public Stream<MeasurementValueSpec<V>> visit(
      AmplitudeMeasurementValueSpecAcceptor spec,
      FeatureMeasurementType<V> type,
      ArrivalDao arrivalDao,
      Optional<AmplitudeDao> amplitudeDao) {
    return Stream.of(
        (MeasurementValueSpec.<V>builder()
            .setArrivalDao(arrivalDao)
            .setAmplitudeDao(amplitudeDao)
            .setFeatureMeasurementType(type)
            .build()));
  }
}
