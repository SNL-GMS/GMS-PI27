package gms.shared.signalenhancement.coi.filter;

import gms.shared.signalenhancement.coi.utils.TestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class FilterListDefinitionTest {

  @BeforeAll
  static void setup() {}

  @Test
  void testSerialization() {

    FilterListDefinition filterListDefinition =
        FilterListDefinition.from(
            TestFixtures.WORKFLOW_PAIR_LIST, TestFixtures.DEFAULT_FILTER_LIST);

    JsonTestUtilities.assertSerializes(filterListDefinition, FilterListDefinition.class);
  }
}
