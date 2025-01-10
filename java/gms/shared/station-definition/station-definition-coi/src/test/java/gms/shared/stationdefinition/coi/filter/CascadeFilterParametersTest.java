package gms.shared.stationdefinition.coi.filter;

import gms.shared.stationdefinition.testfixtures.FilterParametersTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class CascadeFilterParametersTest {

  @Test
  void testSerializationCascadeFiltersParameters() {
    JsonTestUtilities.assertSerializes(
        FilterParametersTestFixtures.CASCADE, CascadeFilterParameters.class);
  }
}
