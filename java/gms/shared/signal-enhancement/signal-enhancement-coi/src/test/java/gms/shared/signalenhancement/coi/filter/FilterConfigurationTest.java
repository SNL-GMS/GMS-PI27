package gms.shared.signalenhancement.coi.filter;

import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class FilterConfigurationTest {
  @Test
  void testSerialization() {
    FilterConfiguration filterConfiguration =
        FilterConfiguration.from(FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);

    JsonTestUtilities.assertSerializes(filterConfiguration, FilterConfiguration.class);
  }
}
