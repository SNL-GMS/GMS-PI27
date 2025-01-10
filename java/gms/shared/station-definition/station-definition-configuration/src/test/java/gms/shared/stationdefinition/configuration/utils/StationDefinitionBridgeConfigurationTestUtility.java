package gms.shared.stationdefinition.configuration.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StationDefinitionBridgeConfigurationTestUtility {
  private static final Logger logger =
      LoggerFactory.getLogger(StationDefinitionBridgeConfigurationTestUtility.class);

  private static final String BEAM_TYPE_SELECTOR = "beamType";
  private static final String STATION_SELECTOR = "station";
  private static final String PHASE_TYPE_SELECTOR = "phaseType";

  private ConfigurationConsumerUtility configurationConsumerUtility;

  public StationDefinitionBridgeConfigurationTestUtility(
      ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  /**
   * Common asserts for validating ProcessingMaskDefinition objects
   *
   * @param expectedPMDef Expected {@link ProcessingMaskDefinition} object
   * @param actualPMDef Actual {@link ProcessingMaskDefinition} object from
   *     getProcessingMaskDefinition method
   */
  public void verifyProcessingMaskDefinition(
      ProcessingMaskDefinition expectedPMDef, ProcessingMaskDefinition actualPMDef) {

    assertEquals(
        expectedPMDef.maskedSegmentMergeThreshold(), actualPMDef.maskedSegmentMergeThreshold());
    assertEquals(expectedPMDef.processingOperation(), actualPMDef.processingOperation());

    // Starting with larger list, find items that don't match and report appropiatly
    if (actualPMDef.appliedQcSegmentCategoryAndTypes().size()
        >= expectedPMDef.appliedQcSegmentCategoryAndTypes().size()) {
      actualPMDef
          .appliedQcSegmentCategoryAndTypes()
          .forEach(
              item -> {
                assertTrue(
                    expectedPMDef.appliedQcSegmentCategoryAndTypes().contains(item),
                    "Set contained unexpected item(s) " + item);
              });
    } else {
      expectedPMDef
          .appliedQcSegmentCategoryAndTypes()
          .forEach(
              item -> {
                assertTrue(
                    actualPMDef.appliedQcSegmentCategoryAndTypes().contains(item),
                    "Set missing expected item(s) " + item);
              });
    }
    assertEquals(
        expectedPMDef.appliedQcSegmentCategoryAndTypes().size(),
        actualPMDef.appliedQcSegmentCategoryAndTypes().size(),
        "Unexpected number of items");
  }
}
