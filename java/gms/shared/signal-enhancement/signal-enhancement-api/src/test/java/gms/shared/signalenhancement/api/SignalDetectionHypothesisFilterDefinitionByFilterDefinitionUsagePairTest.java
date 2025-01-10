package gms.shared.signalenhancement.api;

import com.google.common.collect.ImmutableMap;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePairTest {

  @Test
  void testSerialization() {
    SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair
        signalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair =
            SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair.create(
                getSignalDetectionHypothesis(), getFilterDefinitionByFilterDefinitionUsage());

    JsonTestUtilities.assertSerializes(
        signalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair,
        SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair.class);
  }

  private SignalDetectionHypothesis getSignalDetectionHypothesis() {
    UUID id = UUID.fromString("10000000-100-0000-1000-100000000053");
    UUID id5 = UUID.fromString("10000000-100-0000-1000-100000000054");

    return SignalDetectionHypothesis.builder()
        .setId(SignalDetectionHypothesisId.from(id, id5))
        .build();
  }

  private FilterDefinitionByFilterDefinitionUsage getFilterDefinitionByFilterDefinitionUsage() {
    Map<FilterDefinitionUsage, FilterDefinition> map = new HashMap<>();
    map.put(FilterDefinitionUsage.FK, FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);

    return FilterDefinitionByFilterDefinitionUsage.from(ImmutableMap.copyOf(map));
  }
}
