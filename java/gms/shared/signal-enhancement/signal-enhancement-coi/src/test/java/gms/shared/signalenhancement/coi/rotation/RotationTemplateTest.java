package gms.shared.signalenhancement.coi.rotation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.signalenhancement.testfixtures.FkSpectraTemplateFixtures;
import gms.shared.signalenhancement.testfixtures.RotationTemplateTestFixtures;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Duration;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class RotationTemplateTest {

  @ParameterizedTest
  @MethodSource("goodInputsArguments")
  void testGoodInputs(RotationTemplate expected, RotationTemplate actual) {
    assertEquals(expected, actual);
  }

  private static Stream<Arguments> goodInputsArguments() {
    RotationTemplate actualFromChannels =
        RotationTemplate.builder()
            .setDuration(RotationTemplateTestFixtures.SEC_DURATION)
            .setInputChannels(RotationTemplateTestFixtures.INPUT_CHANNELS)
            .setLeadDuration(RotationTemplateTestFixtures.SEC_DURATION)
            .setLocationToleranceKm(RotationTemplateTestFixtures.TOLERANCE)
            .setOrientationAngleToleranceDeg(RotationTemplateTestFixtures.ANGLE)
            .setSampleRateToleranceHz(RotationTemplateTestFixtures.SAMPLE_RATE_TOLERANCE)
            .setRotationDescription(RotationTemplateTestFixtures.ROTATION_DESCRIPTION)
            .setStation(FkSpectraTemplateFixtures.ANY_STATION)
            .build();

    RotationTemplate actualFromGroup =
        RotationTemplate.builder()
            .setDuration(RotationTemplateTestFixtures.SEC_DURATION)
            .setInputChannelGroup(RotationTemplateTestFixtures.INPUT_CHANNEL_GROUP)
            .setLeadDuration(RotationTemplateTestFixtures.SEC_DURATION)
            .setLocationToleranceKm(RotationTemplateTestFixtures.TOLERANCE)
            .setOrientationAngleToleranceDeg(RotationTemplateTestFixtures.ANGLE)
            .setSampleRateToleranceHz(RotationTemplateTestFixtures.SAMPLE_RATE_TOLERANCE)
            .setRotationDescription(RotationTemplateTestFixtures.ROTATION_DESCRIPTION)
            .setStation(FkSpectraTemplateFixtures.ANY_STATION)
            .build();

    RotationTemplate actualFromExisting =
        RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL).build();

    RotationTemplate actualWithPopulatedChannels =
        RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
            .setInputChannels(
                List.of(
                    DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH1"),
                    DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH2")))
            .build();

    RotationTemplate actualWithNoChannelOrChannelGroup =
        RotationTemplate.builder()
            .setDuration(RotationTemplateTestFixtures.SEC_DURATION)
            .setLeadDuration(RotationTemplateTestFixtures.SEC_DURATION)
            .setLocationToleranceKm(RotationTemplateTestFixtures.TOLERANCE)
            .setOrientationAngleToleranceDeg(RotationTemplateTestFixtures.ANGLE)
            .setSampleRateToleranceHz(RotationTemplateTestFixtures.SAMPLE_RATE_TOLERANCE)
            .setRotationDescription(RotationTemplateTestFixtures.ROTATION_DESCRIPTION)
            .setStation(FkSpectraTemplateFixtures.ANY_STATION)
            .build();

    RotationTemplate actualToBuilder =
        RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL.toBuilder().build();

    return Stream.of(
        arguments(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL, actualFromChannels),
        arguments(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL_GROUP, actualFromGroup),
        arguments(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL, actualFromExisting),
        arguments(
            RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL, actualWithPopulatedChannels),
        arguments(
            RotationTemplateTestFixtures.ROTATION_TEMPLATE_NO_CHANNEL_NO_GROUP,
            actualWithNoChannelOrChannelGroup),
        arguments(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL, actualToBuilder));
  }

  @ParameterizedTest
  @MethodSource("badInputsArguments")
  void testBadInputs(RotationTemplate.Builder builder) {
    assertThrows(IllegalArgumentException.class, () -> builder.build());
  }

  private static Stream<Arguments> badInputsArguments() {
    return Stream.of(
        // both channels and channel group set
        arguments(
            RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
                .setInputChannelGroup(RotationTemplateTestFixtures.INPUT_CHANNEL_GROUP)),
        // too few channels
        arguments(
            RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
                .setInputChannels(
                    List.of(
                        DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH1")
                            .toEntityReference()))),
        // too many channels
        arguments(
            RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
                .setInputChannels(
                    List.of(
                        DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH1")
                            .toEntityReference(),
                        DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH2")
                            .toEntityReference(),
                        DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH3")
                            .toEntityReference(),
                        DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH4")
                            .toEntityReference()))),
        // negative duration
        arguments(
            RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
                .setDuration(Duration.ofSeconds(-1L))),
        // negative lead duration
        arguments(
            RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
                .setLeadDuration(Duration.ofSeconds(-1L))),
        // negative location tolerance
        arguments(
            RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
                .setLocationToleranceKm(-1.0)),
        // negative angle tolerance
        arguments(
            RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
                .setOrientationAngleToleranceDeg(-1.0)),
        // angle tolerance over 360
        arguments(
            RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
                .setOrientationAngleToleranceDeg(361.0)),
        // negative sample rate tolerance
        arguments(
            RotationTemplate.builder(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
                .setSampleRateToleranceHz(-1.0)));
  }

  @Test
  void testSerializes() {
    JsonTestUtilities.assertSerializes(
        RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL, RotationTemplate.class);
  }
}
