package gms.shared.workflow.manager.runner;

import static java.util.stream.Collectors.toSet;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willReturn;
import static org.mockito.Mockito.verify;

import gms.shared.workflow.cache.IntervalCache;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.MockIntervalData;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.repository.BridgedIntervalRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IntervalCacheUpdaterTest {

  @Mock Workflow mockWorkflow;

  @Mock IntervalCache mockIntervalCache;

  @Mock BridgedIntervalRepository mockBridgedIntervalRepository;

  IntervalCacheUpdater intervalCacheUpdater;

  @BeforeEach
  void setup() {
    this.intervalCacheUpdater =
        new IntervalCacheUpdater(mockWorkflow, mockIntervalCache, mockBridgedIntervalRepository);
  }

  @Test
  void testUpdateIntervalCache() {
    var stageIds =
        Stream.of("Auto 1", "Test 1", "Auto 2", "Test 2")
            .map(WorkflowDefinitionId::from)
            .collect(toSet());
    given(mockWorkflow.stageIds()).willReturn(stageIds.stream());

    var startTime = Instant.EPOCH;
    var endTime = Instant.EPOCH.plusSeconds(300);
    var latestModTime = startTime;
    var stageIntervals = MockIntervalData.get(startTime, endTime, stageIds);
    given(
            mockBridgedIntervalRepository.findStageIntervalsByStageIdAndTime(
                startTime, endTime, stageIds, startTime))
        .willReturn(stageIntervals);

    given(mockIntervalCache.getLatestModificationTime()).willReturn(Optional.of(latestModTime));
    intervalCacheUpdater.syncLatestModTime();
    assertEquals(startTime, intervalCacheUpdater.getLatestModTime());

    IntervalId cachedIntervalId = stageIntervals.get("Test 1").get(0).getIntervalId();
    IntervalId notCachedIntervalId = stageIntervals.get("Test 2").get(0).getIntervalId();
    willReturn(true).given(mockIntervalCache).containsKey(cachedIntervalId);
    willReturn(false).given(mockIntervalCache).containsKey(notCachedIntervalId);

    var expectedIntervals =
        Set.of(
            stageIntervals.get("Auto 1").get(0),
            stageIntervals.get("Auto 2").get(0),
            stageIntervals.get("Test 2").get(0));
    var actualIntervals =
        intervalCacheUpdater.updateIntervalCache(OperationalPeriod.create(startTime, endTime));

    assertEquals(expectedIntervals, actualIntervals);
    assertEquals(endTime, intervalCacheUpdater.getLatestModTime());
    verify(mockIntervalCache).prune(startTime);
    verify(mockBridgedIntervalRepository)
        .findStageIntervalsByStageIdAndTime(startTime, endTime, stageIds, latestModTime);
    verify(mockIntervalCache).putAll(expectedIntervals);
  }
}
