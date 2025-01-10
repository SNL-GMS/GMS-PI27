package gms.shared.event.coi;

import static gms.shared.event.coi.EventTestFixtures.NETWORK_MAGNITUDE_BEHAVIOR_NO_MCS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.utilities.test.JsonTestUtilities;
import java.io.IOException;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class NetworkMagnitudeSolutionTest {
  private static final MagnitudeType TYPE = MagnitudeType.MB;
  private static final DoubleValue MAGNITUDE = DoubleValue.from(1.0, Optional.empty(), Units.COUNT);

  @Test
  void testSerialize() throws IOException {
    NetworkMagnitudeSolution expected =
        NetworkMagnitudeSolution.builder()
            .setType(TYPE)
            .setMagnitude(MAGNITUDE)
            .setMagnitudeBehaviors(Collections.emptyList())
            .build();

    JsonTestUtilities.assertSerializes(expected, NetworkMagnitudeSolution.class);
  }

  @Test
  void testBuildInvalidMagnitude() {
    var nmsBuilder =
        NetworkMagnitudeSolution.builder()
            .setType(TYPE)
            .setMagnitude(DoubleValue.from(11, Optional.empty(), Units.COUNT))
            .setMagnitudeBehaviors(Collections.emptyList());

    assertThrows(IllegalStateException.class, nmsBuilder::build);
  }

  @Test
  void testAddingMagnitudeBehavior() {
    NetworkMagnitudeSolution actual =
        NetworkMagnitudeSolution.builder()
            .setType(TYPE)
            .setMagnitude(MAGNITUDE)
            .setMagnitudeBehaviors(Collections.emptyList())
            .addMagnitudeBehavior(NETWORK_MAGNITUDE_BEHAVIOR_NO_MCS)
            .build();

    JsonTestUtilities.assertSerializes(actual, NetworkMagnitudeSolution.class);

    var actualMB = actual.getMagnitudeBehaviors();

    assertEquals(1, actualMB.size(), "There should be one magnitudeBehavior.");
    assertEquals(
        NETWORK_MAGNITUDE_BEHAVIOR_NO_MCS,
        actualMB.get(0),
        "The magnitudeBehavior should be unchanged.");
  }
}
