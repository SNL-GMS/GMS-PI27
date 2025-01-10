package gms.shared.signalenhancement.controller;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableTable;
import com.google.common.collect.Table;
import com.google.common.collect.Tables;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.derivedchannel.coi.BeamformingTemplate;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.signaldetection.api.SignalDetectionAccessor;
import gms.shared.signaldetection.api.facet.SignalDetectionFacetingUtility;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signalenhancement.api.BeamformingTemplatesRequest;
import gms.shared.signalenhancement.api.ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageByChannelSegment;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageForChannelSegmentsRequest;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageForSignalDetectionHypothesesRequest;
import gms.shared.signalenhancement.api.FilterDefintionByUsageMapRequest;
import gms.shared.signalenhancement.api.FkSpectraTemplatesRequest;
import gms.shared.signalenhancement.api.ProcessingMaskDefinitionByPhaseByChannel;
import gms.shared.signalenhancement.api.ProcessingMaskDefinitionRequest;
import gms.shared.signalenhancement.api.ProcessingMaskPhaseChannelItem;
import gms.shared.signalenhancement.api.RotationTemplateRequest;
import gms.shared.signalenhancement.api.SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair;
import gms.shared.signalenhancement.api.webclient.FkReviewablePhasesRequest;
import gms.shared.signalenhancement.coi.filter.DistanceRangeDeg;
import gms.shared.signalenhancement.coi.filter.FilterDefsByUsageTable;
import gms.shared.signalenhancement.coi.filter.FilterListDefinition;
import gms.shared.signalenhancement.coi.fk.FkSpectraTemplate;
import gms.shared.signalenhancement.coi.rotation.RotationTemplate;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.signalenhancement.coi.utils.ChannelComponents;
import gms.shared.signalenhancement.configuration.RotationConfiguration;
import gms.shared.signalenhancement.configuration.SignalEnhancementConfiguration;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import gms.shared.waveform.api.WaveformAccessor;
import gms.shared.waveform.api.facet.WaveformFacetingUtility;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.stereotype.Service;

@Service
@ComponentScan(
    basePackages = {
      "gms.shared.signaldetection",
      "gms.shared.stationdefinition",
      "gms.shared.waveform",
      "gms.shared.emf"
    })
