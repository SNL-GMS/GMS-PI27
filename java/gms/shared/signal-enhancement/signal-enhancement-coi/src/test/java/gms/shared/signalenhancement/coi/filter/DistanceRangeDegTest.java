package gms.shared.signalenhancement.coi.filter;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.utilities.test.JsonTestUtilities;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class DistanceRangeDegTest {

  @ParameterizedTest
  @MethodSource("getDistanceRangeErrorDegArguments")
  void testDistanceRangeDegErrors(double min, double max) {

    assertThrows(IllegalArgumentException.class, () -> new DistanceRangeDeg(min, max));
  }

  static Stream<Arguments> getDistanceRangeErrorDegArguments() {
    return Stream.of(
        arguments(-1, 50),
        arguments(190, 50),
        arguments(5, 0),
        arguments(5, 190),
        arguments(50, 2));
  }

  @Test
  void testCreateAndSerializeDistanceRangeDegRecord() {
    var distanceRangeDeg = new DistanceRangeDeg(0, 50);
    JsonTestUtilities.assertSerializes(distanceRangeDeg, DistanceRangeDeg.class);
  }
}
