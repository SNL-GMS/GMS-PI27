package gms.shared.stationdefinition.coi.filter;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.google.common.collect.ImmutableList;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import java.time.Instant;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class AutoregressiveFilterParametersTest {

  public static final String SAMPLE_RATE_ERRMSG = "sampleRateHz must be greater than 0";
  public static final String SAMPLE_RATE_TOLERANCE_ERRMSG =
      "sampleRateToleranceHz must be greater than or equal to 0";
  public static final String COEFFICIENTS_ERROR_MSG = "coefficients must exist";

  public static final ChannelSegmentDescriptor CSD =
      ChannelSegmentDescriptor.from(
          Channel.builder().setName("test").autoBuild(), Instant.MIN, Instant.MAX, Instant.EPOCH);

  @ParameterizedTest
  @MethodSource("testAutoregressiveFilterParametersArguments")
  void testAutoregressiveFilterParameters(
      double sampleRateHz,
      double sampleRateToleranceHz,
      ImmutableList<Double> coefficients,
      ChannelSegmentDescriptor noiseWindow,
      String expectedErrorMessage) {

    var actualErrorMessage =
        Assertions.assertThrows(
            IllegalArgumentException.class,
            () ->
                AutoregressiveFilterParameters.from(
                    sampleRateHz, sampleRateToleranceHz, coefficients, noiseWindow));

    Assertions.assertEquals(expectedErrorMessage, actualErrorMessage.getMessage());
  }

  private static Stream<Arguments> testAutoregressiveFilterParametersArguments() {
    return Stream.of(
        arguments(
            // Below Value Under Test
            -2.0, 1.0, ImmutableList.of(), CSD, SAMPLE_RATE_ERRMSG),
        arguments(
            1.0,
            // Below Value Under Test
            -1.0,
            ImmutableList.of(),
            CSD,
            SAMPLE_RATE_TOLERANCE_ERRMSG),
        arguments(
            1.0,
            1.0,
            // Below Value Under Test
            ImmutableList.of(),
            CSD,
            COEFFICIENTS_ERROR_MSG));
  }
}
