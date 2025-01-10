package gms.shared.workflow.cache;

import static java.util.stream.Collectors.toSet;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.workflow.cache.util.WorkflowCacheFactory;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.NavigableMap;
import java.util.Optional;
import java.util.concurrent.locks.Lock;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import javax.cache.Cache;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.query.ScanQuery;
import org.apache.ignite.configuration.NearCacheConfiguration;

/**
 * Cache that delegates to an Apache Ignite {@link IgniteCache} for CRUD operations on {@link
 * StageInterval}s. Ignite is configured to contain key-value pairs of Stage names to {@link
 * NavigableMap}s of StageIntervals by start time. The combination of stage name and start time
 * define uniqueness for StageInterval, allowing this caching structure to contain all relevant
 * intervals without concerns of conflicting keys.
 */
public final class IgniteIntervalCache implements IntervalCache {

  private final IgniteCache<IntervalId, StageInterval> stageIntervalsByIntervalId;

  private IgniteIntervalCache(
      IgniteCache<IntervalId, StageInterval> stageIntervalsByNameAndStartTime) {
    this.stageIntervalsByIntervalId = stageIntervalsByNameAndStartTime;
  }

  /**
   * Factory method for instantiating the cache.
   *
   * @return The cache
   */
  public static IgniteIntervalCache create() {
    IgniteCache<IntervalId, StageInterval> stageIntervalsByNameAndTime =
        IgniteConnectionManager.getOrCreateCache(WorkflowCacheFactory.INTERVAL_CACHE);
    return new IgniteIntervalCache(stageIntervalsByNameAndTime);
  }

  /**
   * Factory method for instantiating the cache with a near cache, allowing clients to contain
   * cached entries locally in memory.
   *
   * @param nearCacheConfiguration Configuration for defining an Ignite near-cache
   * @return The cache
   */
  public static IgniteIntervalCache createWithNearCache(
      NearCacheConfiguration<IntervalId, StageInterval> nearCacheConfiguration) {
    IgniteCache<IntervalId, StageInterval> stageIntervalsByNameAndTime =
        IgniteConnectionManager.getOrCreateCache(
            WorkflowCacheFactory.INTERVAL_CACHE, nearCacheConfiguration);
    return new IgniteIntervalCache(stageIntervalsByNameAndTime);
  }

  /**
   * Checks if the cache currently contains an Interval with the provided IntervalId
   *
   * @param intervalId id of the checked interval
   * @return True if the cache contains the Interval, otherwise false
   */
  @Override
  public boolean containsKey(IntervalId intervalId) {
    return get(intervalId).isPresent();
  }

  /**
   * Single-value retrieval via the two necessary keys to identify a {@link StageInterval}: the
   * stage name and the start time
   *
   * @param stageName First retrieval key
   * @param startTime Second retrieval key
   * @return An Optional containing the StageInterval if it exists, or {@link Optional#empty()} if
   *     no data was found for the key-pair
   */
  @Override
  public Optional<StageInterval> get(String stageName, Instant startTime) {
    return get(IntervalId.from(startTime, WorkflowDefinitionId.from(stageName)));
  }

  /**
   * Retrieves an Optional StageInterval from the cache
   *
   * @param intervalId intervalId
   * @return The stage interval for the interval id, or {@link Optional#empty()} if no interval was
   *     found
   */
  @Override
  public Optional<StageInterval> get(IntervalId intervalId) {
    return Optional.ofNullable(stageIntervalsByIntervalId.get(intervalId));
  }

  /**
   * Atomically retrieves an Optional StageInterval from the cache. If present, will apply the
   * update function and cache the updated interval.
   *
   * @param stageIntervalId the interval Id to retrieve
   * @param update the update function to perform on the stageInterval
   * @return the Optional<? extends StageInterval> result of the update
   */
  @Override
  public Optional<StageInterval> update(
      IntervalId stageIntervalId, UnaryOperator<StageInterval> update) {

    var lock = acquireLock(stageIntervalId);
    try {
      lock.lock();
      var updatedStageInterval = get(stageIntervalId).map(update);
      updatedStageInterval.ifPresent(this::put);
      return updatedStageInterval;
    } finally {
      lock.unlock();
    }
  }

