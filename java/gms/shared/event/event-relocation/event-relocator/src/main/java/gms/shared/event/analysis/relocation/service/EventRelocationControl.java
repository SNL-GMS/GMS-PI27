package gms.shared.event.analysis.relocation.service;

import com.google.common.collect.ImmutableTable;
import com.google.common.collect.Table;
import com.google.common.collect.Tables;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.relocation.api.EventRelocatorPlugin;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.api.DefiningFeatureDefinition;
import gms.shared.event.api.DefiningFeatureMapByChannelAndPhaseType;
import gms.shared.event.api.DefiningFeatureMapRequest;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.LocationSolution;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.stationdefinition.coi.channel.Channel;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.stereotype.Service;

@Service
@ComponentScan(basePackages = {"gms.shared.event.analysis.relocation", "gms.shared.spring"})
public class EventRelocationControl {

  private final EventRelocationConfigurationResolver eventRelocationConfigurationResolver;

  private final Map<String, EventRelocatorPlugin> eventRelocatorPluginMap;

  /**
   * Create the control class using the provided resolver. Note that this is the GMS architecture
   * concept of a control, not the spring concept of a controller.
   *
   * @param eventRelocationConfigurationResolver The configuration resolver to use.
   * @param eventRelocatorPluginMap the map containing relocator plugins to use for relocation.
   */
  @Autowired
  EventRelocationControl(
      EventRelocationConfigurationResolver eventRelocationConfigurationResolver,
      Map<String, EventRelocatorPlugin> eventRelocatorPluginMap) {
    this.eventRelocatorPluginMap = Map.copyOf(eventRelocatorPluginMap);
    this.eventRelocationConfigurationResolver = eventRelocationConfigurationResolver;
  }

  /**
   * Resolve and return the single EventRelocationProcessingDefinition that exists in configuratiun.
   *
   * @return Resolved EventRelocationProcessingDefinition
   */
  public EventRelocationProcessingDefinition getEventRelocationProcessingDefinition() {
    return eventRelocationConfigurationResolver.getDefaultEventRelocationProcessingDefinition();
  }

  /**
   * Resolved and return a mapping from provided {@link PhaseType}s to their associated {@link
   * EventRelocationPredictorDefinition}s
   *
   * @param phaseTypes the phase types to resolve configuration against
   * @return The configured mapping of phase types to predictor definitions
   */
  public Map<PhaseType, EventRelocationPredictorDefinition>
      getEventRelocationPredictorDefinitionByPhaseType(Set<PhaseType> phaseTypes) {
    return phaseTypes.stream()
        .map(
            phase ->
                Map.entry(
                    phase,
                    eventRelocationConfigurationResolver.getEventRelocationPredictorDefinition(
                        phase)))
        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
  }

  /**
   * For each pair of possible {@link Channel} and {@link PhaseType} in the request collections,
   * resolves from configuration. Returns a {@link DefiningFeatureMapByChannelAndPhaseType}. Each
   * value of the returned object is a {@link DefiningFeatureMap}
   *
   * @param request A collection of {@link Channel}s and {@link PhaseType}s
   * @return DefiningFeatureMapByChannelAndPhaseType
   */
  public DefiningFeatureMapByChannelAndPhaseType getDefiningFeatureMaps(
      DefiningFeatureMapRequest request) {

    var phases = request.phases();
    var channels = request.channels();

    record PhaseChannel(PhaseType phase, Channel channel) {}
    var phaseChannelCartesianProductStream =
        phases.stream()
            .distinct()
            .flatMap(
                phase ->
                    channels.stream()
                        .map(channel -> new PhaseChannel(phase, channel.toEntityReference())));

    record PhaseChannelDefaultFeature(
        PhaseType phase,
        Channel channel,
        DefiningFeatureByFeatureMeasurementType definingFeature) {}

    var phaseChannelDefaultFeatureStream =
        phaseChannelCartesianProductStream
            .distinct()
            .map(
                phaseChannel ->
                    new PhaseChannelDefaultFeature(
                        phaseChannel.phase,
                        phaseChannel.channel,
                        eventRelocationConfigurationResolver.getDefaultDefiningFeatures(
                            phaseChannel.channel(), phaseChannel.phase())));

    var configTable =
        phaseChannelDefaultFeatureStream
            .map(
                entry ->
                    Tables
                        .<PhaseType, String,
                            Map<FeatureMeasurementType<?>, DefiningFeatureDefinition>>
                            immutableCell(
                                entry.phase,
                                entry.channel.getName(),
                                entry.definingFeature.definingFeatureByFeatureMeasurementType()))
            .collect(
                ImmutableTable.toImmutableTable(
                    Table.Cell::getRowKey,
                    Table.Cell::getColumnKey,
                    Table.Cell::getValue,
                    (a1, a2) -> a1));

    return new DefiningFeatureMapByChannelAndPhaseType(configTable);
  }

