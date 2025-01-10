package gms.shared.signaldetection.accessor;

import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import gms.shared.signaldetection.api.facet.SignalDetectionFacetingUtility;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.repository.BridgedSignalDetectionRepository;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageForSignalDetectionHypothesesRequest;
import gms.shared.signalenhancement.api.webclient.SignalEnhancementConfigurationClient;
import gms.shared.stationdefinition.accessor.DefaultStationDefinitionAccessor;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.waveform.api.WaveformAccessor;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class CannedSignalDetectionAccessorTest {

  private static final WorkflowDefinitionId stageId = WorkflowDefinitionId.from("Stage1");

  private CannedSignalDetectionAccessor cannedSignalDetectionAccessor;

  @Mock private BridgedSignalDetectionRepository signalDetectionRepository;

  @Mock private WaveformAccessor waveformAccessor;

  @Mock private SignalDetectionFacetingUtility signalDetectionFacetingUtility;

  @Mock private DefaultStationDefinitionAccessor stationDefinitionAccessor;

  @Mock private SignalEnhancementConfigurationClient secClient;

  @BeforeEach
  public void testSetup() {
    cannedSignalDetectionAccessor =
        new CannedSignalDetectionAccessor(
            secClient, signalDetectionRepository, waveformAccessor, stationDefinitionAccessor);
  }

  @Test
  void testFindFilterDefinitionsForSignalDetections() {
    var facetedSd = SignalDetection.createEntityReference(SIGNAL_DETECTION.getId());
    cannedSignalDetectionAccessor.setSignalDetectionFacetingUtility(signalDetectionFacetingUtility);

    when(signalDetectionFacetingUtility.populateFacets(
            eq(facetedSd), any(FacetingDefinition.class), eq(stageId)))
        .thenReturn(SIGNAL_DETECTION);

    var mockResponse = Mockito.mock(FilterDefinitionByUsageBySignalDetectionHypothesis.class);

    when(secClient.queryDefaultFilterDefByUsageForSDHs(
            FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
                .setSignalDetectionsHypotheses(SIGNAL_DETECTION.getSignalDetectionHypotheses())
                .build()))
        .thenReturn(Mono.just(mockResponse));

    StepVerifier.create(
            cannedSignalDetectionAccessor.findFilterDefinitionsForSignalDetections(
                List.of(facetedSd), stageId))
        .assertNext(result -> assertEquals(mockResponse, result.getLeft()))
        .verifyComplete();
  }

  @Test
  void testFindFilterDefinitionsForSignalDetectionsFailNoSignalDetections() {
    StepVerifier.create(
            cannedSignalDetectionAccessor.findFilterDefinitionsForSignalDetections(
                Collections.emptyList(), stageId))
        .verifyErrorMatches(error -> error instanceof IllegalArgumentException);
  }

  @Test
  void testFindFIlterDefinitionsForSignalDetectionsFailNoSDHsRetrieved() {
    var facetedSd = SignalDetection.createEntityReference(SIGNAL_DETECTION.getId());
    var sdNoSdhs =
        SIGNAL_DETECTION.toBuilder()
            .setData(
                SIGNAL_DETECTION.getData().get().toBuilder()
                    .setSignalDetectionHypotheses(Collections.emptyList())
                    .build())
            .build();
    cannedSignalDetectionAccessor.setSignalDetectionFacetingUtility(signalDetectionFacetingUtility);

    when(signalDetectionFacetingUtility.populateFacets(
            eq(facetedSd), any(FacetingDefinition.class), eq(stageId)))
        .thenReturn(sdNoSdhs);

    StepVerifier.create(
            cannedSignalDetectionAccessor.findFilterDefinitionsForSignalDetections(
                List.of(facetedSd), stageId))
        .verifyErrorMatches(error -> error instanceof IllegalArgumentException);
  }
}
