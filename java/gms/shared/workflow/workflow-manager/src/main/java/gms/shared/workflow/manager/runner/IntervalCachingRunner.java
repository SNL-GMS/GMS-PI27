package gms.shared.workflow.manager.runner;

import gms.shared.system.events.SystemEvent;
import gms.shared.system.events.SystemEventPublisher;
import gms.shared.workflow.manager.configuration.WorkflowManagerConfigurationUtility;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;

/**
 * Runner responsible for the scheduling of interval polling, caching and pruning based around
 * current system time and the operational time period.
 *
 * <p>The overall design of Workflow Manager requires that all new and updated Intervals be made
 * available in the IntervalCache. These are retrieved via the WorkflowAccessor for use in http
 * requests by the WorkflowManager.
 *
 * <p>The IntervalPollingJob will run on fixed intervals, loading the cache with data from
 * persistence
 */
@Component
@Order
public class IntervalCachingRunner implements ApplicationRunner {

  private static final Logger LOGGER = LoggerFactory.getLogger(IntervalCachingRunner.class);

  private final IntervalCacheUpdater intervalCacheUpdater;
  private final SystemEventPublisher systemEventPublisher;
  private final WorkflowManagerConfigurationUtility workflowManagerConfigUtil;
  private final TaskScheduler taskScheduler;

  @Autowired
  public IntervalCachingRunner(
      IntervalCacheUpdater intervalCacheUpdater,
      SystemEventPublisher systemEventPublisher,
      WorkflowManagerConfigurationUtility workflowManagerConfigUtil,
      TaskScheduler taskScheduler) {
    this.intervalCacheUpdater = intervalCacheUpdater;
    this.systemEventPublisher = systemEventPublisher;
    this.workflowManagerConfigUtil = workflowManagerConfigUtil;
    this.taskScheduler = taskScheduler;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    LOGGER.info("Initializing interval cache updating...");
    Supplier<OperationalPeriod> operationalPeriodSupplier =
        () ->
            OperationalPeriod.now(
                workflowManagerConfigUtil.resolveOperationalStartPeriod(),
                workflowManagerConfigUtil.resolveOperationalEndPeriod());

    LOGGER.info("Syncing latest mod time with current cache state...");
    intervalCacheUpdater.syncLatestModTime();

    LOGGER.info("Scheduling IntervalCache Updates...");
    var intervalCacheUpdateRunnable =
        new IntervalCacheUpdateRunnable(
            intervalCacheUpdater,
            systemEventPublisher,
            operationalPeriodSupplier,
            workflowManagerConfigUtil.getSystemMessageEventType());

    var cacheUpdateHandle =
        taskScheduler.scheduleAtFixedRate(
            intervalCacheUpdateRunnable, workflowManagerConfigUtil.resolveBridgePollingPeriod());
    Runtime.getRuntime().addShutdownHook(new Thread(() -> cacheUpdateHandle.cancel(true)));
    LOGGER.info("Interval cache update initialization complete");
  }

  static class IntervalCacheUpdateRunnable implements Runnable {

    private final IntervalCacheUpdater intervalCacheUpdater;
    private final SystemEventPublisher systemEventPublisher;
    private final Supplier<OperationalPeriod> operationalPeriodSupplier;
    private final String systemMessageEventType;

    public IntervalCacheUpdateRunnable(
        IntervalCacheUpdater intervalCacheUpdater,
        SystemEventPublisher systemEventPublisher,
        Supplier<OperationalPeriod> operationalPeriodSupplier,
        String systemMessageEventType) {
      this.intervalCacheUpdater = intervalCacheUpdater;
      this.systemEventPublisher = systemEventPublisher;
      this.systemMessageEventType = systemMessageEventType;
      this.operationalPeriodSupplier = operationalPeriodSupplier;
    }

    @Override
    public void run() {
      var newIntervals = intervalCacheUpdater.updateIntervalCache(operationalPeriodSupplier.get());
      if (!newIntervals.isEmpty()) {
        var systemEvent = SystemEvent.from(systemMessageEventType, newIntervals, 0);
        systemEventPublisher.sendSystemEvent(systemEvent);
      }
    }
  }
}
