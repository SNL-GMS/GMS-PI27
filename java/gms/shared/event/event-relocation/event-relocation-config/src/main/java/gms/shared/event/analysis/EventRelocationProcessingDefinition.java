package gms.shared.event.analysis;

import com.google.auto.value.AutoBuilder;
import com.google.common.base.Preconditions;
import gms.shared.event.coi.LocationRestraint;
import java.util.Collection;
import java.util.List;

/**
 * Value class containing the configurable values the client provides to
 * EventRelocationControl::relocate
 */
public record EventRelocationProcessingDefinition(
    ResidualDefinition residualDefinition,
    Collection<LocationUncertaintyDefinition> locationUncertaintyDefinitions,
    List<LocationRestraint> locationRestraints,
    String eventRelocator,
    EventRelocationPredictorDefinition defaultPredictorDefinition,
    Collection<EventRelocationPredictorDefinition> eventRelocationPredictorDefinitions) {

  /**
   * Value class containing the configurable values the client provides to
   * EventRelocationControl::relocate
   *
   * @param residualDefinition parameters that define the residual allowance
   * @param locationUncertaintyDefinitions each element in this collection represents a single error
   *     {@link Ellipse} or {@link Ellipsoid} the client requests the EventRelocationControl to
   *     compute; cannot be empty
   * @param locationRestraints each element in this collection represents a single error {@link
   *     Ellipse} or {@link Ellipsoid} the client requests the EventRelocationControl to compute;
   *     cannot be empty
   * @param eventRelocator the non-null name of an {@link EventRelocatorPlugin} implementation;
   *     cannot be a blank string
   * @param defaultPredictorDefinition the default {@link FeaturePredictorPlugin} and earth model
   *     plugin the {@link EventRelocatorPlugin} implementation will use to predict signal features
   * @param eventRelocationPredictorDefinitions the earth model plugins used by each {@link
   *     FeaturePredictorPlugin}; only one {@link EventRelocationPredictorDefinition} can appear in
   *     this collection for each predictor
   */
  public EventRelocationProcessingDefinition {
    Preconditions.checkArgument(
        !locationUncertaintyDefinitions.isEmpty(),
        "locationUncertaintyDefinitions cannot be empty");
    Preconditions.checkArgument(
        !locationRestraints.isEmpty(), "locationRestraints cannot be empty");
    Preconditions.checkArgument(!eventRelocator.isBlank(), "eventRelocator cannot be blank");

    var numEntries = eventRelocationPredictorDefinitions.size();
    var numUniqueEntries =
        eventRelocationPredictorDefinitions.stream().map(d -> d.predictor()).distinct().count();

    Preconditions.checkArgument(
        numEntries == numUniqueEntries,
        "Duplicate predictors cannot appear in eventRelocationPredictorDefinitions");
  }

  /**
   * Returns the {@link EventRelocationPredictorDefinition} associated with a given predictor. The
   * default definition is returned if no associated definition exists.
   *
   * @param predictor the given predictor
   * @return the associated {@link EventRelocationPredictorDefinition} if a match is found in
   *     eventRelocationPredictorDefinitions, or the defaultPredictorDefinition if no match is found
   */
  public EventRelocationPredictorDefinition getEventRelocationPredictorDefinition(
      String predictor) {
    for (var definition : eventRelocationPredictorDefinitions) {
      if (definition.predictor().equals(predictor)) {
        return definition;
      }
    }

    return defaultPredictorDefinition;
  }

  public static EventRelocationProcessingDefinition.Builder builder() {
    return new AutoBuilder_EventRelocationProcessingDefinition_Builder();
  }

  public static EventRelocationProcessingDefinition.Builder builder(
      EventRelocationProcessingDefinition erpd) {
    return new AutoBuilder_EventRelocationProcessingDefinition_Builder(erpd);
  }

  public EventRelocationProcessingDefinition.Builder toBuilder() {
    return new AutoBuilder_EventRelocationProcessingDefinition_Builder(this);
  }

  @AutoBuilder
  public interface Builder {

    /** Parameters that define the residual allowance */
    Builder setResidualDefinition(ResidualDefinition residualDefinition);

    /**
     * Each element in this non-empty collection represents a single error {@link Ellipse} or {@link
     * Ellipsoid} the client requests the EventRelocationControl to compute
     */
    Builder setLocationUncertaintyDefinitions(
        Collection<LocationUncertaintyDefinition> locationUncertaintyDefinitions);

    /**
     * Each element in this non-empty collection represents a single type of restrained {@link
     * LocationSolution} the client requests the EventRelocationControl to compute
     */
    Builder setLocationRestraints(Collection<LocationRestraint> locationRestraints);

    /** The name of an {@link EventRelocatorPlugin} implementation */
    Builder setEventRelocator(String eventRelocator);

    /**
     * The default {@link FeaturePredictorPlugin} and earth model plugin the {@link
     * EventRelocatorPlugin} implementation will use to predict signal features
     */
    Builder setDefaultPredictorDefinition(
        EventRelocationPredictorDefinition defaultPredictorDefinition);

    /**
     * The earth model plugins used by each {@link FeaturePredictorPlugin}. Only one {@link
     * EventRelocationPredictorDefinition} can appear in this collection for each predictor.
     */
    Builder setEventRelocationPredictorDefinitions(
        Collection<EventRelocationPredictorDefinition> eventRelocationPredictorDefinitions);

    EventRelocationProcessingDefinition build();
  }
}
