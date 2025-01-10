package gms.shared.signalfeaturemeasurement.coi;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.derivedchannel.coi.BeamTestFixtures;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signalenhancement.testfixtures.FkSpectraTemplateFixtures;
import gms.shared.signalenhancement.testfixtures.RotationTemplateTestFixtures;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class AmplitudeMeasurementConditioningTemplateTest {

  private static final String TEMPLATE_ERROR_MSG =
      "Exactly 1 of measuredChannel, beamformingTemplate, and rotationTemplate must be populated";

  private static final AmplitudeMeasurementConditioningTemplate AMCT =
      AmplitudeMeasurementConditioningTemplate.builder()
          .setStation(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL.station())
          .setRotationTemplate(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
          .setMeasuredChannel(null)
          .setFilterDefinition(null)
          .setBeamformingTemplate(null)
          .setAmplitudeMeasurementType(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2)
          .build();

  @Test
  void testOtherValidBuilds() {
    Assertions.assertDoesNotThrow(
        () ->
            AMCT.toBuilder()
                .setRotationTemplate(RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL_GROUP)
                .build());

    Assertions.assertDoesNotThrow(
        () ->
            AMCT.toBuilder()
                .setRotationTemplate(null)
                .setBeamformingTemplate(BeamTestFixtures.TXAR_AMPLITUDE_BEAMFORMING_TEMPLATE)
                .setStation(BeamTestFixtures.TXAR_AMPLITUDE_BEAMFORMING_TEMPLATE.getStation())
                .build());

    Assertions.assertDoesNotThrow(
        () ->
            AMCT.toBuilder()
                .setRotationTemplate(null)
                .setMeasuredChannel(DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH1"))
                .build());
  }

  @ParameterizedTest
  @MethodSource("invalidInputArguments")
  void testInvalidInputs(
      AmplitudeMeasurementConditioningTemplate.Builder builder, String errorMsg) {
    var exception = Assertions.assertThrows(IllegalArgumentException.class, () -> builder.build());
    Assertions.assertTrue(
        exception.toString().contains(errorMsg), "Error message didn't match expected string");
  }

  private static Stream<Arguments> invalidInputArguments() {
    return Stream.of(
        // station mismatches
        arguments(
            AMCT.toBuilder().setStation(FkSpectraTemplateFixtures.ASAR_STATION.toEntityReference()),
            "The rotationTemplate's station must match the AMCT station"),
        arguments(
            AMCT.toBuilder()
                .setRotationTemplate(null)
                .setBeamformingTemplate(BeamTestFixtures.TXAR_AMPLITUDE_BEAMFORMING_TEMPLATE),
            "The beamformingTemplate station must match the AMCT station"),

        // wrong number of Optionals populated
        arguments(AMCT.toBuilder().setRotationTemplate(null), TEMPLATE_ERROR_MSG),
        arguments(
            AMCT.toBuilder()
                .setMeasuredChannel(DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH1")),
            TEMPLATE_ERROR_MSG),
        arguments(
            AMCT.toBuilder()
                .setBeamformingTemplate(BeamTestFixtures.TXAR_AMPLITUDE_BEAMFORMING_TEMPLATE),
            TEMPLATE_ERROR_MSG),
        arguments(
            AMCT.toBuilder()
                .setRotationTemplate(null)
                .setBeamformingTemplate(BeamTestFixtures.TXAR_AMPLITUDE_BEAMFORMING_TEMPLATE)
                .setMeasuredChannel(DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH1")),
            TEMPLATE_ERROR_MSG),
        arguments(
            AMCT.toBuilder()
                .setBeamformingTemplate(BeamTestFixtures.TXAR_AMPLITUDE_BEAMFORMING_TEMPLATE)
                .setMeasuredChannel(DefaultCoiTestFixtures.getDefaultChannel("ANY.CHGROUP.CH1")),
            TEMPLATE_ERROR_MSG),

        // wrong beam type
        arguments(
            AmplitudeMeasurementConditioningTemplate.builder(AMCT)
                .setRotationTemplate(null)
                .setBeamformingTemplate(BeamTestFixtures.TXAR_BEAMFORMING_TEMPLATE)
                .setStation(BeamTestFixtures.TXAR_BEAMFORMING_TEMPLATE.getStation()),
            "The beamformingTemplate's beamType must be AMPLITUDE"),

        // no input channels / channel groups
        arguments(
            AMCT.toBuilder()
                .setRotationTemplate(
                    RotationTemplateTestFixtures.ROTATION_TEMPLATE_NO_CHANNEL_NO_GROUP),
            "Either the inputChannels or the inputChannelGroup for the rotation template must be"
                + " populated"),

        // input channel doesn't match station
        arguments(
            AMCT.toBuilder()
                .setRotationTemplate(null)
                .setBeamformingTemplate(null)
                .setMeasuredChannel(DefaultCoiTestFixtures.getDefaultChannel("LOLO.CHGROUP.CH1")),
            "The measuredChannel must be Channel within the AmplitudeMeasurmentConditioningTemplate"
                + " objects station"));
  }
}
