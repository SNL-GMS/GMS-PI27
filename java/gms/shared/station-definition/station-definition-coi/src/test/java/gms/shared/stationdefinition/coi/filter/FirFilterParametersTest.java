package gms.shared.stationdefinition.coi.filter;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.google.common.collect.ImmutableList;
import java.time.Duration;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FirFilterParametersTest {

  @Test
  void testFirFilterParametersInputsSuccessful() {
    Assertions.assertDoesNotThrow(
        () -> FirFilterParameters.from(1, 1, Duration.ofNanos(1), ImmutableList.of(3.14)));
  }

  private static Stream<Arguments> testFirFilterParametersArguments() {
    return Stream.of(
        arguments(
            -1,
            -1,
            Duration.ofNanos(-1),
            ImmutableList.of(),
            "sampleRateHz must be greater than 0"),
        arguments(
            1,
            -1,
            Duration.ofNanos(-1),
            ImmutableList.of(),
            "sampleRateToleranceHz must be greater than or equal to 0"),
        arguments(
            1,
            1,
            Duration.ofNanos(-1),
            ImmutableList.of(),
            "getGroupDelaySec must be greater than or equal to 0"),
        arguments(
            1,
            1,
            Duration.ofSeconds(1),
            ImmutableList.of(),
            "transferFunctionBCoefficients must contain elements"));
  }

  @ParameterizedTest
  @MethodSource("testFirFilterParametersArguments")
  void testFirFilterParameters(
      double sampleRateHz,
      double sampleRateToleranceHz,
      Duration groupDelaySec,
      ImmutableList<Double> transferFunctionBCoefficients,
      String expectedErrorMsg) {

    var msg =
        Assertions.assertThrows(
            IllegalArgumentException.class,
            () ->
                FirFilterParameters.from(
                    sampleRateHz,
                    sampleRateToleranceHz,
                    groupDelaySec,
                    transferFunctionBCoefficients));
    Assertions.assertEquals(expectedErrorMsg, msg.getMessage());
  }
}
