package gms.shared.stationdefinition.coi.filter;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.google.common.collect.ImmutableList;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.filter.types.AutoregressiveFilterType;
import gms.shared.stationdefinition.coi.filter.types.AutoregressiveType;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class AutoregressiveFilterDescriptionTest {

  public static final AdaptiveAutoregressiveFilterParameters ADAPTIVE_AR_FILTER_PARAMETERS =
      AdaptiveAutoregressiveFilterParameters.from(1.0, 1.0);

  public static final ImmutableList<Double> AR_DOUBLE_LIST =
      ImmutableList.copyOf(List.of(1.0, 2.0));
  public static final ChannelSegmentDescriptor CSD =
      ChannelSegmentDescriptor.from(
          Channel.builder().setName("test").autoBuild(), Instant.MIN, Instant.MAX, Instant.EPOCH);
  public static final AutoregressiveFilterParameters AR_FILTER_PARAMETERS =
      AutoregressiveFilterParameters.from(2.0, 2.0, AR_DOUBLE_LIST, CSD);

  @Test
  void testSerializationAutoregressiveFilterNoParametersDescription() {
    var toSerializeOne =
        AutoregressiveFilterDescription.from(
            Optional.empty(),
            Optional.empty(),
            true,
            false,
            AutoregressiveFilterType.NON_ADAPTIVE,
            AutoregressiveType.N_SQUARED,
            Duration.ofSeconds(1),
            Duration.ofSeconds(0),
            1,
            Optional.empty(),
            Optional.of(Duration.ofSeconds(1)),
            Duration.ofSeconds(1));

    JsonTestUtilities.assertSerializes(toSerializeOne, AutoregressiveFilterDescription.class);
  }

  @Test
  void testSerializationAutoregressiveFilterDescriptionAdaptiveParameter() {

    var toSerializeTwo =
        AutoregressiveFilterDescription.from(
            Optional.empty(),
            Optional.empty(),
            true,
            true,
            AutoregressiveFilterType.ADAPTIVE,
            AutoregressiveType.N_SQUARED,
            Duration.ofSeconds(1),
            Duration.ofSeconds(0),
            1,
            Optional.of(ADAPTIVE_AR_FILTER_PARAMETERS),
            Optional.empty(),
            Duration.ofSeconds(1));

    JsonTestUtilities.assertSerializes(toSerializeTwo, AutoregressiveFilterDescription.class);
  }

  @Test
  void testSerializationAutoregressiveFilterDescriptionAutoregressiveParameter() {
    var toSerializeThree =
        AutoregressiveFilterDescription.from(
            Optional.empty(),
            Optional.empty(),
            true,
            false,
            AutoregressiveFilterType.NON_ADAPTIVE,
            AutoregressiveType.N_SQUARED,
            Duration.ofSeconds(1),
            Duration.ofSeconds(0),
            1,
            Optional.of(AR_FILTER_PARAMETERS),
            Optional.of(Duration.ofSeconds(1)),
            Duration.ofSeconds(1));

    JsonTestUtilities.assertSerializes(toSerializeThree, AutoregressiveFilterDescription.class);
  }

  private static Stream<Arguments> testAutoregressiveFilterDescriptionArguments() {
    return Stream.of(
        arguments(
            Optional.of("comment"),
            // Below Value Under Test
            Optional.empty(),
            false,
            true,
            AutoregressiveFilterType.ADAPTIVE,
            AutoregressiveType.N,
            Duration.ofSeconds(-5),
            Duration.ofSeconds(-6),
            -1,
            Optional.empty(),
            Optional.empty(),
            Duration.ofSeconds(-8),
            "causal must be true"),
        arguments(
            Optional.of("comment"),
            Optional.empty(),
            true,
            false,
            AutoregressiveFilterType.ADAPTIVE,
            AutoregressiveType.N,
            Duration.ofSeconds(1),
            Duration.ofSeconds(1),
            // Below Value Under Test
            -1,
            Optional.empty(),
            Optional.of(Duration.ofSeconds(1)),
            Duration.ofSeconds(1),
            "order value must be positive"),
        arguments(
            Optional.empty(),
            Optional.empty(),
            true,
            true,
            AutoregressiveFilterType.ADAPTIVE,
            AutoregressiveType.N_SQUARED,
            // Below Value Under Test
            Duration.ofSeconds(0),
            Duration.ofSeconds(1),
            1,
            Optional.empty(),
            Optional.empty(),
            Duration.ofSeconds(1),
            greaterThanErrorString("noiseWindowDuration")),
        arguments(
            Optional.empty(),
            Optional.empty(),
            true,
            false,
            AutoregressiveFilterType.ADAPTIVE,
            AutoregressiveType.N_SQUARED,
            Duration.ofSeconds(1),
            // Below Value Under Test
            Duration.ofSeconds(-9),
            1,
            Optional.empty(),
            Optional.of(Duration.ofSeconds(1)),
            Duration.ofSeconds(1),
            greaterThanEqualErrorString("noiseWindowOffset")),
        arguments(
            Optional.empty(),
            Optional.empty(),
            true,
            true,
            AutoregressiveFilterType.ADAPTIVE,
            AutoregressiveType.N_SQUARED,
            Duration.ofSeconds(1),
            Duration.ofSeconds(0),
            1,
            Optional.empty(),
            // Below Value Under Test
            Optional.of(Duration.ofSeconds(0)),
            Duration.ofSeconds(0),
            "signalWindowDuration must NOT be populated when adaptive is true"),
        arguments(
            Optional.empty(),
            Optional.empty(),
            true,
            false,
            AutoregressiveFilterType.NON_ADAPTIVE,
            AutoregressiveType.N_SQUARED,
            Duration.ofSeconds(1),
            Duration.ofSeconds(1),
            1,
            Optional.empty(),
            // Below Value Under Test
            Optional.of(Duration.ofSeconds(0)),
            Duration.ofSeconds(1),
            greaterThanErrorString("signalWindowDuration")),
        arguments(
            Optional.empty(),
            Optional.empty(),
            true,
            false,
            AutoregressiveFilterType.ADAPTIVE,
            AutoregressiveType.N_SQUARED,
            Duration.ofSeconds(1),
            Duration.ofSeconds(0),
            1,
            Optional.empty(),
            Optional.of(Duration.ofSeconds(1)),
            // Below Value Under Test
            Duration.ofSeconds(-10),
            greaterThanEqualErrorString("signalWindowOffset")),
        arguments(
            Optional.empty(),
            Optional.empty(),
            true,
            true,
            AutoregressiveFilterType.ADAPTIVE,
            AutoregressiveType.N_SQUARED,
            Duration.ofSeconds(1),
            Duration.ofSeconds(0),
            1,
            // Below Value Under Test
            Optional.of(AR_FILTER_PARAMETERS),
            Optional.empty(),
            Duration.ofSeconds(1),
            "Parameter must be of type AdaptiveAutoregressiveFilterParameters when adaptive is"
                + " true"),
        arguments(
            Optional.empty(),
            Optional.empty(),
            true,
            false,
            AutoregressiveFilterType.ADAPTIVE,
            AutoregressiveType.N_SQUARED,
            Duration.ofSeconds(1),
            Duration.ofSeconds(0),
            1,
            // Below Value Under Test
            Optional.of(ADAPTIVE_AR_FILTER_PARAMETERS),
            Optional.of(Duration.ofSeconds(1)),
            Duration.ofSeconds(1),
            "Parameter must be of type AutoregressiveFilterParameters when adaptive is false"));
  }

  @ParameterizedTest
  @MethodSource("testAutoregressiveFilterDescriptionArguments")
  void testAutoregressiveFilterDescription(
      Optional<String> comments,
      Optional<FrequencyAmplitudePhase> response,
      boolean causal,
      boolean adaptive,
      AutoregressiveFilterType autoregressiveFilterType,
      AutoregressiveType autoregressiveType,
      Duration noiseWindowDuration,
      Duration noiseWindowOffset,
      int order,
      Optional<BaseAutoregressiveFilterParameters> parameters,
      Optional<Duration> signalWindowDuration,
      Duration signalWindowOffset,
      String expectedErrorMsg) {

    var msg =
        Assertions.assertThrows(
            IllegalArgumentException.class,
            () ->
                AutoregressiveFilterDescription.from(
                    comments,
                    response,
                    causal,
                    adaptive,
                    autoregressiveFilterType,
                    autoregressiveType,
                    noiseWindowDuration,
                    noiseWindowOffset,
                    order,
                    parameters,
                    signalWindowDuration,
                    signalWindowOffset));
    Assertions.assertEquals(expectedErrorMsg, msg.getMessage());
  }

  private static String greaterThanErrorString(String valueName) {
    return "Duration value " + valueName + " must be greater than 0";
  }

  private static String greaterThanEqualErrorString(String valueName) {
    return "Duration value " + valueName + " must be greater than or equal to 0";
  }
}
