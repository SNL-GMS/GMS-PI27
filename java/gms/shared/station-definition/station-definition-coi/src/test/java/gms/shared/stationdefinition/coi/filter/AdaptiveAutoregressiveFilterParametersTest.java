package gms.shared.stationdefinition.coi.filter;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class AdaptiveAutoregressiveFilterParametersTest {

  public static final String SAMPLE_RATE_ERRMSG = "sampleRateHz must be greater than 0";
  public static final String SAMPLE_RATE_TOLERANCE_ERRMSG =
      "sampleRateToleranceHz must be greater than or equal to 0";

  @ParameterizedTest
  @MethodSource("testAdaptiveAutoregressiveFilterParametersArguments")
  void testAdaptiveAutoregressiveFilterParameters(
      double sampleRateHz, double sampleRateToleranceHz, String expectedErrorMessage) {

    var actualErrorMessage =
        Assertions.assertThrows(
            IllegalArgumentException.class,
            () -> AdaptiveAutoregressiveFilterParameters.from(sampleRateHz, sampleRateToleranceHz));

    Assertions.assertEquals(expectedErrorMessage, actualErrorMessage.getMessage());
  }

  private static Stream<Arguments> testAdaptiveAutoregressiveFilterParametersArguments() {
    return Stream.of(
        arguments(
            // Below Value Under Test
            -2.0, 1.0, SAMPLE_RATE_ERRMSG),
        arguments(
            1.0,
            // Below Value Under Test
            -1.0,
            SAMPLE_RATE_TOLERANCE_ERRMSG));
  }
}
