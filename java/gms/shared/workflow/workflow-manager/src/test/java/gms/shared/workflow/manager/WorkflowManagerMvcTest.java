package gms.shared.workflow.manager;

import static java.util.stream.Collectors.toSet;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectReader;
import gms.shared.frameworks.service.InvalidInputException;
import gms.shared.spring.utilities.framework.SpringTestBase;
import gms.shared.system.events.SystemEvent;
import gms.shared.system.events.SystemEventPublisher;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.workflow.accessor.WorkflowAccessor;
import gms.shared.workflow.coi.IntervalFixtures;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.IntervalStatus;
import gms.shared.workflow.coi.MockIntervalData;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.manager.controller.WorkflowManagerController;
import gms.shared.workflow.manager.request.StageIntervalsByStageIdAndTimeRequest;
import gms.shared.workflow.manager.request.UpdateActivityIntervalStatusRequest;
import gms.shared.workflow.manager.request.UpdateInteractiveAnalysisStageIntervalStatusRequest;
import jakarta.servlet.ServletException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.function.Executable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletResponse;

@WebMvcTest(WorkflowManagerController.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class WorkflowManagerMvcTest extends SpringTestBase {

  private static final ObjectReader jsonReader = ObjectMappers.jsonReader();

  @MockBean
  @Qualifier("workflow-accessor") private WorkflowAccessor workflowAccessor;

  @MockBean private SystemEventPublisher systemEventPublisher;

  @Captor ArgumentCaptor<Function<StageInterval, Optional<StageInterval>>> updateStatusCaptor;

  @Test
  void testGetWorkflow() throws Exception {
    var expectedWorkflow = Workflow.from("TEST", List.of());
    given(workflowAccessor.getWorkflow()).willReturn(expectedWorkflow);

    // Test with posting application/json
    MockHttpServletResponse response =
        postResult("/workflow-manager/workflow-definition", "PLACEHOLDER", HttpStatus.OK);
    verify(workflowAccessor).getWorkflow();
    var actualWorkflow = jsonReader.readValue(response.getContentAsString(), Workflow.class);
    assertEquals(expectedWorkflow, actualWorkflow);
    clearInvocations(workflowAccessor);

    // Test with posting text/plain
    response =
        postResultTextPlain("/workflow-manager/workflow-definition", "PLACEHOLDER", HttpStatus.OK);
    verify(workflowAccessor).getWorkflow();
    actualWorkflow = jsonReader.readValue(response.getContentAsString(), Workflow.class);
    assertEquals(expectedWorkflow, actualWorkflow);
    clearInvocations(workflowAccessor);

    // Test with posting no request body
    response = postResultNoBody("/workflow-manager/workflow-definition", HttpStatus.OK);
    verify(workflowAccessor).getWorkflow();
    actualWorkflow = jsonReader.readValue(response.getContentAsString(), Workflow.class);
    assertEquals(expectedWorkflow, actualWorkflow);
  }

  @Test
  void testFindStageIntervalsByStageIdAndTime() throws Exception {
    var startTimeInstant = Instant.EPOCH;
    var endTimeInstant = startTimeInstant.plusSeconds(30);
    WorkflowDefinitionId stageId = WorkflowDefinitionId.from("test");
    var intervalsByStageReader =
        jsonReader.forType(new TypeReference<Map<String, List<StageInterval>>>() {});

    StageIntervalsByStageIdAndTimeRequest request =
        StageIntervalsByStageIdAndTimeRequest.from(
            startTimeInstant, endTimeInstant, Set.of(stageId));
    var expectedResponse = MockIntervalData.get(startTimeInstant, endTimeInstant, List.of(stageId));

    given(
            workflowAccessor.findStageIntervalsByStageIdAndTime(
                request.getStartTime(), request.getEndTime(), request.getStageIds()))
        .willReturn(expectedResponse);

    MockHttpServletResponse response =
        postResult("/workflow-manager/interval/stage/query/ids-timerange", request, HttpStatus.OK);

    Map<String, List<StageInterval>> actualResponse =
        intervalsByStageReader.readValue(response.getContentAsString());
    assertEquals(expectedResponse, actualResponse);
    verify(workflowAccessor)
        .findStageIntervalsByStageIdAndTime(
            request.getStartTime(), request.getEndTime(), request.getStageIds());
  }

  @ParameterizedTest
  @MethodSource("updateStageIntervalStatusChanges")
  void testUpdateStageIntervalStatusChanges(
      StageInterval stageInterval,
      IntervalStatus updateStatus,
      String userName,
      Class<Exception> expectedException) {

    given(
            workflowAccessor.updateIfPresent(
                eq(stageInterval.getIntervalId()), updateStatusCaptor.capture()))
        .willAnswer(i -> updateStatusCaptor.getValue().apply(stageInterval));

    var validRequest =
        UpdateInteractiveAnalysisStageIntervalStatusRequest.builder()
            .setStageIntervalId(stageInterval.getIntervalId())
            .setStatus(updateStatus)
            .setTime(Instant.now())
            .setUserName(userName)
            .build();

    Executable requestExecutable =
        () ->
            postResult(
                "/workflow-manager/interval/stage/interactive-analysis/update",
                validRequest,
                HttpStatus.OK);

    if (expectedException != null) {
      var nse = assertThrows(ServletException.class, requestExecutable);
      assertEquals(expectedException, nse.getCause().getClass());
    } else {
      // valid request to close
      assertDoesNotThrow(requestExecutable);

      // should create and send System message events
      verify(systemEventPublisher).sendSystemEvent(any(SystemEvent.class));
    }
  }

  private static Stream<Arguments> updateStageIntervalStatusChanges() {
    return Stream.of(
        arguments(
            IntervalFixtures.notStartedInteractiveAnalysisStageInterval,
            IntervalStatus.IN_PROGRESS,
            IntervalFixtures.ANALYST_1,
            null),
        arguments(
            IntervalFixtures.singleActivityInProgressInteractiveAnalysisStageInterval,
            IntervalStatus.NOT_COMPLETE,
            IntervalFixtures.ANALYST_1,
            null),
        arguments(
            IntervalFixtures.readyForCompleteInteractiveAnalysisStageInterval,
            IntervalStatus.COMPLETE,
            IntervalFixtures.ANALYST_1,
            null),
        arguments(
            IntervalFixtures.readyForCompleteInteractiveAnalysisStageInterval,
            IntervalStatus.SKIPPED,
            IntervalFixtures.ANALYST_1,
            InvalidInputException.class),
        arguments(
            IntervalFixtures.emptyAutoProcessingStageInterval,
            IntervalStatus.IN_PROGRESS,
            IntervalFixtures.ANALYST_1,
            InvalidInputException.class));
  }

  @Test
  void testUpdateActivityIntervalStatus() {

    var startTimeInstant = Instant.EPOCH;
    var endTimeInstant = startTimeInstant.plusSeconds(300);
    var stageNames = Stream.of("TEST", "AUTO").collect(toSet());
    var stageIds = stageNames.stream().map(WorkflowDefinitionId::from).collect(toSet());
    var expectedInterval =
        MockIntervalData.get(startTimeInstant, endTimeInstant, stageIds).get("TEST").get(0);

    var validRequest =
        UpdateActivityIntervalStatusRequest.builder()
            .setStageIntervalId(IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST")))
            .setStatus(IntervalStatus.NOT_COMPLETE)
            .setTime(Instant.EPOCH)
            .setUserName("analyst 1")
            .setActivityIntervalId(
                IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("Event Review")))
            .build();

    given(
            workflowAccessor.updateIfPresent(
                eq(expectedInterval.getIntervalId()), updateStatusCaptor.capture()))
        .willAnswer(i -> updateStatusCaptor.getValue().apply(expectedInterval));

    // valid request to close
    assertDoesNotThrow(
        () ->
            postResult("/workflow-manager/interval/activity/update", validRequest, HttpStatus.OK));

    // should produce kafka message
    verify(systemEventPublisher).sendSystemEvent(any(SystemEvent.class));
  }
}
