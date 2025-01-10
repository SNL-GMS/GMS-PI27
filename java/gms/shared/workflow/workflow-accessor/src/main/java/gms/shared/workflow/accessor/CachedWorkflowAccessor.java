package gms.shared.workflow.accessor;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.toSet;

import gms.shared.workflow.cache.IntervalCache;
import gms.shared.workflow.coi.IntervalId;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Accessor implementation of the Manager/Accessor/Repository pattern for the Workflow domain.
 * Provides workflow-related COI access through caches of the {@link Workflow} and all {@link
 * gms.shared.workflow.coi.Interval}s within the operational time period.
 */
@Component("workflow-accessor")
public class CachedWorkflowAccessor implements WorkflowAccessor {

  private final Workflow workflow;
  private final IntervalCache intervalCache;

  /**
   * @param workflow Input workflow definition to be cached
   * @param intervalCache Injected cache containing {@link StageInterval}s
   */
  @Autowired
  public CachedWorkflowAccessor(Workflow workflow, IntervalCache intervalCache) {
    this.workflow = workflow;
    this.intervalCache = intervalCache;
  }

  /** {@inheritDoc} */
  @Override
  public Workflow getWorkflow() {
    return workflow;
  }

  /** {@inheritDoc} */
  @Override
  public Optional<StageInterval> findStageIntervalById(IntervalId intervalId) {
    return intervalCache.get(intervalId);
  }

  /**
   * {@inheritDoc}
   *
   * @return
   */
  @Override
  public Optional<StageInterval> update(
      IntervalId stageIntervalId, UnaryOperator<StageInterval> update) {
    return intervalCache.update(stageIntervalId, update);
  }

  /**
   * {@inheritDoc}
   *
   * @return
   */
  @Override
  public Optional<StageInterval> updateIfPresent(
      IntervalId stageIntervalId, Function<StageInterval, Optional<StageInterval>> update) {
    return intervalCache.updateIfPresent(stageIntervalId, update);
  }

  /** {@inheritDoc} */
  @Override
  public Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(
      Instant startTime, Instant endTime, Collection<WorkflowDefinitionId> stageIds) {
    Set<String> stageNames = stageIds.stream().map(WorkflowDefinitionId::getName).collect(toSet());

    return intervalCache.getAll(stageNames, startTime, endTime).stream()
        .collect(groupingBy(StageInterval::getName));
  }
}
