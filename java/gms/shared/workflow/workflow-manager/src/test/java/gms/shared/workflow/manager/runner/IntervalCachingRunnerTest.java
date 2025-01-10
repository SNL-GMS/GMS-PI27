package gms.shared.workflow.manager.runner;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import gms.shared.system.events.SystemEvent;
import gms.shared.system.events.SystemEventPublisher;
import gms.shared.workflow.coi.IntervalFixtures;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility;
import gms.shared.workflow.manager.runner.IntervalCachingRunner.IntervalCacheUpdateRunnable;
import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.scheduling.TaskScheduler;

@ExtendWith(MockitoExtension.class)
class IntervalCachingRunnerTest {

  static final Duration operationalStartPeriod = Duration.ofHours(48);
  static final Duration operationalEndPeriod = Duration.ofHours(1);

  @Mock IntervalCacheUpdater mockUpdater;

  @Mock SystemEventPublisher mockPublisher;

  @Mock WorkflowManagerConfigurationUtility mockConfigUtil;

  @Mock TaskScheduler mockScheduler;

  @Captor ArgumentCaptor<IntervalCacheUpdateRunnable> runnableCaptor;

  private gms.shared.workflow.manager.runner.IntervalCachingRunner intervalCachingRunner;

  @BeforeEach
  void setup() {
    this.intervalCachingRunner =
        new IntervalCachingRunner(mockUpdater, mockPublisher, mockConfigUtil, mockScheduler);
  }

  @Test
  void testRun() throws Exception {
    var pollingPeriod = Duration.ofSeconds(30L);
    var eventType = "test";

    given(mockConfigUtil.resolveOperationalStartPeriod()).willReturn(operationalStartPeriod);
    given(mockConfigUtil.resolveOperationalEndPeriod()).willReturn(operationalEndPeriod);
    given(mockConfigUtil.resolveBridgePollingPeriod()).willReturn(pollingPeriod);
    given(mockConfigUtil.getSystemMessageEventType()).willReturn(eventType);

    intervalCachingRunner.run(new DefaultApplicationArguments());
    verify(mockUpdater).syncLatestModTime();
    verify(mockScheduler).scheduleAtFixedRate(runnableCaptor.capture(), eq(pollingPeriod));

    Set<StageInterval> intervals =
        Set.of(IntervalFixtures.notStartedInteractiveAnalysisStageInterval);
    var systemEvent = SystemEvent.from(eventType, intervals, 0);
    given(mockUpdater.updateIntervalCache(any())).willReturn(intervals);

    runnableCaptor.getValue().run();

    verify(mockUpdater).updateIntervalCache(any());
    verify(mockPublisher).sendSystemEvent(systemEvent);
  }
}
