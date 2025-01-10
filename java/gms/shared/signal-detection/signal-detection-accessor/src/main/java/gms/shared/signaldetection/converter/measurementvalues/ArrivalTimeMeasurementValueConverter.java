package gms.shared.signaldetection.converter.measurementvalues;

import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.Optional;

public final class ArrivalTimeMeasurementValueConverter
    implements MeasurementValueConverter<ArrivalTimeMeasurementValue> {

  private static final int MILLI_CONVERSTION_VALUE = 1000;

  private ArrivalTimeMeasurementValueConverter() {
    // Hide implicit public constructor
  }

  public static ArrivalTimeMeasurementValueConverter create() {
    return new ArrivalTimeMeasurementValueConverter();
  }

  @Override
  public Optional<ArrivalTimeMeasurementValue> convert(
      MeasurementValueSpec<ArrivalTimeMeasurementValue> spec) {
    var arrivalDao = spec.getArrivalDao();

    var arrivalTimeUncertainty = arrivalDao.getTimeUncertainty();

    // if the Uncertainty is -1 that means is it NULL from the database and therefor
    // should be null, otherwise convert to millis
    if (BigDecimal.valueOf(arrivalTimeUncertainty).intValue() != -1) {
      var uncertainty =
          Duration.ofMillis((long) (arrivalDao.getTimeUncertainty() * MILLI_CONVERSTION_VALUE));
      return Optional.of(
          ArrivalTimeMeasurementValue.fromFeatureMeasurement(
              InstantValue.from(arrivalDao.getArrivalKey().getTime(), uncertainty)));
    }

    return Optional.of(
        ArrivalTimeMeasurementValue.fromFeatureMeasurement(
            InstantValue.from(arrivalDao.getArrivalKey().getTime())));
  }
}
