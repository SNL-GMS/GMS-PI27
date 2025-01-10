package gms.shared.signalenhancement.api;

import com.google.common.collect.ImmutableMap;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FilterDefinitionByFilterDefinitionUsageTest {

  @Test
  void testSerialization() {

    JsonTestUtilities.assertSerializes(
        getFilterDefinitionByFilterDefinitionUsage(),
        FilterDefinitionByFilterDefinitionUsage.class);
  }

  private FilterDefinitionByFilterDefinitionUsage getFilterDefinitionByFilterDefinitionUsage() {
    Map<FilterDefinitionUsage, FilterDefinition> map = new HashMap<>();
    map.put(FilterDefinitionUsage.FK, FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);

    return FilterDefinitionByFilterDefinitionUsage.from(ImmutableMap.copyOf(map));
  }
}
