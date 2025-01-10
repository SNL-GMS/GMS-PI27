package gms.shared.signaldetection.accessor.behavior;

import com.google.common.collect.ImmutableTable;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.repository.BridgedSignalDetectionRepository;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.signaldetection.util.BatchResults;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.repository.BridgedFilterDefinitionRepository;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BridgedSignalDetectionAccessorBehaviorTest {

  @Mock private BridgedSignalDetectionRepository bridgedSignalDetectionRepository;

  @Mock private BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository;

  private BridgedSignalDetectionAccessorBehavior signalDetectionAccessorBehavior;

  @BeforeEach
  void setUp() {
    signalDetectionAccessorBehavior =
        new BridgedSignalDetectionAccessorBehavior(
            bridgedSignalDetectionRepository, bridgedFilterDefinitionRepository);
  }

  @Test
  void testFilterDefinitionByUsageBySignalDetectionHypothesis() {

    var sdh = SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS;
    var sdh2 = SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_0;

    long filterId1 = 3243l;
    long filterId2 = 32342l;
    var filterRecordIdsByUsage =
        ImmutableTable.<SignalDetectionHypothesis, FilterDefinitionUsage, Long>builder()
            .put(sdh, FilterDefinitionUsage.DETECTION, filterId1)
            .put(sdh2, FilterDefinitionUsage.FK, filterId2)
            .build();

    var mockedFilterDefintion1 = Mockito.mock(FilterDefinition.class);
    var mockedFilterDefintion2 = Mockito.mock(FilterDefinition.class);

    Mockito.when(
            bridgedSignalDetectionRepository.findFilterRecordsForSignalDetectionHypotheses(
                List.of(sdh, sdh2)))
        .thenReturn(new BatchResults<>(filterRecordIdsByUsage, false));

    Mockito.when(
            bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(
                Set.of(filterId1, filterId2)))
        .thenReturn(Map.of(filterId1, mockedFilterDefintion1, filterId2, mockedFilterDefintion2));

    var pairResults =
        signalDetectionAccessorBehavior.findFilterDefinitionsForSignalDetectionHypotheses(
            List.of(sdh, sdh2));
    var filterDefinitionByUsageBySignalDetectionHypothesis = pairResults.getLeft();

    Assertions.assertFalse(pairResults.getRight());
    Assertions.assertEquals(
        2,
        filterDefinitionByUsageBySignalDetectionHypothesis
            .getSignalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage()
            .size());

    var definitionByUsageMap1 =
        filterDefinitionByUsageBySignalDetectionHypothesis
            .getSignalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage()
            .get(sdh);
    var filterDefinition1 =
        definitionByUsageMap1
            .getFilterDefinitionByFilterDefinitionUsage()
            .get(FilterDefinitionUsage.DETECTION);
    Assertions.assertNotNull(definitionByUsageMap1);
    Assertions.assertEquals(
        1, definitionByUsageMap1.getFilterDefinitionByFilterDefinitionUsage().size());
    Assertions.assertNotNull(filterDefinition1);
    Assertions.assertEquals(mockedFilterDefintion1, filterDefinition1);

    var definitionByUsageMap2 =
        filterDefinitionByUsageBySignalDetectionHypothesis
            .getSignalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage()
            .get(sdh2);
    var filterDefinition2 =
        definitionByUsageMap2
            .getFilterDefinitionByFilterDefinitionUsage()
            .get(FilterDefinitionUsage.FK);

    Assertions.assertNotNull(definitionByUsageMap2);
    Assertions.assertEquals(
        1, definitionByUsageMap2.getFilterDefinitionByFilterDefinitionUsage().size());
    Assertions.assertNotNull(filterDefinition2);
    Assertions.assertEquals(mockedFilterDefintion2, filterDefinition2);
  }

  @Test
  void testFilterDefinitionByUsageBySignalDetectionHypothesisFilterRecordsNotAllFound() {

    var sdh = SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS;

    long filterId1 = 3243l;
    long filterId2 = 32342l;
    var filterRecordIdsByUsage =
        ImmutableTable.<SignalDetectionHypothesis, FilterDefinitionUsage, Long>builder()
            .put(sdh, FilterDefinitionUsage.DETECTION, filterId1)
            .put(sdh, FilterDefinitionUsage.FK, filterId2)
            .build();

    var mockedFilterDefintion1 = Mockito.mock(FilterDefinition.class);

    Mockito.when(
            bridgedSignalDetectionRepository.findFilterRecordsForSignalDetectionHypotheses(
                List.of(sdh)))
        .thenReturn(new BatchResults<>(filterRecordIdsByUsage, false));

    Mockito.when(
            bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(
                Set.of(filterId1, filterId2)))
        .thenReturn(Map.of(filterId1, mockedFilterDefintion1));

    var pairResults =
        signalDetectionAccessorBehavior.findFilterDefinitionsForSignalDetectionHypotheses(
            List.of(sdh));
    var filterDefinitionByUsageBySignalDetectionHypothesis = pairResults.getLeft();

    Assertions.assertTrue(pairResults.getRight());
    Assertions.assertEquals(
        1,
        filterDefinitionByUsageBySignalDetectionHypothesis
            .getSignalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage()
            .size());

    var definitionByUsageMap1 =
        filterDefinitionByUsageBySignalDetectionHypothesis
            .getSignalDetectionHypothesisByFilterDefinitionByFilterDefinitionUsage()
            .get(sdh);
    var filterDefinition1 =
        definitionByUsageMap1
            .getFilterDefinitionByFilterDefinitionUsage()
            .get(FilterDefinitionUsage.DETECTION);
    Assertions.assertNotNull(definitionByUsageMap1);
    Assertions.assertEquals(
        1, definitionByUsageMap1.getFilterDefinitionByFilterDefinitionUsage().size());
    Assertions.assertNotNull(filterDefinition1);
    Assertions.assertEquals(mockedFilterDefintion1, filterDefinition1);
  }

  @Test
  void testFilterDefinitionByUsageBySignalDetectionHypothesisError() {
    Assertions.assertThrows(
        NullPointerException.class,
        () ->
            signalDetectionAccessorBehavior.findFilterDefinitionsForSignalDetectionHypotheses(
                null));
  }
}
