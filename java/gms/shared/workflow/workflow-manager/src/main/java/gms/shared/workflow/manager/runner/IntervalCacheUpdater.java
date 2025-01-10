package gms.shared.workflow.manager.runner;

import static java.util.stream.Collectors.toSet;

import gms.shared.workflow.cache.IntervalCache;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.StageMode;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.repository.BridgedIntervalRepository;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Manages the updating of the interval cache to stay in sync with intervals in persistence for an
 * operational time period.
 *
 * <p>NOTE: This class directly autowires both the IntervalCache and the bridge repository. It is
 * important to guarantee that you are only deleting intervals from the cache and only fetching
 * intervals directly from the bridge. Any adjustments to the type declarations of these should be
 * managed with care to prevent runtime errors (e.g. deleting intervals from the database,
 * retrieving intervals from the cache and never updating).
 */
@Component
public class IntervalCacheUpdater {

  private static final Logger LOGGER = LoggerFactory.getLogger(IntervalCacheUpdater.class);
  private static final long REASONABLE_MINIMUM_EPOCH_SECONDS = -2_208_988_800L;

  private final Workflow workflow;
  private final IntervalCache intervalCache;
  private final BridgedIntervalRepository intervalRepository;
  private final AtomicReference<Instant> latestModTime = new AtomicReference<>();

  @Autowired
  public IntervalCacheUpdater(
      Workflow workflow,
      IntervalCache intervalCache,
      BridgedIntervalRepository intervalRepository) {
    this.workflow = workflow;
    this.intervalCache = intervalCache;
    this.intervalRepository = intervalRepository;
    this.latestModTime.set(Instant.ofEpochSecond(REASONABLE_MINIMUM_EPOCH_SECONDS));
  }

  /**
   * Main cache update method responsible for keeping the IntervalCache up-to-date with persisted
   * stage intervals for the operational time period. Note the first time this runs we will fetch
   * all intervals for this operational period. After this the updater has an understanding of the
   * latest mod time it's seen, and will only fetch intervals newer than that mod time.
   *
   * @param operationalPeriod period of time that the cache is synced to persistence
   * @return the newly cached intervals
   */
  public Set<StageInterval> updateIntervalCache(OperationalPeriod operationalPeriod) {
    LOGGER.debug("Updating Workflow Interval Cache...");
    var stageIds = workflow.stageIds().collect(toSet());

    var operationalTimeStart = operationalPeriod.getOperationalStartTime();
    var operationalTimeEnd = operationalPeriod.getOperationalEndTime();

    LOGGER.debug("Pruning intervals older than {}", operationalTimeStart);
    intervalCache.prune(operationalTimeStart);

    LOGGER.debug("Finding intervals modified after {}", latestModTime.get());
    var stageIntervals =
        intervalRepository.findStageIntervalsByStageIdAndTime(
            operationalTimeStart, operationalTimeEnd, stageIds, latestModTime.get());

    var intervalsToCache =
        stageIntervals.values().stream()
            .flatMap(List::stream)
            .filter(intervalsToCache())
            .collect(toSet());

    if (!intervalsToCache.isEmpty()) {
      LOGGER.debug("{} intervals will be cached", intervalsToCache.size());
      intervalCache.putAll(intervalsToCache);

      intervalsToCache.stream()
          .map(StageInterval::getModificationTime)
          .max(Instant::compareTo)
          .ifPresent(latestModTime::set);
    }

    LOGGER.debug("Workflow Interval Cache Update Complete");
    return intervalsToCache;
  }

  private Predicate<StageInterval> intervalsToCache() {
    return stageInterval ->
        stageInterval.getStageMode() == StageMode.AUTOMATIC
            || !intervalCache.containsKey(stageInterval.getIntervalId());
  }

  /**
   * Utility method for checking the latest mod time of already-cached intervals, and syncing
   * latestModTime to it.
   */
  public void syncLatestModTime() {
    intervalCache.getLatestModificationTime().ifPresent(this::setLatestModTime);
  }

  Instant getLatestModTime() {
    return latestModTime.get();
  }

  void setLatestModTime(Instant modTime) {
    latestModTime.set(modTime);
  }
}
