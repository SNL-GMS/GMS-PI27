package gms.shared.stationdefinition.coi.filter;

import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Test;

class FilterDefinitionTest {

  @Test
  void testSerializationLinearFilterDescription() {
    JsonTestUtilities.assertSerializes(
        FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL, FilterDefinition.class);
  }

  @Test
  void testSerializationCascadeFilterDescription() {
    JsonTestUtilities.assertSerializes(
        FilterDefinitionTestFixtures.CASCADE__CAUSAL, FilterDefinition.class);
  }

  @Test
  void testSerializationPhaseMatchFilterDescription() {
    JsonTestUtilities.assertSerializes(
        FilterDefinitionTestFixtures.PHASE_MATCH, FilterDefinition.class);
  }

  @Test
  void testGetUniqueIdentifier() {

    assertEquals(
        FilterDefinitionTestFixtures.ALL_DEFINITIONS.size(),
        FilterDefinitionTestFixtures.ALL_DEFINITIONS.stream()
            .map(FilterDefinition::getUniqueIdentifier)
            .distinct()
            .count());
  }
}
