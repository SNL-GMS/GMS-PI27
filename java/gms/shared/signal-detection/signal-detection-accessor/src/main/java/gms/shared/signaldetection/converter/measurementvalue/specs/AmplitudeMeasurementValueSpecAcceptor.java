package gms.shared.signaldetection.converter.measurementvalue.specs;

import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import java.util.Optional;
import java.util.stream.Stream;

public final class AmplitudeMeasurementValueSpecAcceptor
    implements MeasurementValueSpecAcceptor<AmplitudeMeasurementValue> {

  private AmplitudeMeasurementValueSpecAcceptor() {
    // Hide implicit public constructor
  }

  public static AmplitudeMeasurementValueSpecAcceptor create() {
    return new AmplitudeMeasurementValueSpecAcceptor();
  }

  @Override
  public Stream<MeasurementValueSpec<AmplitudeMeasurementValue>> accept(
      MeasurementValueSpecVisitor<AmplitudeMeasurementValue> visitor,
      FeatureMeasurementType<AmplitudeMeasurementValue> type,
      ArrivalDao arrivalDao,
      Optional<AssocDao> assocDao,
      Optional<AmplitudeDao> amplitudeDao) {

    return visitor.visit(this, type, arrivalDao, amplitudeDao);
  }
}
