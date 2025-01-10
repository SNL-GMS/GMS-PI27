package gms.shared.event.coi.featureprediction;

import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class EllipticityCorrectionDefinitionTest {

  @Test
  void testEllipticityCorrectionDefinition() {
    var elliptictyCorrectionDefinition =
        EllipticityCorrectionDefinition.from(EllipticityCorrectionType.DZIEWONSKI_GILBERT);
    assertEquals(
        EllipticityCorrectionType.DZIEWONSKI_GILBERT,
        elliptictyCorrectionDefinition.getEllipticityCorrectionType());
    assertEquals(
        FeaturePredictionComponentType.ELLIPTICITY_CORRECTION,
        elliptictyCorrectionDefinition.getCorrectionType());
  }

  @Test
  void testSeriaization() {
    var elliptictyCorrectionDefinition =
        EllipticityCorrectionDefinition.from(EllipticityCorrectionType.DZIEWONSKI_GILBERT);
    JsonTestUtilities.assertSerializes(
        elliptictyCorrectionDefinition, EllipticityCorrectionDefinition.class);
  }
}
