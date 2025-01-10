package gms.shared.signalenhancement.api;

import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Collection;
import java.util.List;
import org.junit.jupiter.api.Test;

class FilterDefinitionByUsageForSignalDetectionHypothesesRequestTest {
  @Test
  void testSerialization() {
    EventHypothesis eventHypothesis =
        EventTestFixtures.generateDummyEventHypothesisForFilterTest(10, 10);
    Collection<SignalDetectionHypothesis> signalDetectionHypotheses =
        List.of(
            SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1_NO_MCS,
            SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_2_NO_MCS);
    FilterDefinitionByUsageForSignalDetectionHypothesesRequest
        filterDefinitionByUsuageForSignalDetectionHypothesesRequest =
            FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
                .setEventHypothesis(eventHypothesis)
                .setSignalDetectionsHypotheses(signalDetectionHypotheses)
                .build();

    JsonTestUtilities.assertSerializes(
        filterDefinitionByUsuageForSignalDetectionHypothesesRequest,
        FilterDefinitionByUsageForSignalDetectionHypothesesRequest.class);
  }
}
