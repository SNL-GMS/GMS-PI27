package gms.shared.signalenhancement.coi.types;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class FilterDefinitionUsageTest {
  private static final String DETECTION_ENUM = "DETECTION";
  private static final String FK_ENUM = "FK";
  private static final String ONSET_ENUM = "ONSET";
  private static final String DETECTION_STR = "Detect";
  private static final String FK_STR = "FK";
  private static final String ONSET_STR = "Onset";

  @Test
  void testFilterDefinitionUsageValues() {
    assertEquals(FilterDefinitionUsage.DETECTION, FilterDefinitionUsage.valueOf(DETECTION_ENUM));
    assertEquals(FilterDefinitionUsage.FK, FilterDefinitionUsage.valueOf(FK_ENUM));
    assertEquals(FilterDefinitionUsage.ONSET, FilterDefinitionUsage.valueOf(ONSET_ENUM));
  }

  @Test
  void testFilterDefinitionUsageStrings() {
    assertEquals(DETECTION_STR, FilterDefinitionUsage.DETECTION.toString());
    assertEquals(FK_STR, FilterDefinitionUsage.FK.toString());
    assertEquals(ONSET_STR, FilterDefinitionUsage.ONSET.toString());
  }

  @Test
  void testGetFilterDefinitionUsage() {
    assertEquals(DETECTION_STR, FilterDefinitionUsage.DETECTION.getName());
    assertEquals(FK_STR, FilterDefinitionUsage.FK.getName());
    assertEquals(ONSET_STR, FilterDefinitionUsage.ONSET.getName());
  }

  @Test
  void testFilterDefinitionUsageFromStrings() {
    assertEquals(FilterDefinitionUsage.DETECTION, FilterDefinitionUsage.fromString(DETECTION_STR));
    assertEquals(FilterDefinitionUsage.FK, FilterDefinitionUsage.fromString(FK_STR));
    assertEquals(FilterDefinitionUsage.ONSET, FilterDefinitionUsage.fromString(ONSET_STR));
  }

  @Test
  void testErrorWhenFilterDefinitionUsageMissing() {
    IllegalArgumentException thrown =
        assertThrows(
            IllegalArgumentException.class,
            FilterDefinitionUsageTest::executeNonExistingFilterDefinitionUsage);
  }

  private static void executeNonExistingFilterDefinitionUsage() {
    FilterDefinitionUsage.fromString("Non existing filter definition usage");
  }
}
