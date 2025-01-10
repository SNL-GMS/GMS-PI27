package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import java.util.Optional;
import java.util.stream.Stream;

public final class RectilinearityMeasurementValueSpecAcceptor
    implements MeasurementValueSpecAcceptor<NumericMeasurementValue> {

  private RectilinearityMeasurementValueSpecAcceptor() {
    // Hide implicit public constructor
  }

  public static RectilinearityMeasurementValueSpecAcceptor create() {
    return new RectilinearityMeasurementValueSpecAcceptor();
  }

  @Override
  public Stream<MeasurementValueSpec<NumericMeasurementValue>> accept(
      MeasurementValueSpecVisitor<NumericMeasurementValue> visitor,
      FeatureMeasurementType<NumericMeasurementValue> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao,
      Optional<AmplitudeDao> amplitudeDao) {
    return visitor.visit(this, type, arrivalDao, assocDao);
  }
}
