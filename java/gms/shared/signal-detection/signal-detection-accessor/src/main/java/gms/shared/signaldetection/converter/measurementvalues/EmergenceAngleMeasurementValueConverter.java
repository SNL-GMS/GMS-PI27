package gms.shared.signaldetection.converter.measurementvalues;

import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import java.util.Optional;

public final class EmergenceAngleMeasurementValueConverter
    implements MeasurementValueConverter<NumericMeasurementValue> {

  private EmergenceAngleMeasurementValueConverter() {
    // Hide implicit public constructor
  }

  public static EmergenceAngleMeasurementValueConverter create() {
    return new EmergenceAngleMeasurementValueConverter();
  }

  @Override
  public Optional<NumericMeasurementValue> convert(
      MeasurementValueSpec<NumericMeasurementValue> measurementValueSpec) {
    return NumericMeasurementValueConverter.create().convert(measurementValueSpec);
  }
}