  /**
   * Atomically retrieves an Optional StageInterval from the cache and calls the update on it.
   * Method will store the result if the update method returns a non-empty Optional
   *
   * @param stageIntervalId the interval Id to retrieve
   * @param update the update function to perform on the stageInterval
   * @return the Optional<? extends StageInterval> result of the update
   */
  @Override
  public Optional<StageInterval> updateIfPresent(
      IntervalId stageIntervalId, Function<StageInterval, Optional<StageInterval>> update) {

    var lock = acquireLock(stageIntervalId);
    try {
      lock.lock();
      var updatedStageInterval = get(stageIntervalId).flatMap(update);
      updatedStageInterval.ifPresent(this::put);
      return updatedStageInterval;
    } finally {
      lock.unlock();
    }
  }

  /**
   * Range retrieval via the stage name and a range of times.
   *
   * @param stageName First retrieval key
   * @param startTime Start of the span of second retrieval keys, inclusive
   * @param endTime End of the span of second retrieval keys, exclusive
   * @return All {@link StageInterval}s with the provided stage name, whose start times fall within
   *     the provided time range
   */
  @Override
  public List<StageInterval> get(String stageName, Instant startTime, Instant endTime) {
    return getAll(List.of(stageName), startTime, endTime);
  }

  /**
   * Batch retrieval of all stage intervals with stage names in the input collection within the
   * input time range.
   *
   * @param stageNames First retrieval keys
   * @param startTime Start of the span of second retrieval keys, inclusive
   * @param endTime End of the span of second retrieval keys, exclusive
   * @return All Collection of {@link StageInterval}s with one of the provided stage names, whose
   *     start times fall within the provided time range
   */
  @Override
  public List<StageInterval> getAll(
      Collection<String> stageNames, Instant startTime, Instant endTime) {

    return stageIntervalsByIntervalId
        .query(new ScanQuery<IntervalId, StageInterval>())
        .getAll()
        .stream()
        .map(Cache.Entry::getValue)
        .filter(
            interval ->
                stageNames.contains(interval.getName())
                    && interval.getStartTime().isBefore(endTime)
                    && interval.getEndTime().isAfter(startTime))
        .toList();
  }

  /**
   * Retrieves all modification times for all stage intervals, and finds the maximum time.
   *
   * @return The latest modification time for all stage intervals
   */
  @Override
  public Optional<Instant> getLatestModificationTime() {
    return stageIntervalsByIntervalId
        .query(new ScanQuery<IntervalId, StageInterval>())
        .getAll()
        .stream()
        .map(entry -> entry.getValue().getModificationTime())
        .max(Instant::compareTo);
  }

  /**
   * Atomically Inserts or updates a single StageInterval. This method will lock the entire stage
   * before it updates or inserts.
   *
   * @param stageInterval StageInterval
   */
  @Override
  public void put(StageInterval stageInterval) {

    var lock = acquireLock(stageInterval.getIntervalId());
    try {
      lock.lock();
      stageIntervalsByIntervalId.put(stageInterval.getIntervalId(), stageInterval);
    } finally {
      lock.unlock();
    }
  }

  /**
   * Atomically Inserts or updates a collection of StageIntervals. This method will lock on each
   * stage name.
   *
   * @param stageIntervals StageIntervals
   */
  @Override
  public void putAll(Collection<? extends StageInterval> stageIntervals) {
    stageIntervals.forEach(this::put);
  }

  /** Clears all values within the cache */
  @Override
  public void clear() {
    stageIntervalsByIntervalId.clear();
  }

  /**
   * Atomically prunes each {@link StageInterval}s with endTimes <= olderThan time and removes it
   * from the cache
   *
   * @param olderThan Expiration time
   */
  @Override
  public void prune(Instant olderThan) {

    var keys =
        stageIntervalsByIntervalId
            .query(new ScanQuery<IntervalId, StageInterval>())
            .getAll()
            .stream()
            .filter(entry -> !entry.getValue().getEndTime().isAfter(olderThan))
            .map(Cache.Entry::getKey)
            .collect(toSet());

    keys.forEach(
        (IntervalId intervalId) -> {
          var lock = acquireLock(intervalId);
          try {
            lock.lock();
            stageIntervalsByIntervalId.remove(intervalId);
          } finally {
            lock.unlock();
          }
        });
  }

  /**
   * Returns a {@link Lock} allowing the caller to lock a given {@link StageInterval} in the cache
   * to prevent concurrent updates
   *
   * @param key the IntervalId of the StageInterval for which to return the Lock
   * @return A Lock allowing the caller to lock a given StageInterval in the cache to prevent
   *     concurrent updates
   */
  private Lock acquireLock(IntervalId key) {
    return stageIntervalsByIntervalId.lock(key);
  }
}
