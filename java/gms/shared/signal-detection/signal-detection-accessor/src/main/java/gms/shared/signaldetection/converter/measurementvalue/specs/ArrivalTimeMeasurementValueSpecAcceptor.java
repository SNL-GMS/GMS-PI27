package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import java.util.Optional;
import java.util.stream.Stream;

public final class ArrivalTimeMeasurementValueSpecAcceptor
    implements MeasurementValueSpecAcceptor<ArrivalTimeMeasurementValue> {

  private ArrivalTimeMeasurementValueSpecAcceptor() {
    // Hide implicit public constructor
  }

  public static ArrivalTimeMeasurementValueSpecAcceptor create() {
    return new ArrivalTimeMeasurementValueSpecAcceptor();
  }

  @Override
  public Stream<MeasurementValueSpec<ArrivalTimeMeasurementValue>> accept(
      MeasurementValueSpecVisitor<ArrivalTimeMeasurementValue> visitor,
      FeatureMeasurementType<ArrivalTimeMeasurementValue> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao,
      Optional<AmplitudeDao> amplitudeDao) {
    return visitor.visit(this, type, arrivalDao, assocDao);
  }
}
