package gms.shared.workflow.cache;

import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.StageInterval;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.UnaryOperator;

/** */
public interface IntervalCache {

  /** Clears all values within the cache */
  void clear();

  /**
   * Checks if the cache currently contains an Interval with the provided IntervalId
   *
   * @param intervalId id of the checked interval
   * @return True if the cache contains the Interval, otherwise false
   */
  boolean containsKey(IntervalId intervalId);

  /**
   * Single-value retrieval via the two necessary keys to identify a {@link StageInterval}: the
   * stage name and the start time
   *
   * @param stageName First retrieval key
   * @param startTime Second retrieval key
   * @return An Optional containing the StageInterval if it exists, or {@link Optional#empty()} if
   *     no data was found for the key-pair
   */
  Optional<StageInterval> get(String stageName, Instant startTime);

  /**
   * Retrieves an Optional StageInterval from the cache
   *
   * @param intervalId intervalId
   * @return The stage interval for the interval id, or {@link Optional#empty()} if no interval was
   *     found
   */
  Optional<StageInterval> get(IntervalId intervalId);

  /**
   * Range retrieval via the stage name and a range of times.
   *
   * @param stageName First retrieval key
   * @param startTime Start of the span of second retrieval keys, inclusive
   * @param endTime End of the span of second retrieval keys, exclusive
   * @return All {@link StageInterval}s with the provided stage name, whose start times fall within
   *     the provided time range
   */
  List<StageInterval> get(String stageName, Instant startTime, Instant endTime);

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
  List<StageInterval> getAll(Collection<String> stageNames, Instant startTime, Instant endTime);

  /**
   * Retrieves all modification times for all stage intervals, and finds the maximum time.
   *
   * @return The latest modification time for all stage intervals
   */
  Optional<Instant> getLatestModificationTime();

  /**
   * Atomically prunes each {@link StageInterval}s with endTimes <= olderThan time and removes it
   * from the cache
   *
   * <p>
   *
   * @param olderThan Expiration time
   */
  void prune(Instant olderThan);

  /**
   * Atomically Inserts or updates a single StageInterval. This method will lock the entire stage
   * before it updates or inserts.
   *
   * @param stageInterval StageInterval
   */
  void put(StageInterval stageInterval);

  /**
   * Atomically Inserts or updates a collection of StageIntervals. This method will lock on each
   * stage name.
   *
   * @param stageIntervals StageIntervals
   */
  void putAll(Collection<? extends StageInterval> stageIntervals);

  /**
   * Atomically retrieves an Optional StageInterval from the cache. If present, will apply the
   * update function and cache the updated interval.
   *
   * @param stageIntervalId the interval Id to retrieve
   * @param update the update function to perform on the stageInterval
   * @return the Optional<? extends StageInterval> result of the update
   */
  Optional<StageInterval> update(IntervalId stageIntervalId, UnaryOperator<StageInterval> update);

  /**
   * Atomically retrieves an Optional StageInterval from the cache and calls the update on it.
   * Method will store the result if the update method returns a non-empty Optional
   *
   * @param stageIntervalId the interval Id to retrieve
   * @param update the update function to perform on the stageInterval
   * @return the Optional<? extends StageInterval> result of the update
   */
  Optional<StageInterval> updateIfPresent(
      IntervalId stageIntervalId, Function<StageInterval, Optional<StageInterval>> update);
}
