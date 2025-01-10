package gms.shared.event.api;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.google.common.collect.ImmutableTable;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.util.Map;
import org.junit.jupiter.api.Test;

class DefiningFeatureMapByChannelAndPhaseTypeTest {

  private static final Map<FeatureMeasurementType<?>, DefiningFeatureDefinition>
      DEFINING_FEATURE_BY_FEATURE_MEASUREMENT =
          Map.of(
              FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2_OR,
              new DefiningFeatureDefinition(true, true, true));

  @Test
  void testPreconditions() {
    // faceted channel
    var goodTable =
        ImmutableTable
            .<PhaseType, String, Map<FeatureMeasurementType<?>, DefiningFeatureDefinition>>builder()
            .put(
                PhaseType.P,
                UtilsTestFixtures.CHANNEL_VERSION_REAL_NAME.getName(),
                DEFINING_FEATURE_BY_FEATURE_MEASUREMENT)
            .build();
    assertDoesNotThrow(() -> new DefiningFeatureMapByChannelAndPhaseType(goodTable));

    // null table
    assertThrows(
        NullPointerException.class, () -> new DefiningFeatureMapByChannelAndPhaseType(null));
  }
}
