package gms.shared.workflow.accessor;

import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.repository.IntervalRepository;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.UnaryOperator;

/**
 * Accessor interface of the Manager/Accessor/Repository pattern for the Workflow domain.
 * Responsible for Managing a cache of the {@link Workflow} and all {@link
 * gms.shared.workflow.coi.Interval}s within the operational time period. Delegates storage of
 * intervals to an underlying {@link IntervalRepository}
 */
public interface WorkflowAccessor extends IntervalRepository {

  /**
   * Returns the current {@link Workflow}
   *
   * @return The current Workflow
   */
  Workflow getWorkflow();

  /**
   * Retrieves an Optional StageInterval from the cache
   *
   * @param intervalId intervalId
   * @return The stage interval for the interval id, or {@link Optional#empty()} if no interval was
   *     found
   */
  Optional<StageInterval> findStageIntervalById(IntervalId intervalId);

  /**
   * Atomically retrieves an Optional StageInterval from the cache and calls the UnaryOperator on
   * it. Method will store the result if the update method returns a non-empty Optional
   *
   * @param stageIntervalId the interval Id to retrieve
   * @param update the update function to perform on the stageInterval
   * @return the Optional<? extends StageInterval> result of the update
   */
  Optional<StageInterval> update(IntervalId stageIntervalId, UnaryOperator<StageInterval> update);

  /**
   * Atomically retrieves an Optional StageInterval from the cache and calls the update function on
   * it. Method will store the result if the update method returns a non-empty Optional
   *
   * @param stageIntervalId the interval Id to retrieve
   * @param update the update function to perform on the stageInterval
   * @return the Optional<? extends StageInterval> result of the update
   */
  Optional<StageInterval> updateIfPresent(
      IntervalId stageIntervalId, Function<StageInterval, Optional<StageInterval>> update);
}
