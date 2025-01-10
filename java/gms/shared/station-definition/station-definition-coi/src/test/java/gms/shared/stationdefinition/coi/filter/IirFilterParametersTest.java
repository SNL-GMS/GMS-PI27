package gms.shared.stationdefinition.coi.filter;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import java.time.Duration;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class IiRFilterParametersTest {

  @Test
  void testIirFilterParametersInputsSuccessful() {
    var sharedList = List.of(3.14, 6.28, 12.56);
    Assertions.assertDoesNotThrow(
        () -> IirFilterParameters.from(1, 1, Duration.ofNanos(1), sharedList, sharedList));
  }

  private static Stream<Arguments> testIirFilterParametersArguments() {
    return Stream.of(
        arguments(
            -1,
            1,
            Duration.ofNanos(1),
            List.of(),
            List.of(),
            "sampleRateHz must be greater than 0"),
        arguments(
            1,
            -1,
            Duration.ofNanos(1),
            List.of(1.1, 2.2, 3.3),
            List.of(2.2, 3.3, 4.4),
            "sampleRateToleranceHz must be greater than or equal to 0"),
        arguments(
            1,
            1,
            Duration.ofNanos(-1),
            List.of(1.1, 2.2, 3.3),
            List.of(2.2, 3.3, 4.4),
            "getGroupDelaySec must be greater than or equal to 0"),
        arguments(
            1,
            1,
            Duration.ofSeconds(1),
            List.of(1.1, 2.2, 3.3, 4.4),
            List.of(2.2, 3.3, 4.4),
            "sosNumeratorCoefficients must contain elements in increments of 3"),
        arguments(
            1,
            1,
            Duration.ofSeconds(1),
            List.of(1.1, 2.2, 3.3),
            List.of(2.2, 3.3, 4.4, 5.5),
            "sosDenominatorCoefficients must contain elements in increments of 3"),
        arguments(
            1,
            1,
            Duration.ofSeconds(1),
            List.of(1.1, 2.2, 3.3),
            List.of(2.2, 3.3, 4.4, 5.5, 6.6, 7.7),
            "sosNumeratorCoefficients and sosDenominatorCoefficients contain the same number of"
                + " elements"));
  }

  @ParameterizedTest
  @MethodSource("testIirFilterParametersArguments")
  void testIirFilterParameters(
      double sampleRateHz,
      double sampleRateToleranceHz,
      Duration groupDelaySec,
      List<Double> sosNumeratorCoefficients,
      List<Double> sosDenominatorCoefficients,
      String expectedErrorMsg) {

    var msg =
        Assertions.assertThrows(
            IllegalArgumentException.class,
            () ->
                IirFilterParameters.from(
                    sampleRateHz,
                    sampleRateToleranceHz,
                    groupDelaySec,
                    sosNumeratorCoefficients,
                    sosDenominatorCoefficients));
    Assertions.assertEquals(expectedErrorMsg, msg.getMessage());
  }
}
