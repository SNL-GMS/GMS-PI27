package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.values.FirstMotionMeasurementValue;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import java.util.Optional;
import java.util.stream.Stream;

public final class FirstMotionMeasurementValueSpecAcceptor
    implements MeasurementValueSpecAcceptor<FirstMotionMeasurementValue> {
  private FirstMotionMeasurementValueSpecAcceptor() {}

  public static FirstMotionMeasurementValueSpecAcceptor create() {
    return new FirstMotionMeasurementValueSpecAcceptor();
  }

  @Override
  public Stream<MeasurementValueSpec<FirstMotionMeasurementValue>> accept(
      MeasurementValueSpecVisitor<FirstMotionMeasurementValue> visitor,
      FeatureMeasurementType<FirstMotionMeasurementValue> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao,
      Optional<AmplitudeDao> amplitudeDao) {
    return visitor.visit(this, type, arrivalDao, assocDao);
  }
}
