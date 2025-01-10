package gms.shared.signalenhancement.api;

import static org.junit.jupiter.api.Assertions.assertThrows;

import com.google.common.collect.ImmutableTable;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signalenhancement.coi.rotation.RotationTemplate;
import gms.shared.signalenhancement.testfixtures.RotationTemplateTestFixtures;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class RotationTemplateByPhaseByStationTest {

  @Test
  void testPreconditions() {
    // populated station
    var table =
        ImmutableTable.<Station, PhaseType, RotationTemplate>builder()
            .put(
                RotationTemplateTestFixtures.STATION,
                PhaseType.IPx,
                RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
            .build();
    assertThrows(IllegalStateException.class, () -> new RotationTemplateByPhaseByStation(table));

    // null table
    assertThrows(NullPointerException.class, () -> new RotationTemplateByPhaseByStation(null));
  }

  @Test
  void testSerialization() {
    var table =
        new RotationTemplateByPhaseByStation(
            ImmutableTable.<Station, PhaseType, RotationTemplate>builder()
                .put(
                    RotationTemplateTestFixtures.STATION.toEntityReference(),
                    PhaseType.IPx,
                    RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL)
                .build());

    JsonTestUtilities.assertSerializes(table, RotationTemplateByPhaseByStation.class);
  }
}
