package gms.shared.signalfeaturemeasurement.coi;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.google.common.collect.ImmutableTable;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signalenhancement.testfixtures.FkSpectraTemplateFixtures;
import gms.shared.signalenhancement.testfixtures.RotationTemplateTestFixtures;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class AmplitudeMeasurementConditioningTemplateByStationByTypeTest {

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
  void testPreconditions() {
    // entity station
    var goodTable =
        ImmutableTable
            .<AmplitudeMeasurementType, Station, AmplitudeMeasurementConditioningTemplate>builder()
            .put(
                FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
                RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL.station(),
                AMCT)
            .build();
    assertDoesNotThrow(
        () -> new AmplitudeMeasurementConditioningTemplateByStationByType(goodTable));

    // populated station
    var badTable =
        ImmutableTable
            .<AmplitudeMeasurementType, Station, AmplitudeMeasurementConditioningTemplate>builder()
            .put(
                FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
                FkSpectraTemplateFixtures.ANY_STATION,
                AMCT)
            .build();
    var tableMsg =
        assertThrows(
            IllegalStateException.class,
            () -> new AmplitudeMeasurementConditioningTemplateByStationByType(badTable));
    assertTrue(tableMsg.toString().contains("The station keys must be entity references"));

    // null table
    assertThrows(
        NullPointerException.class,
        () -> new AmplitudeMeasurementConditioningTemplateByStationByType(null));
  }

  @Test
  void testSerialization() {
    var table =
        new AmplitudeMeasurementConditioningTemplateByStationByType(
            ImmutableTable
                .<AmplitudeMeasurementType, Station, AmplitudeMeasurementConditioningTemplate>
                    builder()
                .put(
                    FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2,
                    RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL.station(),
                    AMCT)
                .build());

    JsonTestUtilities.assertSerializes(
        table, AmplitudeMeasurementConditioningTemplateByStationByType.class);
  }
}
