package gms.shared.signaldetection.manager;

import static org.mockito.Mockito.times;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.ImmutableList;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.signaldetection.accessor.CannedSignalDetectionAccessor;
import gms.shared.signaldetection.api.SignalDetectionAccessor;
import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByIdsRequest;
import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByStationsAndTimeRequest;
import gms.shared.signaldetection.api.request.FilterDefinitionsForSignalDetectionsRequest;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import gms.shared.spring.utilities.framework.SpringTestBase;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.Collections;
import java.util.UUID;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import reactor.core.publisher.Mono;

@EnableWebMvc
@WebMvcTest(SignalDetectionManager.class)
class SignalDetectionManagerTest extends SpringTestBase {

  private static final UUID id = UUID.fromString("00000000-000-0000-0000-000000000001");

  @MockBean private SystemConfig systemConfig;

  @MockBean(name = "bridgedSignalDetectionAccessor")
  private SignalDetectionAccessor signalDetectionAccessorImpl;

  @MockBean private CannedSignalDetectionAccessor cannedSignalDetectionAccessor;

  @Autowired SignalDetectionManager signalDetectionManager;

  protected ObjectMapper mapper = ObjectMappers.jsonMapper();

  public MappingJackson2HttpMessageConverter jackson2HttpMessageConverter() {
    MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
    converter.setObjectMapper(mapper);
    return converter;
  }

  MockMvc altMockMvc;

  @BeforeEach
  void init() {

    altMockMvc =
        MockMvcBuilders.standaloneSetup(signalDetectionManager)
            .setMessageConverters(jackson2HttpMessageConverter())
            .build();
  }

  @Test
  void testFindDetectionsWithSegmentsByStationsAndTime() throws Exception {

    Station station = Station.builder().setName("tst").setEffectiveAt(Instant.now()).build();

    var request =
        DetectionsWithSegmentsByStationsAndTimeRequest.create(
            ImmutableList.of(station),
            Instant.MIN,
            Instant.MAX,
            WorkflowDefinitionId.from("test"),
            ImmutableList.of());

    postResult(
        "/signal-detection/signal-detections-with-channel-segments/query/stations-timerange",
        request,
        HttpStatus.OK,
        altMockMvc);

    Mockito.verify(signalDetectionAccessorImpl, times(1))
        .findWithSegmentsByStationsAndTime(
            request.getStations(),
            request.getStartTime(),
            request.getEndTime(),
            request.getStageId(),
            request.getExcludedSignalDetections());
  }

  @Test
  void testFindDetectionsWithSegmentsByIds() throws Exception {

    var request =
        DetectionsWithSegmentsByIdsRequest.create(
            ImmutableList.of(id), WorkflowDefinitionId.from("test"));

    postResult(
        "/signal-detection/signal-detections-with-channel-segments/query/ids",
        request,
        HttpStatus.OK,
        altMockMvc);

    Mockito.verify(signalDetectionAccessorImpl, times(1))
        .findWithSegmentsByIds(request.getDetectionIds(), request.getStageId());
  }

  @Test
  void testFindCannedFilterDefinitionsForSignalDetections() throws Exception {
    var signalDetections = ImmutableList.of(SignalDetection.createEntityReference(id));
    var stageId = WorkflowDefinitionId.from("test");
    var request = FilterDefinitionsForSignalDetectionsRequest.create(signalDetections, stageId);

    var response =
        Pair.of(
            FilterDefinitionByUsageBySignalDetectionHypothesis.from(Collections.emptyList()),
            false);

    Mockito.when(
            cannedSignalDetectionAccessor.findFilterDefinitionsForSignalDetections(
                signalDetections, stageId))
        .thenReturn(Mono.just(response));

    postResult(
        "/signal-detection/filter-definitions-by-usage/query/signal-detections/canned",
        request,
        HttpStatus.OK,
        altMockMvc);

    Mockito.verify(cannedSignalDetectionAccessor, times(1))
        .findFilterDefinitionsForSignalDetections(
            request.getSignalDetections(), request.getStageId());
  }

  @Test
  void testFindFilterDefinitionsForSignalDetections() throws Exception {
    var signalDetections = ImmutableList.of(SignalDetection.createEntityReference(id));
    var stageId = WorkflowDefinitionId.from("test");
    var request = FilterDefinitionsForSignalDetectionsRequest.create(signalDetections, stageId);

    var response =
        Pair.of(
            FilterDefinitionByUsageBySignalDetectionHypothesis.from(Collections.emptyList()),
            false);

    Mockito.when(
            signalDetectionAccessorImpl.findFilterDefinitionsForSignalDetections(
                signalDetections, stageId))
        .thenReturn(Mono.just(response));

    postResult(
        "/signal-detection/filter-definitions-by-usage/query/signal-detections/",
        request,
        HttpStatus.OK,
        altMockMvc);

    Mockito.verify(signalDetectionAccessorImpl, times(1))
        .findFilterDefinitionsForSignalDetections(
            request.getSignalDetections(), request.getStageId());
  }
}
