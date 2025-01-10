package gms.shared.event.coi.featureprediction;

import com.fasterxml.jackson.core.type.TypeReference;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.List;
import org.junit.jupiter.api.Test;

class FeaturePredictionCorrectionDefinitionTest {

  @Test
  void testSerialization() {
    var list =
        List.of(
            ElevationCorrectionDefinition.from("MyAmazingModel"),
            EllipticityCorrectionDefinition.from(EllipticityCorrectionType.DZIEWONSKI_GILBERT));

    JsonTestUtilities.assertSerializes(
        list, new TypeReference<List<FeaturePredictionCorrectionDefinition>>() {});
  }
}
