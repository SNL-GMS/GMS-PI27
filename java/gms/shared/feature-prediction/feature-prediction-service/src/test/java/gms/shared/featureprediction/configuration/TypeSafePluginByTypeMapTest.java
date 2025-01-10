package gms.shared.featureprediction.configuration;

import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class TypeSafePluginByTypeMapTest {

  @Test
  void testEquals() {
    // Test equals
    TypeSafePluginByTypeMap mapA =
        new TypeSafePluginByTypeMap(
            Map.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE, "MAP A"));
    TypeSafePluginByTypeMap anotherMapA =
        new TypeSafePluginByTypeMap(
            Map.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE, "MAP A"));
    TypeSafePluginByTypeMap mapB =
        new TypeSafePluginByTypeMap(
            Map.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE, "MAP B"));
    Assertions.assertEquals(mapA, mapA);
    Assertions.assertEquals(mapA, anotherMapA);
    Assertions.assertEquals(anotherMapA, mapA);
    Assertions.assertNotEquals(mapB, mapA);

    // Test class path
    Assertions.assertNotEquals(mapA, mapA.getPluginNames());

    // Test null path
    TypeSafePluginByTypeMap nullMap = null;
    Assertions.assertNotEquals(mapA, nullMap);
  }
}