public class SignalEnhancementConfigurationService {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalEnhancementConfigurationService.class);

  private static final FacetingDefinition featureMeasurementFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType(FeatureMeasurement.class.getSimpleName())
          .setPopulated(true)
          .build();

  private static final FacetingDefinition signalDetectionHypothesisFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType(SignalDetectionHypothesis.class.getSimpleName())
          .setPopulated(true)
          .addFacetingDefinitions("featureMeasurements", featureMeasurementFacetingDefinition)
          .build();

  private final SignalEnhancementConfiguration signalEnhancementFilterConfiguration;
  private final StationDefinitionAccessor stationDefinitionAccessor;
  private final SignalDetectionFacetingUtility signalDetectionFacetingUtility;
  private final RotationConfiguration rotationConfiguration;

  @Autowired
  public SignalEnhancementConfigurationService(
      SignalEnhancementConfiguration signalEnhancementFilterConfiguration,
      RotationConfiguration rotationConfiguration,
      WaveformAccessor waveformAccessor,
      @Qualifier("defaultStationDefinitionAccessor") StationDefinitionAccessor stationDefinitionAccessorImpl,
      @Qualifier("bridgedSignalDetectionAccessor") SignalDetectionAccessor signalDetectionAccessor) {

    var waveformFacetingUtility =
        new WaveformFacetingUtility(waveformAccessor, stationDefinitionAccessorImpl);
    this.signalEnhancementFilterConfiguration = signalEnhancementFilterConfiguration;
    this.rotationConfiguration = rotationConfiguration;
    this.stationDefinitionAccessor = stationDefinitionAccessorImpl;
    var staDefFacetUtility = StationDefinitionFacetingUtility.create(stationDefinitionAccessorImpl);
    this.signalDetectionFacetingUtility =
        SignalDetectionFacetingUtility.create(
            signalDetectionAccessor, waveformFacetingUtility, staDefFacetUtility);
  }

  public SignalEnhancementConfigurationService(
      SignalEnhancementConfiguration signalEnhancementConfiguration,
      RotationConfiguration rotationConfiguration,
      StationDefinitionAccessor stationDefinitionAccessorImpl,
      SignalDetectionFacetingUtility signalDetectionFacetingUtility) {

    this.signalEnhancementFilterConfiguration = signalEnhancementConfiguration;
    this.signalDetectionFacetingUtility = signalDetectionFacetingUtility;
    this.stationDefinitionAccessor = stationDefinitionAccessorImpl;
    this.rotationConfiguration = rotationConfiguration;
  }

  public FilterListDefinition filterListDefinition() {
    return signalEnhancementFilterConfiguration.filterListDefinition();
  }

  /**
   * Resolves default FilterDefinitions for each of the provided ChannelSegment objects for each
   * FilterDefinitionUsage literal
   *
   * @param request A list of ChannelSegment and an optional EventHypothesis
   * @return A map of maps consisting of SignalDetectionHypothesis keys to values consisting of maps
   *     of FilterDefinitionUsuage keys to FilterDefinition values
   */
  public Pair<FilterDefinitionByUsageByChannelSegment, Boolean>
      getDefaultFilterDefinitionByUsageForChannelSegments(
          FilterDefinitionByUsageForChannelSegmentsRequest request) {

    var channelSegments = request.getChannelSegments().stream().collect(Collectors.toSet());
    var eventHypothesis = request.getEventHypothesis().orElse(null);

    Preconditions.checkArgument(
        !channelSegments.isEmpty(), "Must provide at least onechannel segment");

    var optionalChannelSegToFilterDefPairs =
        channelSegments.stream()
            .map(this::channelSegToChannelPair)
            .map(
                channelSegPair ->
                    createOptionalChannelSegToFilterDefPair(channelSegPair, eventHypothesis))
            .toList();

    return Pair.of(
        optionalChannelSegToFilterDefPairs.stream()
            .flatMap(Optional::stream)
            .collect(
                Collectors.collectingAndThen(
                    Collectors.toList(), FilterDefinitionByUsageByChannelSegment::from)),
        optionalChannelSegToFilterDefPairs.stream().anyMatch(Optional::isEmpty));
  }

  /**
   * Resolves for empty channel by trying to populate it using the faceting utility and makes sure
   * this operation is safe by doing it with an optional
   *
   * @param request ChannelSegment<Waveform> as input
   * @return An entry of channel segment and optional channel that was populated with the faceting
   *     utility if it was initially empty
   */
  private Entry<ChannelSegment<Waveform>, Optional<Channel>> channelSegToChannelPair(
      ChannelSegment<Waveform> channelSeg) {
    var channel = channelSeg.getId().getChannel();
    var chanName = channel.getName();

    Optional<Channel> populatedOptionalChannel = Optional.of(channel);

    if (!channel.isPresent()) {
      populatedOptionalChannel = Optional.ofNullable(populateChannel(channel));
    }

    if (populatedOptionalChannel.isEmpty()) {
      LOGGER.warn("Faceting utility returned null for faceted" + " channel {}", chanName);
    }

    return Pair.of(channelSeg, populatedOptionalChannel);
  }

  /**
   * Creates the ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair optional
   *
   * @param request an entry of ChannelSegment<Waveform> and Optional<Channel>
   * @param request the nullable {@link EventHypothesis}
   * @return An ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair optional
   */
  private Optional<ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair>
      createOptionalChannelSegToFilterDefPair(
          Entry<ChannelSegment<Waveform>, Optional<Channel>> entry,
          EventHypothesis eventHypothesis) {
    Optional<ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair>
        chanSegToFilterDefPairOptional = Optional.empty();

    Optional<Channel> channelOptional = entry.getValue();
    if (channelOptional.isPresent()) {
      var channel = channelOptional.get();

      chanSegToFilterDefPairOptional =
          Optional.ofNullable(
              ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair.builder()
                  .setChannelSegment(entry.getKey())
                  .setFilterDefinitionByFilterDefinitionUsage(
                      signalEnhancementFilterConfiguration
                          .getDefaultFilterDefinitionByUsageForChannel(
                              channel, eventHypothesis, getPhaseTypeFromChannelBeamDef(channel)))
                  .build());
    }

    return chanSegToFilterDefPairOptional;
  }

  /**
   * Resolves processing mask definitions given the request object, using its list of processing
   * operations, channels, and phases, along with its station group.
   *
   * @param request contains what it needed to resolve processing mask definitions.
   * @return A data structure with lists of pairs (channel, phaseMap) where channel is the passed in
   *     channel, and phaseMap is a map from phase to list of definitions. There will be one
   *     definition in this list for each processing operation.
   */
  public ProcessingMaskDefinitionByPhaseByChannel getProcessingMaskDefinitions(
      ProcessingMaskDefinitionRequest request) {

    return ProcessingMaskDefinitionByPhaseByChannel.create(
        request.getChannels().stream()
            .parallel()
            //
            // Map each input channel to a ProcessingMaskPhaseChannelItem
            //
            .map(
                inputChannel ->
                    ProcessingMaskPhaseChannelItem.create(
                        inputChannel,
                        request.getPhaseTypes().stream()
                            .parallel()
                            //
                            // Map each phase to the phaseMap mentioned in the description.
                            //
                            .map(phase -> createPhaseMapEntry(request, phase, inputChannel))
                            .flatMap(Optional::stream)
                            .collect(Collectors.toMap(Entry::getKey, Entry::getValue))))
            .toList());
  }

  /**
   * Create a Map.Entry, associating phase with a list of ProcessingDefinitions.
   *
   * @param request The overall request object
   * @param phase The specific phase
   * @param populatedChannel The specific channel, which needs to be populated.
   * @return The Map.Entry
   */
  private Optional<Entry<PhaseType, List<ProcessingMaskDefinition>>> createPhaseMapEntry(
      ProcessingMaskDefinitionRequest request, PhaseType phase, Channel channel) {

    Entry<PhaseType, List<ProcessingMaskDefinition>> results =
        Map.entry(
            phase,
            request.getProcessingOperations().stream()
                .parallel()
                .map(
                    operation ->
                        getOptionalProcessingMaskDefinition(request, operation, channel, phase))
                .flatMap(Optional::stream)
                .toList());

    if (results.getValue().isEmpty()) {
      LOGGER.info(
          "Channel {} could not be resolved to any ProcessingMaskDefinitions; skipping", channel);
      return Optional.empty();
    }
    return Optional.of(results);
  }

  /**
   * Retrieve a ProcessingMaskDefinition from configuration, logging and returning an Optional.empty
   * if not found, or if there was an error.
   *
   * @param request Overall request object - needed for station group and for logging.
   * @param operation The ProcessingOperation to look for.
   * @param populatedChannel The (fully populated) channel.
   * @param phase The phase to look for.
   * @return Optional of the matching ProcessingMaskDefinition or Optional.empty if not found.
   */
  private Optional<ProcessingMaskDefinition> getOptionalProcessingMaskDefinition(
      ProcessingMaskDefinitionRequest request,
      ProcessingOperation operation,
      Channel populatedChannel,
      PhaseType phase) {

    try {
      return Optional.of(
          signalEnhancementFilterConfiguration.getProcessingMaskDefinition(
              operation, populatedChannel, phase));
    } catch (IllegalArgumentException e) {
      LOGGER.info(
          "Missing or invalid configuration for request: {}."
              + " and specfic phsse: {} and channel: {}"
              + "Associated exception was {}",
          request,
          phase,
          populatedChannel.getName(),
          e);
      return Optional.<ProcessingMaskDefinition>empty();
    }
  }

  /**
   * Resolves default FilterDefinitions for each of the provided SignalDetectionHypothesis objects
   * for each FilterDefinitionUsage literal
   *
   * @param request A list of SignalDetectionHypotheses and an optional EventHypothesis
   * @return A map of maps consisting of SignalDetectionHypothesis keys to values consisting of maps
   *     of FilterDefinitionUsuage keys to FilterDefinition values
   */
  public Pair<FilterDefinitionByUsageBySignalDetectionHypothesis, Boolean>
      getDefaultFilterDefinitionByUsageForSignalDetectionHypothesis(
          FilterDefinitionByUsageForSignalDetectionHypothesesRequest request) {
    var eventHypothesis = request.getEventHypothesis().orElse(null);
    var signalDetectionsHypotheses = request.getSignalDetectionsHypotheses();

    Preconditions.checkArgument(
        !signalDetectionsHypotheses.isEmpty(),
        "Must provide at least one " + "signal detection hypothesis");

    var optionalSdhToFilterDefPairs =
        signalDetectionsHypotheses.stream()
            .map(this::shdToChannelPair)
            .map(
                shdToChannelPair ->
                    createOptionalSdhToFilterDefPair(shdToChannelPair, eventHypothesis))
            .toList();

    return Pair.of(
        optionalSdhToFilterDefPairs.stream()
            .flatMap(Optional::stream)
            .collect(
                Collectors.collectingAndThen(
                    Collectors.toList(), FilterDefinitionByUsageBySignalDetectionHypothesis::from)),
        optionalSdhToFilterDefPairs.stream().anyMatch(Optional::isEmpty));
  }

  /**
   * Resolves a default BeamTemplate for each of the provided Station, BeamTypes and PhaseTypes.
   * Each station will be combined with each BeamType and each PhaseType to create every
   * combination.
   *
   * @param beamformingTemplatesRequest A list of Stations, BeamTypes and PhaseTypes
   * @return 2-dimensional mapping of {@link Station} name, to {@link PhaseType} name, to {@link
   *     BeamformingTemplate} for every successfully resolved template. Stations are currently
   *     assumed unique ignoring version for 2d map indexing.
   */
  public Table<String, String, BeamformingTemplate> getBeamformingTemplates(
      BeamformingTemplatesRequest beamformingTemplatesRequest) {
    Preconditions.checkArgument(
        !beamformingTemplatesRequest.getStations().isEmpty(), "Must provide at least one station");
    Preconditions.checkArgument(
        !beamformingTemplatesRequest.getPhases().isEmpty(), "Must provide at least one phase type");

    var stationNames =
        beamformingTemplatesRequest.getStations().stream().map(Station::getName).toList();

    // populate stations with current version of station
    var populatedStations =
        stationDefinitionAccessor.findStationsByNameAndTime(stationNames, Instant.now());

    var populatedNames =
        populatedStations.stream().map(Station::getName).collect(Collectors.toSet());

    for (var stationName : stationNames) {
      if (!populatedNames.contains(stationName)) {
        LOGGER.warn("Unable to retrieve station {} for current time.", stationName);
      }
    }

    return populatedStations.stream()
        .map(
            station ->
                beamformingTemplatesRequest.getPhases().stream()
                    .map(
                        phase ->
                            signalEnhancementFilterConfiguration
                                .getBeamformingTemplate(
                                    station, phase, beamformingTemplatesRequest.getBeamType())
                                .map(
                                    template ->
                                        Tables.<String, String, BeamformingTemplate>immutableCell(
                                            station.getName(), phase.toString(), template)))
                    .flatMap(Optional::stream))
        .flatMap(Function.identity())
        .distinct()
        .collect(
            ImmutableTable.toImmutableTable(
                Table.Cell::getRowKey, Table.Cell::getColumnKey, Table.Cell::getValue));
  }

  /**
   * Resolves a 2-dimensional mapping of {@link Station} name, to {@link PhaseType} name, to {@link
   * FkSpectraTemplate} for each combination of the provided {@link Station}s and {@link PhaseType}s
   * in a {@link FkSpectratemplatesRequest}.
   *
   * @param fkSpectraTemplatesRequest {@link fkSpectraTemplatesRequest} Request containing the
   *     {@link Station}s and {@link PhaseType}s to resolve templates for.
   * @return 2-dimensional mapping of {@link Station} name, to {@link PhaseType} name, to {@link
   *     FkSpectraTemplate} for every successfully resolved template. Stations are currently assumed
   *     unique ignoring version for 2d map indexing.
   */
  public Table<String, String, FkSpectraTemplate> getFkSpectraTemplates(
      FkSpectraTemplatesRequest fkSpectraTemplatesRequest) {

    var stationNames = fkSpectraTemplatesRequest.stations().stream().map(Station::getName).toList();

    // populate stations with current version of station
    var populatedStations =
        stationDefinitionAccessor.findStationsByNameAndTime(stationNames, Instant.now());

    var populatedNames =
        populatedStations.stream().map(Station::getName).collect(Collectors.toSet());

    for (var stationName : stationNames) {
      if (!populatedNames.contains(stationName)) {
        LOGGER.warn("Unable to retrieve station {} for current time.", stationName);
      }
    }

    return populatedStations.stream()
        .map(
            station ->
                fkSpectraTemplatesRequest.phases().stream()
                    .map(
                        phase ->
                            Tables.<String, String, FkSpectraTemplate>immutableCell(
                                station.getName(),
                                phase.toString(),
                                signalEnhancementFilterConfiguration.getFkSpectraTemplate(
                                    station, phase))))
        .flatMap(Function.identity())
        .distinct()
        .collect(
            ImmutableTable.toImmutableTable(
                Table.Cell::getRowKey, Table.Cell::getColumnKey, Table.Cell::getValue));
  }

  /**
   * Resolves a mapping of {@link Station} to a set of reviewable {@link PhaseType}s for each of the
   * provided {@link Station}s and an activity {@link gms.shared.workflow.coi.WorkflowDefinitionId}.
   *
   * @param fkReviewablePhasesRequest {@link FkReviewablePhasesRequest}
   * @return A mapping of {@link Station}s to reviewable {@link PhaseType}s
   */
  public Map<Station, Set<PhaseType>> getFkReviewablePhases(
      FkReviewablePhasesRequest fkReviewablePhasesRequest) {
    var stationEntityRefs =
        fkReviewablePhasesRequest.stations().stream()
            .map(Station::toEntityReference)
            .collect(Collectors.toSet());
    return stationEntityRefs.stream()
        .map(
            station ->
                signalEnhancementFilterConfiguration
                    .getFkReviewablePhases(station.getName(), fkReviewablePhasesRequest.activity())
                    .map(phases -> Map.entry(station, phases)))
        .flatMap(Optional::stream)
        .collect(Collectors.toMap(Entry::getKey, Entry::getValue));
  }

  /**
   * Resolve a mapping from {@link Station} names -> {@link PhaseType} -> {@link RotationTemplate}
   *
   * @param request the {@link RotationTemplateRequest} to resolve the mappings for
   * @return A table representing the above described mapping
   */
  public Table<Station, PhaseType, RotationTemplate> getRotationTemplates(
      RotationTemplateRequest request) {

    return request.stations().stream()
        .map(Station::toEntityReference)
        .map(
            station ->
                request.phases().stream()
                    .map(
                        phase ->
                            Tables.<Station, PhaseType, RotationTemplate>immutableCell(
                                station,
                                phase,
                                rotationConfiguration.getRotationTemplate(station, phase))))
        .flatMap(Function.identity())
        .collect(
            ImmutableTable.toImmutableTable(
                Table.Cell::getRowKey, Table.Cell::getColumnKey, Table.Cell::getValue));
  }

  /**
   * Resolve a mapping from {@link Channel} name -> {@link PhaseType} -> {@link FilterDefinition}
   * for {@link DistanceRangeDeg} by {@link FilterDefinitionUsage}
   *
   * @param request the {@link FilterDefintionByUsageMapRequest} to resolve the mappings for
   * @return A table representing the above described mapping
   */
  public FilterDefsByUsageTable getDefaultDefinitionByUsageMap(
      FilterDefintionByUsageMapRequest request) {

    return request.channels().parallelStream()
        .map(SignalEnhancementConfigurationService::componentsFromChannel)
        .flatMap(Optional::stream)
        .flatMap(
            components ->
                request.phases().parallelStream()
                    .map(phase -> resolveMappingCell(components, phase)))
        .distinct()
        .collect(FilterDefsByUsageTable.Builder.toBuilder())
        .withGlobalDefaults(
            signalEnhancementFilterConfiguration.getDefaultFilterDefinitionByUsageMap())
        .build();
  }

  private static Optional<ChannelComponents> componentsFromChannel(Channel channel) {
    try {
      return Optional.of(ChannelComponents.fromChannelName(channel.getName()));
    } catch (IllegalArgumentException e) {
      LOGGER.warn(
          """
          Failed to parse components of Channel name {} with cause:
            {}""",
          channel.getName(),
          e.getMessage());
      return Optional.empty();
    }
  }

  private FilterDefsByUsageTable.TableCell resolveMappingCell(
      ChannelComponents components, PhaseType phase) {

    var fdByUsageMap =
        signalEnhancementFilterConfiguration.getDefaultFilterDefinitionByUsageMap(
            components.stationName(),
            components.channelGroupName(),
            components.channelCode(),
            phase);

    return new FilterDefsByUsageTable.TableCell(components, phase, fdByUsageMap);
  }

  /**
   * Resolves for empty signal detection hypothesis by trying to populate it using the faceting
   * utility and makes sure this operation is safe by doing it with an optional.
   *
   * @param request SignalDetectionHypothesis as input
   * @return An entry of optional signal detection hypothesis and optional channel that was
   *     populated with the faceting utility if it was initially empty
   */
  private Entry<Optional<SignalDetectionHypothesis>, Optional<Channel>> shdToChannelPair(
      SignalDetectionHypothesis signalDetectionHypothesis) {
    Optional<SignalDetectionHypothesis> populatedSdhOptional =
        Optional.of(signalDetectionHypothesis);

    // get the id from the signal detection hypothesis
    String id =
        populatedSdhOptional
            .flatMap(sdh -> Optional.of(sdh.getId().getSignalDetectionId().toString()))
            .orElse("Unknown signal detection hypothesis");

    // populate the sdh if the data is not present by using the faceting utility
    if (signalDetectionHypothesis != null && !signalDetectionHypothesis.isPresent()) {
      populatedSdhOptional =
          Optional.ofNullable(populateSignalDetectionHypothesis(signalDetectionHypothesis));
    }

    // if the faceting utility fails to populate the sdh then log this
    if (populatedSdhOptional.isEmpty()) {
      LOGGER.warn(
          "Faceting utility returned null for faceted" + " signal detection hypothesis {}", id);
    }

    Optional<Channel> optionalChannel = Optional.empty();

    if (populatedSdhOptional.isPresent()) {
      optionalChannel = retrieveOptionalChannel(populatedSdhOptional.get());
    }

    return Pair.of(populatedSdhOptional, optionalChannel);
  }

  /**
   * Creates the SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair optional
   *
   * @param request an entry of Optional<SignalDetectionHypothesis> and Optional<Channel>
   * @param request the nullable {@link EventHypothesis}
   * @return An SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair optional
   */
  private Optional<SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair>
      createOptionalSdhToFilterDefPair(
          Entry<Optional<SignalDetectionHypothesis>, Optional<Channel>> shdToChannelEntry,
          EventHypothesis eventHypothesis) {
    Optional<SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair>
        sdhToFilterDefPairOptional = Optional.empty();
    var sdhOptional = shdToChannelEntry.getKey();
    var channelOptional = shdToChannelEntry.getValue();

    if (sdhOptional.isPresent()) {
      var sigDect = sdhOptional.get();
      if (channelOptional.isPresent()) {
        var channel = channelOptional.get();
        var phaseType = getPhaseType(sigDect);

        sdhToFilterDefPairOptional =
            Optional.ofNullable(
                SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair.create(
                    sigDect.toEntityReference(),
                    signalEnhancementFilterConfiguration
                        .getDefaultFilterDefinitionByUsageForChannel(
                            channel, eventHypothesis, phaseType)));
      }
    }

    return sdhToFilterDefPairOptional;
  }

  /**
   * Resolves the logic for retrieving a channel from signal detection
   *
   * @param A signal detection hypothesis.
   * @return An optional channel that might be fully populated either from the signal detection
   *     hypothesis or from the faceting utility or and empty.
   */
  private Optional<Channel> retrieveOptionalChannel(SignalDetectionHypothesis sdh) {

    // get channel inside the signal detection hypothesis
    var channelOpt =
        Optional.of(sdh)
            .flatMap(hyp -> hyp.getData())
            .flatMap(hypData -> hypData.getFeatureMeasurement(FeatureMeasurementTypes.ARRIVAL_TIME))
            .flatMap(fm -> Optional.of(fm.getChannel()));

    // check if the channel and its data are present
    if (channelOpt.isPresent() && channelOpt.get().isPresent()) {
      return channelOpt;
    }

    var chanName =
        channelOpt.flatMap(chan -> Optional.of(chan.getName())).orElse("Unknown channel");

    // if not present then try to populate the channels with faceting
    var optChannel = channelOpt.flatMap(chan -> Optional.ofNullable(populateChannel(chan)));

    // if the channel cannot be retrieved from the faceting then log the event
    if (optChannel.isEmpty()) {
      LOGGER.info("Channel {} could not be populatd; skipping", chanName);
    }

    return optChannel;
  }

  /**
   * Resolves the phase type from the signal detection hypothesis
   *
   * @param A signal detection hypothesis.
   * @return A nullable {@link PhaseType} that might be fully populated or obtained from the feature
   *     measurement.
   */
  private static PhaseType getPhaseType(SignalDetectionHypothesis signalDetectionHypothesis) {
    Optional<FeatureMeasurement<PhaseTypeMeasurementValue>> phase =
        signalDetectionHypothesis
            .getData()
            .orElseThrow()
            .getFeatureMeasurement(FeatureMeasurementTypes.PHASE);

    return phase.map(p -> p.getMeasurementValue().getValue()).orElse(null);
  }

  /**
   * Resolves the phase type from the channel
   *
   * @param A fully populated channel.
   * @return A nullable {@link PhaseType} that might be fully populated.
   */
  private static PhaseType getPhaseTypeFromChannelBeamDef(Channel channel) {
    return (PhaseType) channel.getProcessingMetadata().get(ChannelProcessingMetadataType.BEAM_TYPE);
  }

  /**
   * Provides a fully populated channel from the faceting utility
   *
   * @param A channel which is not fully populated.
   * @return A fully populated channel.
   */
  private Channel populateChannel(Channel channel) {
    Instant effectiveAt = channel.getEffectiveAt().orElseThrow();
    var chanList =
        stationDefinitionAccessor.findChannelsByNameAndTime(
            List.of(channel.getName()), effectiveAt);

    // TODO refactor method to return Optional<Channel>
    if (chanList.isEmpty()) {
      return null;
    }
    return chanList.get(0);
  }

  /**
   * Provides a fully populated signal detection hypothesis from the faceting utility
   *
   * @param A signal detection hypothesis which is not fully populated.
   * @return A fully populated signal detection hypothesis.
   */
  private SignalDetectionHypothesis populateSignalDetectionHypothesis(
      SignalDetectionHypothesis signalDetectionHypothesis) {
    return signalDetectionFacetingUtility.populateFacets(
        signalDetectionHypothesis, signalDetectionHypothesisFacetingDefinition);
  }
}