  /**
   * Relocate a set of event hypothesis.
   *
   * @param eventRelocationDefinitionByEventHypothesis Map with each EventHypotheis as a key to the
   *     EventRelocationDefinition containing relocate information specific to the EventHypothsis
   * @param eventRelocationPredictorDefinitionByPhaseType Map of PhaseType to the set of
   *     EventRelocationPredictorDefintions, which define the predictors that can be used for the
   *     phase
   * @param eventRelocationProcessingDefinition Parameters that are the same for all EventHypotheses
   *     and PhaseTypes.
   * @return The input EventHypotheses with a new set of LocationSolutions calculated by the
   *     relocator plugin.
   */
  public Collection<EventHypothesis> relocate(
      Map<EventHypothesis, EventRelocationDefinition> eventRelocationDefinitionByEventHypothesis,
      Map<PhaseType, List<EventRelocationPredictorDefinition>>
          eventRelocationPredictorDefinitionByPhaseType,
      EventRelocationProcessingDefinition eventRelocationProcessingDefinition) {

    var eventRelocatorPlugin =
        eventRelocatorPluginMap.get(eventRelocationProcessingDefinition.eventRelocator());

    return eventRelocationDefinitionByEventHypothesis.entrySet().parallelStream()
        .map(
            entry ->
                Map.entry(
                    entry.getKey(),
                    eventRelocatorPlugin.relocate(
                        entry.getKey(),
                        entry.getValue(),
                        eventRelocationPredictorDefinitionByPhaseType,
                        eventRelocationProcessingDefinition)))
        .map(
            entry ->
                createRelocatedEventHypothesis(
                    entry.getKey(), entry.getValue(), eventRelocationProcessingDefinition))
        .collect(Collectors.toSet());
  }

  private static EventHypothesis createRelocatedEventHypothesis(
      EventHypothesis baseEventHypothesis,
      Collection<LocationSolution> newLocationSolutions,
      EventRelocationProcessingDefinition eventRelocationProcessingDefinition) {

    var data =
        baseEventHypothesis
            .getData()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "Output EventHypothesis needs to be fully populated."));

    var dataBuilder = data.toBuilder();

    return baseEventHypothesis.toBuilder()
        .setData(
            dataBuilder
                .setLocationSolutions(newLocationSolutions)
                .setPreferredLocationSolution(
                    findPreferredLocationSolution(
                            findFullyPopulatedPreferredLocationSolution(data),
                            newLocationSolutions,
                            eventRelocationProcessingDefinition.locationRestraints())
                        .toEntityReference())
                .build())
        .build();
  }

  private static LocationSolution findFullyPopulatedPreferredLocationSolution(
      EventHypothesis.Data eventHypothesisData) {

    var preferredLocationSolution =
        eventHypothesisData
            .getPreferredLocationSolution()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "Output EventHypothesis must have a preferredLocationSolution"));

    return eventHypothesisData.getLocationSolutions().stream()
        .filter(
            locationSolution -> locationSolution.getId().equals(preferredLocationSolution.getId()))
        .findFirst()
        .orElseThrow(
            () ->
                new IllegalArgumentException(
                    "Output EventHypothesis must have its preferredLocationSolution in its set of"
                        + " LocationSolutions"));
  }

  private static LocationSolution findPreferredLocationSolution(
      LocationSolution basePreferredLocationSolution,
      Collection<LocationSolution> locationSolutions,
      List<LocationRestraint> locationRestraints) {

    var preferredRestraint =
        basePreferredLocationSolution
            .getData()
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "findPreferredLocationSolution: input basePreferredLocationSolution is not"
                            + " populated"))
            .getLocationRestraint();

    var firstLocationRestraint = locationRestraints.get(0);

    var optionalLocationSolution =
        locationSolutions.stream()
            .filter(
                locationSolution ->
                    locationSolution
                        .getData()
                        .get()
                        .getLocationRestraint()
                        .equals(preferredRestraint))
            .findFirst();

    return optionalLocationSolution
        .or(
            () ->
                locationSolutions.stream()
                    .filter(
                        locationSolution ->
                            locationSolution
                                .getData()
                                .get()
                                .getLocationRestraint()
                                .equals(firstLocationRestraint))
                    .findFirst())
        .orElse(basePreferredLocationSolution);
  }
}
