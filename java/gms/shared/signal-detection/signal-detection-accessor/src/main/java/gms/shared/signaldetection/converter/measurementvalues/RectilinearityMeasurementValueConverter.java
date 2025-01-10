package gms.shared.signaldetection.converter.measurementvalues;

import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import java.util.Optional;

public final class RectilinearityMeasurementValueConverter
    implements MeasurementValueConverter<NumericMeasurementValue> {

  private RectilinearityMeasurementValueConverter() {
    // Hide implicit public constructor
  }

  public static RectilinearityMeasurementValueConverter create() {
    return new RectilinearityMeasurementValueConverter();
  }

  @Override
  public Optional<NumericMeasurementValue> convert(
      MeasurementValueSpec<NumericMeasurementValue> spec) {
    return NumericMeasurementValueConverter.create().convert(spec);
  }
}
