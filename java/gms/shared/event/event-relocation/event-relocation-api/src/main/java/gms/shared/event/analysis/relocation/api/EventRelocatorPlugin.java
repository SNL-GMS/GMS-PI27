package gms.shared.event.analysis.relocation.api;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.LocationSolution;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/** Defines a plugin implementation that relocates {@link EventHypothesis} objects. */
public interface EventRelocatorPlugin {

  /**
   * Relocates the provided {@link EventHypothesis} using the provided relocation processing
   * parameters. Each {@link LocationSolution} in the output collection is associated with a single
   * {@link LocationRestraint} in the input {@link EventRelocationDefinition}.
   *
   * @param eventHypothesis The {@link EventHypothesis} to be relocated
   * @param eventRelocationDefinition Contains information that defines {@link FeatureMeasurement}
   *     objects and a collection of {@link LocationRestraint}s
   * @param eventRelocationDefinitionByPhaseType A map linking the {@link PhaseType}s to ordered
   *     collections of {@link EventRelocationPredictorDefinition}s; the order of the {@link
   *     EventRelocationPredictorDefinition}s defines their precedence
   * @param eventRelocationProcessingDefinition Contains additional configurable parameters
   * @return The collection of calculated {@link LocationSolution}s
   */
  Collection<LocationSolution> relocate(
      EventHypothesis eventHypothesis,
      EventRelocationDefinition eventRelocationDefinition,
      Map<PhaseType, List<EventRelocationPredictorDefinition>> eventRelocationDefinitionByPhaseType,
      EventRelocationProcessingDefinition eventRelocationProcessingDefinition);
}
