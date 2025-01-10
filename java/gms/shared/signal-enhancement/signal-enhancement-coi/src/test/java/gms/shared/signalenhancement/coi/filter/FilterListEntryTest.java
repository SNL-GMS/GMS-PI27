package gms.shared.signalenhancement.coi.filter;

import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.signalenhancement.coi.utils.TestFixtures;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class FilterListEntryTest {

  private static void executeEmptyUnfiltered() {
    FilterListEntry.from(
        true,
        null,
        FilterDefinitionUsage.DETECTION,
        FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);
  }

  private static void executeEmptyNamedFilter() {
    FilterListEntry.from(
        true, true, null, FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);
  }

  private static void executeEmptyFilterDefinition() {
    FilterListEntry.from(true, true, FilterDefinitionUsage.DETECTION, null);
  }

  private static void executeAllEmpty() {
    FilterListEntry.from(true, null, null, null);
  }

  @Test
  void testSerialization() {
    JsonTestUtilities.assertSerializes(TestFixtures.FILTER_LIST_ENTRY, FilterListEntry.class);
  }

  @Test
  void testErrorWhenFilterDefinitionAndFilterNamedEntryIsPopulated() {
    IllegalArgumentException thrown =
        assertThrows(IllegalArgumentException.class, FilterListEntryTest::executeEmptyUnfiltered);

    Assertions.assertEquals("Exactly one filter entry must be populated", thrown.getMessage());
  }

  @Test
  void testErrorWhenFilterDefinitionAndUnfilteredEntryIsPopulated() {
    IllegalArgumentException thrown =
        assertThrows(IllegalArgumentException.class, FilterListEntryTest::executeEmptyNamedFilter);

    Assertions.assertEquals("Exactly one filter entry must be populated", thrown.getMessage());
  }

  @Test
  void testErrorWhenNamedFilteredEntryAndUnfilteredEntryIsPopulated() {
    IllegalArgumentException thrown =
        assertThrows(
            IllegalArgumentException.class, FilterListEntryTest::executeEmptyFilterDefinition);

    Assertions.assertEquals("Exactly one filter entry must be populated", thrown.getMessage());
  }

  @Test
  void testErrorAllFilterEntriesAreEmpty() {
    IllegalArgumentException thrown =
        assertThrows(IllegalArgumentException.class, FilterListEntryTest::executeAllEmpty);

    Assertions.assertEquals("Exactly one filter entry must be populated", thrown.getMessage());
  }
}
