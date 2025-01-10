package gms.shared.signalenhancement.api;

import com.google.common.collect.ImmutableMap;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class FilterDefinitionByUsageBySignalDetectionHypothesisTest {

  private static final UUID ID1 = UUID.fromString("00000000-000-0000-0000-000000000001");
  private static final UUID ID5 = UUID.fromString("00000000-000-0000-0000-000000000005");
  private static final UUID ID2 = UUID.fromString("00000000-000-0000-0000-000000000002");
  private static final UUID ID6 = UUID.fromString("00000000-000-0000-0000-000000000006");

  @Test
  void testSerialization() {
    FilterDefinitionByUsageBySignalDetectionHypothesis
        filterDefinitionByUsageForSignalDetectionHypothesis =
            FilterDefinitionByUsageBySignalDetectionHypothesis.from(
                List.of(getDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair(1)));

    JsonTestUtilities.assertSerializes(
        filterDefinitionByUsageForSignalDetectionHypothesis,
        FilterDefinitionByUsageBySignalDetectionHypothesis.class);
  }

  @Test
  void testSignalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsageMap() {
    FilterDefinitionByUsageBySignalDetectionHypothesis
        filterDefinitionByUsageForSignalDetectionHypothesis =
            FilterDefinitionByUsageBySignalDetectionHypothesis.from(
                List.of(getDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair(1)));

    Map<SignalDetectionHypothesis, FilterDefinitionByFilterDefinitionUsage>
        signalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage =
            filterDefinitionByUsageForSignalDetectionHypothesis
                .getSignalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage();

    Assertions.assertFalse(
        signalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage.isEmpty());
  }

  @Test
  void testSignalDetectionHypothesisByFilterDefinitionUsageMap() {
    FilterDefinitionByUsageBySignalDetectionHypothesis
        filterDefinitionByUsageForSignalDetectionHypothesis =
            FilterDefinitionByUsageBySignalDetectionHypothesis.from(
                List.of(
                    getDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair(1),
                    getDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair(2)));

    Map<SignalDetectionHypothesis, List<FilterDefinitionUsage>>
        signalDetectionHypothesisByFilterDefinitionUsageMap =
            filterDefinitionByUsageForSignalDetectionHypothesis
                .getSignalDetectionHypothesisByFilterDefinitionUsage();

    Assertions.assertEquals(2, signalDetectionHypothesisByFilterDefinitionUsageMap.size());

    List<FilterDefinitionUsage> filterDefinitionUsages =
        signalDetectionHypothesisByFilterDefinitionUsageMap.values().stream()
            .flatMap(List::stream)
            .collect(Collectors.toList());

    Assertions.assertTrue(filterDefinitionUsages.contains(FilterDefinitionUsage.FK));
  }

  @Test
  void testSignalDetectionHypothesisByFilterDefinitionMap() {
    FilterDefinitionByUsageBySignalDetectionHypothesis
        filterDefinitionByUsageForSignalDetectionHypothesis =
            FilterDefinitionByUsageBySignalDetectionHypothesis.from(
                List.of(
                    getDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair(1),
                    getDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair(2)));

    Map<SignalDetectionHypothesis, List<FilterDefinition>>
        signalDetectionHypothesisByFilterDefinitionUsageMap =
            filterDefinitionByUsageForSignalDetectionHypothesis
                .getSignalDetectionHypothesisByFilterDefinition();

    Assertions.assertEquals(2, signalDetectionHypothesisByFilterDefinitionUsageMap.size());

    signalDetectionHypothesisByFilterDefinitionUsageMap.forEach(
        (sdh, filterDefinitions) -> {
          org.assertj.core.api.Assertions.assertThat(filterDefinitions)
              .containsExactly(
                  FilterDefinitionTestFixtures.H__LP__0_0__4_2__48__NON_CAUSAL,
                  FilterDefinitionTestFixtures.H__HP__0_3__0_0__48__CAUSAL,
                  FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);
        });
  }

  private SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair
      getDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair(int pair) {

    return SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair.create(
        getSignalDetectionHypothesis(pair), getFilterDefinitionByFilterDefinitionUsage());
  }

  private SignalDetectionHypothesis getSignalDetectionHypothesis(int pair) {
    if (pair == 1) {
      return SignalDetectionHypothesis.builder()
          .setId(SignalDetectionHypothesisId.from(ID1, ID5))
          .build();
    } else {
      return SignalDetectionHypothesis.builder()
          .setId(SignalDetectionHypothesisId.from(ID2, ID6))
          .build();
    }
  }

  private FilterDefinitionByFilterDefinitionUsage getFilterDefinitionByFilterDefinitionUsage() {
    var map =
        ImmutableMap.of(
            FilterDefinitionUsage.FK, FilterDefinitionTestFixtures.H__LP__0_0__4_2__48__NON_CAUSAL,
            FilterDefinitionUsage.ONSET, FilterDefinitionTestFixtures.H__HP__0_3__0_0__48__CAUSAL,
            FilterDefinitionUsage.DETECTION,
                FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);

    return FilterDefinitionByFilterDefinitionUsage.from(map);
  }
}
