package gms.shared.waveform.bridge.repository;

import static gms.shared.stationdefinition.facet.FacetingTypes.CHANNEL_TYPE;

import com.google.common.collect.LinkedListMultimap;
import com.google.common.collect.Multimap;
import gms.shared.event.api.EventRepository;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.utility.id.EventIdUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.spring.utilities.aspect.Timing;
import gms.shared.spring.utilities.framework.RetryService;
import gms.shared.stationdefinition.api.channel.util.ChannelsTimeFacetRequest;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.repository.BridgedChannelRepository;
import gms.shared.utilities.logging.TimingLogger;
import gms.shared.waveform.api.WaveformRepository;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.converter.ChannelSegmentConverter;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.commons.lang3.Validate;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.ignite.IgniteCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;

/** * A {@link WaveformRepository} implementation that uses a bridged database */
@Component
public class BridgedWaveformRepository implements WaveformRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(BridgedWaveformRepository.class);
  private static final TimingLogger<Collection<ChannelSegment<Waveform>>> channelSegmentLogger =
      TimingLogger.create(LOGGER);
  private static final TimingLogger<List<WfdiscDao>> wfdiscsLogger = TimingLogger.create(LOGGER);
  private static final TimingLogger<Map<ChannelSegmentDescriptor, List<ProcessingMask>>>
      procMasksLogger = TimingLogger.create(LOGGER);

  private static final String STATION_DEFINITION_SERVICE_URL =
      "http://station-definition-service:8080/station-definition-service/station-definition/channels/query/names";

  private Environment environment;
  private final WfdiscDatabaseConnector wfdiscDatabaseConnector;
  private final ChannelSegmentConverter converter;
  private final RetryService retryService;
  private IgniteCache<ChannelSegmentDescriptor, List<Long>> channelSegmentDescriptorWfidsCache;
  private final ProcessingMaskLoader processingMaskLoader;
  private final EventIdUtility eventIdUtility;
  private final BridgedChannelRepository bridgedChannelRepository;
  private final EventRepository eventRepository;

  @Autowired
  public BridgedWaveformRepository(
      WfdiscDatabaseConnector wfdiscDatabaseConnector,
      BridgedChannelRepository bridgedChannelRepository,
      ChannelSegmentConverter converter,
      RetryService retryService,
      IgniteCache<ChannelSegmentDescriptor, List<Long>> channelSegmentDescriptorWfidsCache,
      SystemConfig systemConfig,
      ProcessingMaskLoader processingMaskLoader,
      Environment environment,
      EventIdUtility eventIdUtility,
      @Qualifier("bridgedEventRepository") @Lazy EventRepository eventRepository) {
    this.wfdiscDatabaseConnector = wfdiscDatabaseConnector;
    this.bridgedChannelRepository = bridgedChannelRepository;
    this.converter = converter;
    this.retryService = retryService;
    this.channelSegmentDescriptorWfidsCache = channelSegmentDescriptorWfidsCache;
    this.processingMaskLoader = processingMaskLoader;
    this.environment = environment;
    this.eventIdUtility = eventIdUtility;
    this.eventRepository = eventRepository;
  }

  @Override
  @Timing
  public Collection<ChannelSegment<Waveform>> findByChannelsAndTimeRange(
      Set<Channel> channels, Instant startTime, Instant endTime) {

    // load wfdisc associated with channels and timerange parameter list
    List<SiteChanKey> siteChanList =
        channels.stream()
            .map(siteChan -> StationDefinitionIdUtility.getCssKeyFromName(siteChan.getName()))
            .toList();

    List<WfdiscDao> wfDiscDaos =
        wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(siteChanList, startTime, endTime);

    Map<Instant, List<WfdiscDao>> wfDiscsByTime =
        wfDiscDaos.stream().collect(Collectors.groupingBy(WfdiscDao::getTime));
    Multimap<Channel, WfdiscDao> channelWfdiscDaoMultimap = LinkedListMultimap.create();

    Map<Channel, List<WfdiscDao>> channelListMap =
        wfDiscsByTime.entrySet().stream()
            .parallel()
            .map(wfDiscs -> getChannelNamesForTime(wfDiscs, channels))
            .map(
                pair ->
                    Pair.of(
                        getChannelsByName(pair.getLeft(), pair.getRight()),
                        wfDiscsByTime.get(pair.getLeft())))
            .map(
                pair ->
                    Pair.of(
                        pair.getLeft(),
                        pair.getRight().stream()
                            .collect(
                                Collectors.toMap(
                                    wfDisc ->
                                        StationDefinitionIdUtility.createStationChannelCode(
                                            wfDisc.getStationCode(), wfDisc.getChannelCode()),
                                    Function.identity()))))
            .flatMap(
                pair ->
                    pair.getLeft().stream()
                        .parallel()
                        .map(
                            channel ->
                                Pair.of(
                                    Channel.createVersionReference(
                                        channel.getName(), channel.getEffectiveAt().get()),
                                    pair.getRight()
                                        .get(
                                            StationDefinitionIdUtility
                                                .getStationChannelCodeFromChannel(channel)))))
            .collect(
                Collectors.groupingBy(
                    Pair::getLeft, Collectors.mapping(Pair::getRight, Collectors.toList())));
    channelListMap.forEach(channelWfdiscDaoMultimap::putAll);
    var waveforms =
        channelSegmentLogger.apply(
            this.getClass().getSimpleName() + "::createWaveforms",
            () -> createWaveforms(channelWfdiscDaoMultimap, startTime, endTime),
            environment.getActiveProfiles());

    LOGGER.info("Returning {} waveforms", waveforms.size());
    return waveforms;
  }

  /**
   * converts Channel, WfDisc map to ChannelSegment<Waveform> must be public to allow Timing aspect
   *
   * @param channelWfdiscDaoMultimap map containing channels to wfdisc
   * @param startTime time to start the waveform
   * @param endTime time to end the waveform
   * @return
   */
  public Collection<ChannelSegment<Waveform>> createWaveforms(
      Multimap<Channel, WfdiscDao> channelWfdiscDaoMultimap, Instant startTime, Instant endTime) {

    return channelWfdiscDaoMultimap.keySet().stream()
        .parallel()
        .map(
            channel ->
                converter.convert(
                    channel,
                    new ArrayList<>(channelWfdiscDaoMultimap.get(channel)),
                    startTime,
                    endTime))
        .filter(Objects::nonNull)
        .toList();
  }

  /**
   * maps wfdisc for a given time to Channels for the given time
   *
   * @param wfDiscs wfdisc for a given time
   * @param channels channels for a given time
   * @return list of channelNames for a given Time
   */
  private static Pair<Instant, List<String>> getChannelNamesForTime(
      Map.Entry<Instant, List<WfdiscDao>> wfDiscs, Set<Channel> channels) {
    // stores stationChannel code to channel names for populating ChannelsTimeFacetRequest for a
    // specific wfdisc
    Map<String, String> staChanCodeChannelMap =
        channels.stream()
            .collect(
                Collectors.toMap(
                    StationDefinitionIdUtility::getStationChannelCodeFromChannel,
                    Channel::getName));

    return Pair.of(
        wfDiscs.getKey(),
        wfDiscs.getValue().stream()
            .map(
                wfDisc ->
                    staChanCodeChannelMap.get(
                        StationDefinitionIdUtility.createStationChannelCode(
                            wfDisc.getStationCode(), wfDisc.getChannelCode())))
            .toList());
  }

  /**
   * calls station definition to get all channels for an effective time
   *
   * @param effectiveTime time to find associated channels
   * @param channelNames list of channels to load
   * @return List of Channels at effective at the given time
   */
  private List<Channel> getChannelsByName(Instant effectiveTime, List<String> channelNames) {
    var request =
        ChannelsTimeFacetRequest.builder()
            .setChannelNames(channelNames)
            .setEffectiveTime(effectiveTime)
            .setFacetingDefinition(
                FacetingDefinition.builder()
                    .setPopulated(true)
                    .setClassType(CHANNEL_TYPE.getValue())
                    .build())
            .build();
    List<Channel> channelList =
        retryService.retry(
            STATION_DEFINITION_SERVICE_URL,
            HttpMethod.POST,
            new HttpEntity<>(request),
            new ParameterizedTypeReference<List<Channel>>() {});
    if (channelList.isEmpty()) {
      LOGGER.info("No matching channels found for {}", channelNames);
      return new ArrayList<>();
    }
    return channelList;
  }

  @Override
  @Timing
  public Collection<ChannelSegment<Waveform>> findByChannelSegmentDescriptors(
      Collection<ChannelSegmentDescriptor> channelSegmentDescriptors) {

    channelSegmentDescriptors.parallelStream()
        .forEach(
            (var csd) -> {
              Validate.isTrue(
                  csd.getStartTime().isBefore(csd.getEndTime()),
                  "ChannelSegmentDescriptor startTime must be before the ChannelSegmentDescriptor"
                      + " endTime");
              Validate.isTrue(
                  csd.getChannel().getEffectiveAt().isPresent(),
                  "Channels must have an effectiveDate (must be version reference)");
              Validate.isTrue(
                  csd.getChannel().getEffectiveAt().get().isBefore(csd.getEndTime()),
                  "The Channel effectiveAt Date must be before the ChannelSegmentDescriptor"
                      + " endTime");
            });

    Map<ChannelSegmentDescriptor, List<ProcessingMask>> processingMaskMap =
        procMasksLogger.apply(
            this.getClass().getSimpleName() + "::loadProcessingMasks",
            () -> loadProcessingMasks(channelSegmentDescriptors),
            environment.getActiveProfiles());

    Map<ChannelSegmentDescriptor, List<Long>> cachedWfidsByCsd =
        channelSegmentDescriptors.stream()
            .parallel()
            .filter(channelSegmentDescriptorWfidsCache::containsKey)
            .map(csd -> Pair.of(csd, channelSegmentDescriptorWfidsCache.get(csd)))
            .collect(Collectors.toMap(Pair::getKey, Pair::getValue));

    var wfdiscs =
        wfdiscsLogger.apply(
            this.getClass().getSimpleName() + "::findWfdiscsByWfids",
            () ->
                wfdiscDatabaseConnector.findWfdiscsByWfids(
                    cachedWfidsByCsd.values().stream().flatMap(List::stream).distinct().toList()),
            environment.getActiveProfiles());

    return channelSegmentLogger.apply(
        this.getClass().getSimpleName() + "::getChannelSegments",
        () -> getChannelSegments(cachedWfidsByCsd, wfdiscs, processingMaskMap),
        environment.getActiveProfiles());
  }

  /**
   * Returns a map of EventHpothesis to associated list of ChannelSegments
   *
   * @param eventHypotheses list of {@link EventHypothesis}
   * @param stations list of {@link station}
   * @return map of {@link EventHypothesis} to collection of {@link ChannelSegment}
   */
  @Override
  @Timing
  public Pair<Map<EventHypothesis, List<ChannelSegment<Waveform>>>, Boolean>
      findEventBeamsByEventHypothesesAndStations(
          Collection<EventHypothesis> eventHypotheses, Collection<Station> stations) {

    Validate.notEmpty(eventHypotheses, "Must have event hypotheses");
    Validate.notEmpty(stations, "Must have stations");

    Map<EventHypothesis, List<ChannelSegment<Waveform>>> eventHypothesisChannelSegmentsMap =
        Map.of();

    var isPartialResponse = false;

    var preferredEventHypotheses = filterPreferredEventHypotheses(eventHypotheses);
    if (preferredEventHypotheses.isEmpty()) {
      LOGGER.debug("There aren't any perferred event hypothesis");
      preferredEventHypotheses = eventHypotheses;
    }

    // map of event id to given event hypothesis
    var evidToEventHypothesisMap =
        preferredEventHypotheses.stream()
            .map(eh -> Pair.of(eventIdUtility.getEvid(eh.getId().getEventId()), eh))
            .filter(pair -> pair.getLeft().isPresent())
            .map(pair -> Pair.of(pair.getLeft().get(), pair.getRight()))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight));

    var evidList = evidToEventHypothesisMap.keySet().stream().toList();

    var stationCodes = stations.stream().map(station -> station.getName()).toList();

    var evidToWfdiscDaosMap =
        wfdiscDatabaseConnector.findWfdiscDaosByEvidMapFilteredByStation(evidList, stationCodes);

    if (!evidToWfdiscDaosMap.isEmpty()) {
      var wfidToWfdiscMap =
          evidToWfdiscDaosMap.values().stream()
              .parallel()
              .flatMap(Collection::stream)
              .collect(Collectors.toMap(WfdiscDao::getId, Function.identity()));

      var startTimesByWfid =
          evidToWfdiscDaosMap.values().stream()
              .parallel()
              .flatMap(Collection::stream)
              .filter(Objects::nonNull)
              .collect(Collectors.toMap(WfdiscDao::getId, WfdiscDao::getTime));

      var endTimesByWfid =
          evidToWfdiscDaosMap.values().stream()
              .parallel()
              .flatMap(Collection::stream)
              .filter(Objects::nonNull)
              .collect(Collectors.toMap(WfdiscDao::getId, WfdiscDao::getEndTime));

      var wfidToOptionalDerivedChannel =
          createWfidToOptionalDerivedChannelMap(
              evidToWfdiscDaosMap, evidToEventHypothesisMap, startTimesByWfid, endTimesByWfid);

      boolean areAllChannelsEmpty =
          wfidToOptionalDerivedChannel.values().stream().allMatch(Optional::isEmpty);

      if (!areAllChannelsEmpty) {
        isPartialResponse =
            wfidToOptionalDerivedChannel.values().stream().anyMatch(Optional::isEmpty);

        var wfidToDerivedChannel =
            wfidToOptionalDerivedChannel.entrySet().stream()
                .parallel()
                .filter(entry -> entry.getValue().isPresent())
                .map(entry -> Pair.of(entry.getKey(), entry.getValue().get()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        // build the channel segment descriptors for the channel segment
        var wfidToChannelSegmentDescriptorMap =
            wfidToDerivedChannel.entrySet().stream()
                .parallel()
                .map(
                    entry ->
                        Pair.of(
                            entry.getKey(),
                            ChannelSegmentDescriptor.from(
                                Channel.createVersionReference(entry.getValue()),
                                startTimesByWfid.get(entry.getKey()),
                                endTimesByWfid.get(entry.getKey()),
                                entry.getValue().getEffectiveAt().orElseThrow())))
                .collect(Collectors.toMap(Pair::getLeft, Pair::getRight));

        wfidToChannelSegmentDescriptorMap.entrySet().stream()
            .parallel()
            .forEach(
                entry ->
                    channelSegmentDescriptorWfidsCache.put(
                        entry.getValue(), List.of(entry.getKey())));

        var channelSegmentDescriptorToProcessingMasksMap =
            loadProcessingMasks(wfidToChannelSegmentDescriptorMap.values());

        var stationNames =
            wfidToDerivedChannel.values().stream().map(ch -> ch.getStation().getName()).toList();

        eventHypothesisChannelSegmentsMap =
            createEventHypothesisChannelSegmentsMap(
                evidToWfdiscDaosMap,
                evidToEventHypothesisMap,
                wfidToChannelSegmentDescriptorMap,
                wfidToWfdiscMap,
                channelSegmentDescriptorToProcessingMasksMap,
                stationNames);
      } else {
        isPartialResponse = true;
      }
    }

    return Pair.of(
        createDefaultEventHypothesisChannelSegmentsMap(eventHypothesisChannelSegmentsMap),
        isPartialResponse);
  }

  /**
   * Create the default map of {@link EventHypothesis} to lists of {@link ChannelSegment}s
   *
   * @param eventHypothesisChannelSegmentsMap The input {@link EventHypothesis} to {@link
   *     ChannelSegment}s
   * @return map of {@link EventHypothesis} to {@link ChannelSegment}s
   */
  private static Map<EventHypothesis, List<ChannelSegment<Waveform>>>
      createDefaultEventHypothesisChannelSegmentsMap(
          Map<EventHypothesis, List<ChannelSegment<Waveform>>> eventHypothesisChannelSegmentsMap) {

    // iterate through the map and populate objects accordingly
    var facetedEventHypothesisChannelSegmentsMap =
        new HashMap<EventHypothesis, List<ChannelSegment<Waveform>>>();
    for (var entry : eventHypothesisChannelSegmentsMap.entrySet()) {
      var eventHypothesis = entry.getKey();
      var channelSegments = entry.getValue();

      var facetedChannelSegments = new ArrayList<ChannelSegment<Waveform>>();
      for (var channelSegment : channelSegments) {
        facetedChannelSegments.add(populateDefaultChannelSegment(channelSegment));
      }

      // insert the new hypothesis and channel segments into the map
      facetedEventHypothesisChannelSegmentsMap.put(
          eventHypothesis.toEntityReference(), facetedChannelSegments);
    }

    return facetedEventHypothesisChannelSegmentsMap;
  }

  /**
   * Populate the default fields for the input {@link ChannelSegment}
   *
   * @param channelSegment input {@link ChannelSegment} to populate
   * @return default populated {@link ChannelSegment}
   */
  private static ChannelSegment<Waveform> populateDefaultChannelSegment(
      ChannelSegment<Waveform> channelSegment) {
    // let's populate the channel segment for defaults
    var descriptor = channelSegment.getId();
    var missingInputChannels = channelSegment.getMissingInputChannels();
    var segData = channelSegment.getData().orElseThrow();
    var units = segData.getUnits();
    var timeSeries = segData.getTimeseries();
    var maskedBy = segData.getMaskedBy();
    var facetedMaskedBy = createEntityReferenceForQcSegmentVersions(maskedBy);

    // set the channel keys to entity references
    var facetedMissingInputChannels =
        missingInputChannels.entrySet().stream()
            .map(
                inputEntry ->
                    new HashMap.SimpleEntry<>(
                        inputEntry.getKey().toEntityReference(), inputEntry.getValue()))
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

    // update the faceted channel segments list
    return ChannelSegment.from(
        Channel.createVersionReference(descriptor.getChannel()),
        units,
        timeSeries,
        descriptor.getCreationTime(),
        facetedMaskedBy,
        facetedMissingInputChannels);
  }

  static Collection<ProcessingMask> createEntityReferenceForQcSegmentVersions(
      Collection<ProcessingMask> maskedBy) {
    Collection<ProcessingMask> facetedMaskedBy = new ArrayList<>();
    for (var pm : maskedBy) {
      var pmDataOptional = pm.getData();
      if (pmDataOptional.isPresent()) {
        var pmData = pmDataOptional.get();
        var maskedQcSegmentVersions = pmData.getMaskedQcSegmentVersions();
        Collection<QcSegmentVersion> qcSegmentVersionReferences = new ArrayList<>();
        for (var qc : maskedQcSegmentVersions) {
          var qcEntityReference = QcSegmentVersion.createEntityReference(qc.getId());
          qcSegmentVersionReferences.add(qcEntityReference);
        }
        var facetedData =
            pmData.toBuilder().setMaskedQcSegmentVersions(qcSegmentVersionReferences).build();
        var facetedMask =
            ProcessingMask.instanceBuilder().setData(facetedData).setId(pm.getId()).build();
        facetedMaskedBy.add(facetedMask);
      }
    }
    return facetedMaskedBy;
  }

  private Collection<EventHypothesis> filterPreferredEventHypotheses(
      Collection<EventHypothesis> eventHypotheses) {

    return eventHypotheses.stream()
        .parallel()
        .filter(
            eh ->
                Stream.of(eh.getId().getHypothesisId())
                    .map(eventIdUtility::getOriginUniqueIdentifier)
                    .flatMap(Optional::stream)
                    .anyMatch(
                        originUniqueId ->
                            eventRepository.isLatestPreferred(
                                originUniqueId.getOrid(),
                                WorkflowDefinitionId.from(originUniqueId.getStage()))))
        .toList();
  }

  /**
   * Create Map of wfid to {@link Channel}
   *
   * @param evidToWfdiscDaosMap map of evid to WfdiscDaos
   * @param evidToEventHypothesis map of evid to EventHypthesis
   * @param startTimesByWfid start times by wfid map
   * @param endTimesByWfid end times by wfid map
   * @return map of wfid to {@link Channel} map
   */
  private Map<Long, Optional<Channel>> createWfidToOptionalDerivedChannelMap(
      Map<Long, List<WfdiscDao>> evidToWfdiscDaos,
      Map<Long, EventHypothesis> evidToEventHypothesis,
      Map<Long, Instant> startTimesByWfid,
      Map<Long, Instant> endTimesByWfid) {
    return evidToWfdiscDaos.entrySet().stream()
        .parallel()
        .flatMap(
            entry ->
                entry.getValue().stream()
                    .map(wfdiscDao -> new WfdiscForEvid(entry.getKey(), wfdiscDao)))
        .map(
            wfdiscForEvid ->
                new ChannelForWfid(
                    wfdiscForEvid.wfdiscDao().getId(),
                    bridgedChannelRepository.createEventBeamDerivedChannel(
                        wfdiscForEvid.wfdiscDao(),
                        TagName.EVID,
                        wfdiscForEvid.evid(),
                        evidToEventHypothesis.get(wfdiscForEvid.evid()),
                        startTimesByWfid.get(wfdiscForEvid.wfdiscDao().getId()),
                        endTimesByWfid.get(wfdiscForEvid.wfdiscDao().getId()))))
        .map(channelForWfid -> Pair.of(channelForWfid.wfid(), channelForWfid.channel()))
        .collect(Collectors.toMap(Pair::getLeft, Pair::getRight));
  }

  /**
   * Create {@link EventHypothesis} to {@link ChannelSegment}s map from input {@link WfdiscDao} and
   * {@link ChannelSegmentDescriptor} to {@link ProcessingMask}s
   *
   * @param evidToWfdiscDaosMap evid to {@link WfdiscDao}s
   * @param evidToEventHypothesisMap evid to {@link EventHypothesis}s
   * @param wfidToChannelSegmentDescriptorMap wfid to {@link ChannelSegmentDescriptor}s
   * @param wfidToWfdiscMap wfids to {@link WfdiscDao}s
   * @param channelSegmentDescriptorToProcessingMasksMap {@link ChannelSegmentDescriptor} to {@link
   *     ProcessingMask}s
   * @return map of {@link EventHypothesis} to list of {@link ChannelSegment}s
   */
  private Map<EventHypothesis, List<ChannelSegment<Waveform>>>
      createEventHypothesisChannelSegmentsMap(
          Map<Long, List<WfdiscDao>> evidToWfdiscDaosMap,
          Map<Long, EventHypothesis> evidToEventHypothesisMap,
          Map<Long, ChannelSegmentDescriptor> wfidToChannelSegmentDescriptorMap,
          Map<Long, WfdiscDao> wfidToWfdiscMap,
          Map<ChannelSegmentDescriptor, List<ProcessingMask>>
              channelSegmentDescriptorToProcessingMasksMap,
          List<String> stationNames) {

    return evidToWfdiscDaosMap.entrySet().stream()
        .parallel()
        .map(
            entry ->
                new WfdiscsForEventHypothesis(
                    evidToEventHypothesisMap.get(entry.getKey()), entry.getValue()))
        .map(
            wfdiscsForEventHypothesis ->
                new ChannelSegmentsForEventHypothesis(
                    wfdiscsForEventHypothesis.eventHypothesis(),
                    wfdiscsForEventHypothesis.wfdiscDaos().stream()
                        .parallel()
                        .filter(wfdiscDao -> stationNames.contains(wfdiscDao.getStationCode()))
                        .map(
                            wfDiscDao ->
                                convertAndMaskChannelSegment(
                                    wfidToChannelSegmentDescriptorMap.get(wfDiscDao.getId()),
                                    List.of(wfidToWfdiscMap.get(wfDiscDao.getId())),
                                    channelSegmentDescriptorToProcessingMasksMap))
                        .filter(Optional::isPresent)
                        .map(Optional::orElseThrow)
                        .toList()))
        .collect(
            Collectors.toMap(
                ChannelSegmentsForEventHypothesis::eventHypothesis,
                ChannelSegmentsForEventHypothesis::channelSegments));
  }

  private Map<ChannelSegmentDescriptor, List<ProcessingMask>> loadProcessingMasks(
      Collection<ChannelSegmentDescriptor> channelSegmentDescriptors) {
    return channelSegmentDescriptors.stream()
        .map(
            descriptor ->
                Map.entry(
                    descriptor,
                    processingMaskLoader.loadProcessingMasks(
                        descriptor.getChannel(),
                        descriptor.getStartTime(),
                        descriptor.getEndTime())))
        .collect(Collectors.toMap(Entry::getKey, Entry::getValue));
  }

  private Collection<ChannelSegment<Waveform>> getChannelSegments(
      Map<ChannelSegmentDescriptor, List<Long>> cachedWfidsByCsd,
      List<WfdiscDao> wfdiscs,
      Map<ChannelSegmentDescriptor, List<ProcessingMask>> processingMaskMap) {
    return cachedWfidsByCsd.entrySet().stream()
        .parallel()
        .map(
            csdWfidsEntry ->
                convertAndMaskChannelSegment(
                    csdWfidsEntry.getKey(),
                    wfdiscs.stream()
                        .filter(wfdisc -> csdWfidsEntry.getValue().contains(wfdisc.getId()))
                        .toList(),
                    processingMaskMap))
        .flatMap(Optional::stream)
        .toList();
  }

  private Optional<ChannelSegment<Waveform>> convertAndMaskChannelSegment(
      ChannelSegmentDescriptor csd,
      List<WfdiscDao> wfdiscs,
      Map<ChannelSegmentDescriptor, List<ProcessingMask>> processingMaskMap) {
    return Optional.ofNullable(converter.convert(csd, wfdiscs))
        .map(
            (var segment) -> {
              var data =
                  segment.getData().get().toBuilder()
                      .setMaskedBy(processingMaskMap.get(csd))
                      .build();

              return segment.toBuilder().setData(data).build();
            });
  }
}
