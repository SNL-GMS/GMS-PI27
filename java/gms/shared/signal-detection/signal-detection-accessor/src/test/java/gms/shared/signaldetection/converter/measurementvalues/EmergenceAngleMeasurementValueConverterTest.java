package gms.shared.signaldetection.converter.measurementvalues;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_2;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class EmergenceAngleMeasurementValueConverterTest
    extends SignalDetectionMeasurementValueConverterTest<EmergenceAngleMeasurementValueConverter> {

  private static final NumericMeasurementValue VALUE_1 =
      NumericMeasurementValue.from(
          Optional.empty(), DoubleValue.from(37.0, Optional.empty(), Units.DEGREES));
  private static final NumericMeasurementValue VALUE_2 =
      NumericMeasurementValue.from(
          Optional.empty(), DoubleValue.from(37.0, Optional.empty(), Units.DEGREES));

  private EmergenceAngleMeasurementValueConverter converter;

  @BeforeEach
  void setup() {
    converter = EmergenceAngleMeasurementValueConverter.create();
  }

  @Test
  void testCreate() {
    EmergenceAngleMeasurementValueConverter converter =
        assertDoesNotThrow(EmergenceAngleMeasurementValueConverter::create);
    assertNotNull(converter);
  }

  @ParameterizedTest
  @MethodSource("getTestConvertArguments")
  void testConvert(
      NumericMeasurementValue expectedValue,
      MeasurementValueSpec<NumericMeasurementValue> measurementValueSpec) {

    Optional<NumericMeasurementValue> actualValue = converter.convert(measurementValueSpec);

    assertTrue(actualValue.isPresent());
    assertEquals(expectedValue, actualValue.get());
  }

  static Stream<Arguments> getTestConvertArguments() {
    MeasurementValueSpec<NumericMeasurementValue> measurementValueSpec1 =
        MeasurementValueSpec.<NumericMeasurementValue>builder()
            .setArrivalDao(ARRIVAL_1)
            .setFeatureMeasurementType(FeatureMeasurementTypes.EMERGENCE_ANGLE)
            .setMeasuredValueExtractor(Optional.of(ArrivalDao::getEmergenceAngle))
            .setUnits(Optional.of(Units.DEGREES))
            .build();
    MeasurementValueSpec<NumericMeasurementValue> measurementValueSpec2 =
        MeasurementValueSpec.<NumericMeasurementValue>builder()
            .setArrivalDao(ARRIVAL_2)
            .setFeatureMeasurementType(FeatureMeasurementTypes.EMERGENCE_ANGLE)
            .setMeasuredValueExtractor(Optional.of(ArrivalDao::getEmergenceAngle))
            .setUnits(Optional.of(Units.DEGREES))
            .build();

    return Stream.of(
        arguments(VALUE_1, measurementValueSpec1), arguments(VALUE_2, measurementValueSpec2));
  }

  @Test
  void testNullArguments() {
    testConvertNull(EmergenceAngleMeasurementValueConverter.create());
  }
}
