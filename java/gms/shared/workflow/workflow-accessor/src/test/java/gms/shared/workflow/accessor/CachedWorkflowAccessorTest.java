package gms.shared.workflow.accessor;

import static java.util.stream.Collectors.toSet;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import gms.shared.workflow.cache.IntervalCache;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.MockIntervalData;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.repository.IntervalRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CachedWorkflowAccessorTest {

  @Mock Workflow mockWorkflow;

  @Mock IntervalRepository mockRepository;

  @Mock IntervalCache mockCache;

  CachedWorkflowAccessor workflowAccessor;

  @BeforeEach
  void setUp() {
    workflowAccessor = new CachedWorkflowAccessor(mockWorkflow, mockCache);
  }

  @Test
  void testGetWorkflow() {
    assertEquals(mockWorkflow, workflowAccessor.getWorkflow());
    System.out.println(Instant.now());
  }

  @Test
  void testFindStageIntervalsByStageIdAndTime() {
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    Set<String> stageNames = Stream.of("AUTO-TEST", "TEST-1", "TEST-2").collect(toSet());
    Set<WorkflowDefinitionId> stageIds =
        stageNames.stream().map(WorkflowDefinitionId::from).collect(toSet());
    Map<String, List<StageInterval>> expectedIntervals =
        MockIntervalData.get(startTime, endTime, stageIds);

    given(mockCache.getAll(stageNames, startTime, endTime))
        .willReturn(
            expectedIntervals.values().stream().flatMap(List::stream).collect(Collectors.toList()));
    Map<String, List<StageInterval>> actualIntervals =
        workflowAccessor.findStageIntervalsByStageIdAndTime(startTime, endTime, stageIds);
    assertEquals(expectedIntervals, actualIntervals);
    verify(mockCache).getAll(stageNames, startTime, endTime);
  }

  @Test
  void testFindStageIntervalById() {

    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    var stageNames = Stream.of("AUTO-TEST").collect(toSet());
    var stageIds = stageNames.stream().map(WorkflowDefinitionId::from).collect(toSet());

    var expectedStageInterval =
        MockIntervalData.get(startTime, endTime, stageIds).get("AUTO-TEST").get(0);

    var intervalId = IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST-1"));
    given(mockCache.get(intervalId)).willReturn(Optional.of(expectedStageInterval));

    Assertions.assertEquals(
        Optional.of(expectedStageInterval), workflowAccessor.findStageIntervalById(intervalId));

    var notCachedInterval = IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST-2"));
    Assertions.assertEquals(
        Optional.empty(), workflowAccessor.findStageIntervalById(notCachedInterval));
  }

  @Test
  void testUpdateCallsDelegate() {
    var stageIntervalId = IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST"));
    UnaryOperator<StageInterval> updateFn = s -> s;
    workflowAccessor.update(stageIntervalId, updateFn);
    verify(mockCache).update(stageIntervalId, updateFn);
  }

  @Test
  void testUpdateIfPresentCallsDelegate() {
    var stageIntervalId = IntervalId.from(Instant.EPOCH, WorkflowDefinitionId.from("TEST"));
    Function<StageInterval, Optional<StageInterval>> updateFn = Optional::of;
    workflowAccessor.updateIfPresent(stageIntervalId, updateFn);
    verify(mockCache).updateIfPresent(stageIntervalId, updateFn);
  }
}
