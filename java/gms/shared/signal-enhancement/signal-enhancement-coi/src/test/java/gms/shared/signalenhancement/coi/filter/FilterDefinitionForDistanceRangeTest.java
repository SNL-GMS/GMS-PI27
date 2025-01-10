package gms.shared.signalenhancement.coi.filter;

import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class FilterDefinitionForDistanceRangeTest {

  @Test
  void testCreateAndSerializeFilterDefinitionForDistanceRange() {
    var distanceRangeDeg = new DistanceRangeDeg(0, 50);

    var fdfdr =
        new FilterDefinitionForDistanceRange(
            FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL,
            Optional.of(distanceRangeDeg));
    JsonTestUtilities.assertSerializes(fdfdr, FilterDefinitionForDistanceRange.class);
  }
}
