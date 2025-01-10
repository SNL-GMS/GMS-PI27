package gms.shared.stationdefinition.accessor;

import static java.util.Comparator.comparing;
import static java.util.Comparator.naturalOrder;
import static java.util.Comparator.nullsFirst;

import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import com.google.common.collect.RangeMap;
import com.google.common.collect.RangeSet;
import com.google.common.collect.TreeRangeSet;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.cache.VersionCache;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.RelativePositionChannelPair;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Entity caching for retrieving and updating COI object entity ids, times and versions If COI
 * objects don't exist in cache, then we will delegate to the {@link
 * DefaultStationDefinitionAccessor} for return COI objects
 */
@Primary
@Profile("!disable-caching")
@Component("entityCacheAccessor")
public class EntityCachingStationDefinitionAccessor implements StationDefinitionAccessor {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(EntityCachingStationDefinitionAccessor.class);

  // Operational time period config
  static final String OPERATIONAL_TIME_PERIOD_CONFIG = "global.operational-time-period";
  static final String OPERATIONAL_PERIOD_START = "operationalPeriodStart";
  static final String OPERATIONAL_PERIOD_END = "operationalPeriodEnd";

  private final ConfigurationConsumerUtility configurationConsumerUtility;
  private final StationDefinitionAccessor delegate;
  private final VersionCache versionCache;
  private final StationDefinitionIdUtility stationDefinitionIdUtility;

  private StationDefinitionFacetingUtility stationDefinitionFacetingUtility;

  private AtomicReference<Range<Instant>> operationalRange;

  @Autowired
  public EntityCachingStationDefinitionAccessor(
      SystemConfig systemConfig,
      ConfigurationConsumerUtility configurationConsumerUtility,
      @Qualifier("defaultStationDefinitionAccessor") StationDefinitionAccessor delegate,
      @Qualifier("standardVersionCache") VersionCache versionCache,
      StationDefinitionIdUtility stationDefinitionIdUtility) {

    this.configurationConsumerUtility = configurationConsumerUtility;
    this.delegate = delegate;
    this.versionCache = versionCache;
    this.stationDefinitionIdUtility = stationDefinitionIdUtility;
    this.operationalRange = new AtomicReference<>();
  }

  @PostConstruct
  public void init() {
    var operationalTimeConfig =
        configurationConsumerUtility.resolve(
            OPERATIONAL_TIME_PERIOD_CONFIG, Collections.emptyList());
    var operationalStart =
        Duration.parse(operationalTimeConfig.get(OPERATIONAL_PERIOD_START).toString());
    var operationalEnd =
        Duration.parse(operationalTimeConfig.get(OPERATIONAL_PERIOD_END).toString());
    setOperationalRange(
        Range.closed(Instant.now().minus(operationalStart), Instant.now().minus(operationalEnd)));
    stationDefinitionFacetingUtility = StationDefinitionFacetingUtility.create(this);
  }

  @Override
  public List<StationGroup> findStationGroupsByNameAndTime(
      List<String> stationGroupNames, Instant effectiveTime) {

    return findStationGroupsByNameAndTime(
        Set.copyOf(stationGroupNames),
        effectiveTime,
        DefaultFacetingFunctions.getStationGroupForTimeFacetingFunction(this, effectiveTime));
  }

  private List<StationGroup> findStationGroupsByNameAndTime(
      Set<String> stationGroupNames,
      Instant effectiveTime,
      UnaryOperator<List<StationGroup>> facetingFunction) {

    DelegateTimeFunction<StationGroup> delegateFunction =
        (List<String> names, Instant time) -> {
          List<StationGroup> delegateStationGroups =
              delegate.findStationGroupsByNameAndTime(names, time);

          time = checkAndUpdateEffectiveTime(time);
          if (getOperationalRange().contains(time)) {
            storeStationGroups(delegateStationGroups);
          }

          return delegateStationGroups;
        };

    // run partitioned cache query on station group names
    var cachedStationGroups =
        findCachedObjects(
            StationGroup.class,
            stationGroupNames,
            effectiveTime,
            facetingFunction,
            delegateFunction,
            StationGroup::getName);
    return sortCachedObjects(
        cachedStationGroups, StationGroup::getName, StationGroup::getEffectiveAt);
  }

  @Override
  public List<StationGroup> findStationGroupsByNameAndTime(
      List<String> stationGroupNames,
      Instant effectiveTime,
      FacetingDefinition facetingDefinition) {
    return findStationGroupsByNameAndTime(stationGroupNames, effectiveTime).stream()
        .map(
            stationGroup ->
                stationDefinitionFacetingUtility.populateFacets(
                    stationGroup, facetingDefinition, effectiveTime))
        .toList();
  }

  @Override
  public List<StationGroup> findStationGroupsByNameAndTimeRange(
      List<String> stationGroupNames, Instant startTime, Instant endTime) {
    DelegateRangeFunction<StationGroup> delegateFunction =
        (List<String> stationGroups, Instant start, Instant end) -> {
          List<StationGroup> delegateStationGroups =
              delegate.findStationGroupsByNameAndTimeRange(stationGroups, start, end);
          storeStationGroups(delegateStationGroups);
          return delegateStationGroups;
        };

    // run partitioned cache query on station group names to reduce memory/time complexity
    var cachedStationGroups =
        findCachedObjectsByIdAndTimeRange(
            StationGroup.class,
            stationGroupNames,
            startTime,
            endTime,
            UnaryOperator.identity(),
            delegateFunction);

    return sortCachedObjects(
        cachedStationGroups, StationGroup::getName, StationGroup::getEffectiveAt);
  }

  @Override
  public void storeStationGroups(List<StationGroup> stationGroups) {

    stationGroups.stream()
        .filter(stationGroup -> stationGroup.getEffectiveAt().isPresent())
        .collect(Collectors.groupingBy(StationGroup::getName))
        .forEach(
            (String name, List<StationGroup> value) -> {
              String key = StationGroup.class.getSimpleName().concat(name);

              RangeMap<Instant, Object> stationGroupVersionTimeRanges =
                  value.stream()
                      .filter(StationGroup::isPresent)
                      .map(EntityCachingStationDefinitionAccessor::mapToEntityReferenceStations)
                      .map(
                          EntityCachingStationDefinitionAccessor
                              ::mapStationGroupToTimeRangeMapEntry)
                      .filter(entry -> getOperationalRange().isConnected(entry.getKey()))
                      .collect(new TreeRangeMapCollector<>());

              versionCache.cacheVersionsByEntityIdAndTime(key, stationGroupVersionTimeRanges);
            });
  }

  private static StationGroup mapToEntityReferenceStations(StationGroup stationGroup) {
    List<Station> entityReferenceStations =
        stationGroup.getStations().stream().map(Station::toEntityReference).toList();
    // The presence of data in the stationGroup is verified by the filter() in the calling stream
    return stationGroup.toBuilder()
        .setData(
            stationGroup.getData().orElseThrow().toBuilder()
                .setStations(entityReferenceStations)
                .build())
        .build();
  }

  private static Map.Entry<Range<Instant>, Object> mapStationGroupToTimeRangeMapEntry(
      StationGroup stationGroup) {
    return Map.entry(
        getRange(stationGroup.getEffectiveAt(), true, stationGroup::getEffectiveUntil),
        (Object) stationGroup);
  }

  @Override
  public List<Station> findStationsByNameAndTime(List<String> stationNames, Instant effectiveTime) {
    return findStationsByNameAndTime(
        stationNames,
        effectiveTime,
        DefaultFacetingFunctions.getStationsForTimeFacetingFunction(this, effectiveTime));
  }

  public List<Station> findStationsByNameAndTimeEmptyData(
      List<String> stationNames, Instant effectiveTime) {
    return findStationsByNameAndTime(stationNames, effectiveTime, UnaryOperator.identity());
  }

  /**
   * Given a list of stationNames, effectiveTime and facetingDefinition this method will return
   * those list of Stations. If an empty list is provided, this method will return an empty list of
   * stations.
   *
   * @param stationNames - List of station names,
   * @param effectiveTime The effective time of the stations
   * @param facetingFunction Function to apply faceting to the retrieved cached stations
   * @return List of Station objects with provided names, effective time and populated via the
   *     provided faceting function
   */
  public List<Station> findStationsByNameAndTime(
      List<String> stationNames,
      Instant effectiveTime,
      UnaryOperator<List<Station>> facetingFunction) {
    DelegateTimeFunction<Station> delegateFunction =
        (List<String> stations, Instant effectiveAt) -> {
          List<Station> delegateStations =
              delegate.findStationsByNameAndTime(stations, effectiveAt);

          effectiveAt = checkAndUpdateEffectiveTime(effectiveAt);
          if (getOperationalRange().contains(effectiveAt)) {
            storeStations(delegateStations);
          }

          return delegateStations;
        };

    // run partitioned query stations
    var cachedStations =
        findCachedObjects(
            Station.class,
            Set.copyOf(stationNames),
            effectiveTime,
            facetingFunction,
            delegateFunction,
            Station::getName);

    return sortCachedObjects(cachedStations, Station::getName, Station::getEffectiveAt);
  }

  @Override
  public List<Station> findStationsByNameAndTime(
      List<String> stationNames, Instant effectiveTime, FacetingDefinition facetingDefinition) {

    return findStationsByNameAndTime(stationNames, effectiveTime).stream()
        .map(
            station ->
                stationDefinitionFacetingUtility.populateFacets(
                    station, facetingDefinition, effectiveTime))
        .filter(Objects::nonNull)
        .toList();
  }

  @Override
  public List<Station> findStationsByNameAndTimeRange(
      List<String> stationNames, Instant startTime, Instant endTime) {

    DelegateRangeFunction<Station> delegateFunction =
        (List<String> stations, Instant start, Instant end) -> {
          List<Station> delegateStations =
              delegate.findStationsByNameAndTimeRange(stations, start, end);
          storeStations(delegateStations);

          return delegateStations;
        };

    // run partitioned query on stations
    var cachedStations =
        findCachedObjectsByIdAndTimeRange(
            Station.class,
            stationNames,
            startTime,
            endTime,
            DefaultFacetingFunctions.getStationsForTimeRangeFacetingFunction(
                this, startTime, endTime),
            delegateFunction);

    return sortCachedObjects(cachedStations, Station::getName, Station::getEffectiveAt);
  }

  @Override
  public List<Instant> determineStationChangeTimes(
      Station station, Instant startTime, Instant endTime) {

    List<Station> stations =
        findStationsByNameAndTimeRange(List.of(station.getName()), startTime, endTime);

    List<ChannelGroup> channelGroups =
        findChannelGroupsByNameAndTimeRange(
            stations.stream()
                .map(Station::getChannelGroups)
                .flatMap(Set::stream)
                .map(ChannelGroup::getName)
                .toList(),
            startTime,
            endTime);
    List<Channel> channels =
        findChannelsByNameAndTimeRange(
            stations.stream()
                .map(Station::getAllRawChannels)
                .flatMap(Set::stream)
                .map(Channel::getName)
                .toList(),
            startTime,
            endTime);
    List<Response> responses =
        findResponsesByIdAndTimeRange(
            channels.stream()
                .map(Channel::getResponse)
                .flatMap(Optional::stream)
                .map(Response::getId)
                .toList(),
            startTime,
            endTime);

    return Stream.concat(
            Stream.concat(
                stations.stream().map(Station::getEffectiveAt),
                channelGroups.stream().map(ChannelGroup::getEffectiveAt)),
            Stream.concat(
                channels.stream().map(Channel::getEffectiveAt),
                responses.stream().map(Response::getEffectiveAt)))
        .flatMap(Optional::stream)
        .filter(instant -> !instant.isAfter(endTime))
        .sorted(Comparator.reverseOrder())
        .distinct()
        .toList();
  }

  @Override
  public void storeStations(List<Station> stations) {
    stations.stream()
        .filter(station -> station.getEffectiveAt().isPresent())
        .collect(Collectors.groupingBy(Station::getName))
        .forEach(
            (String name, List<Station> value) -> {
              String key = Station.class.getSimpleName().concat(name);

              RangeMap<Instant, Object> stationVersionTimeRanges =
                  value.stream()
                      .filter(Station::isPresent)
                      .map(EntityCachingStationDefinitionAccessor::mapToEntityReferenceChannels)
                      .map(EntityCachingStationDefinitionAccessor::mapStationToTimeRangeMapEntry)
                      .filter(entry -> getOperationalRange().isConnected(entry.getKey()))
                      .collect(new TreeRangeMapCollector<>());
              versionCache.cacheVersionsByEntityIdAndTime(key, stationVersionTimeRanges);
            });

    delegate.storeStations(stations);
  }

  private static Station mapToEntityReferenceChannels(Station station) {
    List<Channel> entityReferenceChannels =
        station.getAllRawChannels().stream().map(Channel::toEntityReference).toList();

    List<ChannelGroup> entityReferenceChannelGroups =
        station.getChannelGroups().stream().map(ChannelGroup::toEntityReference).toList();

    List<RelativePositionChannelPair> relPositions =
        station.getRelativePositionChannelPairs().stream()
            .map(
                relPos ->
                    RelativePositionChannelPair.create(
                        relPos.getRelativePosition(), relPos.getChannel().toEntityReference()))
            .toList();

    return station.toBuilder()
        .setData(
            station
                .getData()
                .map(
                    data ->
                        data.toBuilder()
                            .setAllRawChannels(entityReferenceChannels)
                            .setChannelGroups(entityReferenceChannelGroups)
                            .setRelativePositionChannelPairs(relPositions)
                            .build()))
        .build();
  }

  private static Map.Entry<Range<Instant>, Object> mapStationToTimeRangeMapEntry(Station station) {
    return Map.entry(
        getRange(station.getEffectiveAt(), station.isPresent(), station::getEffectiveUntil),
        (Object) station);
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByNameAndTime(
      List<String> channelGroupNames, Instant effectiveTime) {
    return findChannelGroupsByNameAndTime(
        channelGroupNames,
        effectiveTime,
        DefaultFacetingFunctions.getChannelGroupForTimeFacetingFunction(this, effectiveTime));
  }

  public List<ChannelGroup> findChannelGroupsByNameAndTimeEmptyData(
      List<String> channelGroupNames, Instant effectiveTime) {
    return findChannelGroupsByNameAndTime(
        channelGroupNames, effectiveTime, UnaryOperator.identity());
  }

  /**
   * Finds {@link ChannelGroup}s having one of the provided names that were active at the effective
   * time
   *
   * @param channelGroupNames The names of the channel groups to find
   * @param effectiveTime The effective time at which the channel groups must be active
   * @param facetingFunction Function to apply faceting to the retrieved cached channel groups
   * @return A list of {@link ChannelGroup}s with provided names, effective time and populated via
   *     the provided faceting function
   */
  public List<ChannelGroup> findChannelGroupsByNameAndTime(
      List<String> channelGroupNames,
      Instant effectiveTime,
      UnaryOperator<List<ChannelGroup>> facetingFunction) {
    DelegateTimeFunction<ChannelGroup> delegateFunction =
        (List<String> names, Instant time) -> {
          List<ChannelGroup> delegateChannelGroups =
              delegate.findChannelGroupsByNameAndTime(names, time);

          time = checkAndUpdateEffectiveTime(time);
          if (getOperationalRange().contains(time)) {
            storeChannelGroups(delegateChannelGroups);
          }
          return delegateChannelGroups;
        };

    // run partitioned query on channel groups
    var cachedChannelGroups =
        findCachedObjects(
            ChannelGroup.class,
            Set.copyOf(channelGroupNames),
            effectiveTime,
            facetingFunction,
            delegateFunction,
            ChannelGroup::getName);

    return sortCachedObjects(
        cachedChannelGroups, ChannelGroup::getName, ChannelGroup::getEffectiveAt);
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByNameAndTime(
      List<String> channelGroupNames,
      Instant effectiveTime,
      FacetingDefinition facetingDefinition) {
    return findChannelGroupsByNameAndTime(channelGroupNames, effectiveTime).stream()
        .map(
            channelGroup ->
                stationDefinitionFacetingUtility.populateFacets(
                    channelGroup, facetingDefinition, effectiveTime))
        .filter(Objects::nonNull)
        .toList();
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByNameAndTimeRange(
      List<String> channelGroupNames, Instant startTime, Instant endTime) {

    DelegateRangeFunction<ChannelGroup> delegateFunction =
        (List<String> channelGroups, Instant start, Instant end) -> {
          List<ChannelGroup> delegateChannelGroups =
              delegate.findChannelGroupsByNameAndTimeRange(channelGroups, start, end);

          storeChannelGroups(delegateChannelGroups);
          return delegateChannelGroups;
        };

    // run partitioned query on channel groups
    var cachedChannelGroups =
        findCachedObjectsByIdAndTimeRange(
            ChannelGroup.class,
            channelGroupNames,
            startTime,
            endTime,
            UnaryOperator.identity(),
            delegateFunction);

    return sortCachedObjects(
        cachedChannelGroups, ChannelGroup::getName, ChannelGroup::getEffectiveAt);
  }

  @Override
  public void storeChannelGroups(List<ChannelGroup> channelGroups) {

    channelGroups.stream()
        .filter(channelGroup -> channelGroup.getEffectiveAt().isPresent())
        .filter(ChannelGroup::isPresent)
        .collect(Collectors.groupingBy(ChannelGroup::getName))
        .forEach(
            (String name, List<ChannelGroup> value) -> {
              String key = ChannelGroup.class.getSimpleName().concat(name);

              RangeMap<Instant, Object> channelGroupVersionTimeRanges =
                  value.stream()
                      .map(EntityCachingStationDefinitionAccessor::mapToEntityReferenceChannels)
                      .map(
                          EntityCachingStationDefinitionAccessor
                              ::mapChannelGroupToTimeRangeMapEntry)
                      .filter(entry -> getOperationalRange().isConnected(entry.getKey()))
                      .collect(new TreeRangeMapCollector<>());
              versionCache.cacheVersionsByEntityIdAndTime(key, channelGroupVersionTimeRanges);
            });
    delegate.storeChannelGroups(channelGroups);
  }

  private static ChannelGroup mapToEntityReferenceChannels(ChannelGroup channelGroup) {
    List<Channel> entityReferenceChannels =
        channelGroup.getChannels().stream().map(Channel::toEntityReference).toList();
    // The presence of data in the stationGroup is verified by the filter() in the calling stream
    return channelGroup.toBuilder()
        .setData(
            channelGroup.getData().orElseThrow().toBuilder()
                .setChannels(entityReferenceChannels)
                .build())
        .build();
  }

  private static Map.Entry<Range<Instant>, Object> mapChannelGroupToTimeRangeMapEntry(
      ChannelGroup channelGroup) {
    return Map.entry(
        getRange(
            channelGroup.getEffectiveAt(),
            channelGroup.isPresent(),
            channelGroup::getEffectiveUntil),
        (Object) channelGroup);
  }

  @Override
  public List<Channel> findChannelsByNameAndTime(List<String> channelNames, Instant effectiveTime) {
    return findChannelsByNameAndTime(
        channelNames,
        effectiveTime,
        DefaultFacetingFunctions.getChannelsForTimeFacetingFunction(this, effectiveTime));
  }

  public List<Channel> findChannelsByNameAndTimeEmptyData(
      List<String> channelNames, Instant effectiveTime) {
    return findChannelsByNameAndTime(channelNames, effectiveTime, UnaryOperator.identity());
  }

  /**
   * Finds {@link Channel}s having one of the provided names that were active at the provided time
   *
   * @param channelNames The names of the channels to find
   * @param effectiveTime The time at which the channels must be active
   * @param facetingFunction Function to apply faceting to the retrieved cached channels
   * @return A list of {@link Channel}s with the provided names , effective time and populated via
   *     the provided faceting function
   */
  public List<Channel> findChannelsByNameAndTime(
      List<String> channelNames,
      Instant effectiveTime,
      UnaryOperator<List<Channel>> facetingFunction) {

    DelegateTimeFunction<Channel> delegateFunction =
        (List<String> names, Instant time) -> {
          List<Channel> delegateChannels = delegate.findChannelsByNameAndTime(names, time);

          time = checkAndUpdateEffectiveTime(time);
          if (getOperationalRange().contains(time)) {
            storeChannels(delegateChannels);

            storeResponses(
                delegateChannels.stream()
                    .map(Channel::getResponse)
                    .flatMap(Optional::stream)
                    .toList());
          }

          return delegateChannels;
        };

    // run partitioned query on channels
    var cachedChannels =
        findCachedObjects(
            Channel.class,
            Set.copyOf(channelNames),
            effectiveTime,
            facetingFunction,
            delegateFunction,
            Channel::getName);

    return sortCachedObjects(cachedChannels, Channel::getName, Channel::getEffectiveAt);
  }

  @Override
  public List<Channel> findChannelsByNameAndTime(
      List<String> channelNames, Instant effectiveTime, FacetingDefinition facetingDefinition) {
    return findChannelsByNameAndTime(channelNames, effectiveTime).stream()
        .map(
            channel ->
                stationDefinitionFacetingUtility.populateFacets(
                    channel, facetingDefinition, effectiveTime))
        .toList();
  }

  @Override
  public List<Channel> findChannelsByNameAndTimeRange(
      List<String> channelNames, Instant startTime, Instant endTime) {
    DelegateRangeFunction<Channel> delegateFunction =
        (List<String> channels, Instant start, Instant end) -> {
          List<Channel> delegateChannels =
              delegate.findChannelsByNameAndTimeRange(channels, start, end);

          storeChannels(delegateChannels);
          return delegateChannels;
        };

    // run partitioned query on channels
    var cachedChannels =
        findCachedObjectsByIdAndTimeRange(
            Channel.class,
            channelNames,
            startTime,
            endTime,
            UnaryOperator.identity(),
            delegateFunction);

    storeResponses(
        cachedChannels.stream().map(Channel::getResponse).flatMap(Optional::stream).toList());

    return sortCachedObjects(cachedChannels, Channel::getName, Channel::getEffectiveAt);
  }

  @Override
  public void storeChannels(List<Channel> channels) {

    channels.stream()
        .filter(channel -> channel.getEffectiveAt().isPresent())
        .filter(Channel::isPresent)
        .collect(Collectors.groupingBy(Channel::getName))
        .forEach(
            (String name, List<Channel> value) -> {
              String key = Channel.class.getSimpleName().concat(name);

              RangeMap<Instant, Object> channelVersionTimeRanges =
                  value.stream()
                      .map(EntityCachingStationDefinitionAccessor::mapToEntityReferenceStations)
                      .map(EntityCachingStationDefinitionAccessor::mapChannelToTimeRangeMapEntry)
                      .filter(entry -> getOperationalRange().isConnected(entry.getKey()))
                      .collect(new TreeRangeMapCollector<>());

              versionCache.cacheVersionsByEntityIdAndTime(key, channelVersionTimeRanges);
            });

    delegate.storeChannels(channels);
  }

  private static Channel mapToEntityReferenceStations(Channel channel) {
    var station = channel.getStation();
    var entityReferenceResponse =
        channel
            .getResponse()
            .map(response -> Response.createEntityReference(response.getId()))
            .orElse(null);
    return channel.toBuilder()
        .setData(
            channel
                .getData()
                .map(
                    data ->
                        data.toBuilder()
                            .setResponse(entityReferenceResponse)
                            .setStation(station.toEntityReference())
                            .build()))
        .build();
  }

  private static Map.Entry<Range<Instant>, Object> mapChannelToTimeRangeMapEntry(Channel channel) {
    return Map.entry(
        getRange(channel.getEffectiveAt(), channel.isPresent(), channel::getEffectiveUntil),
        (Object) channel);
  }

  @Override
  public List<Response> findResponsesById(Collection<UUID> responseIds, Instant effectiveTime) {
    DelegateTimeFunction<Response> delegateFunction =
        (List<String> idStrings, Instant time) -> {
          List<UUID> ids = idStrings.stream().map(UUID::fromString).toList();

          List<Response> delegateResponses = delegate.findResponsesById(ids, time);

          time = checkAndUpdateEffectiveTime(time);
          if (getOperationalRange().contains(time)) {
            storeResponses(delegateResponses);
          }

          return delegateResponses;
        };

    var stringIds = responseIds.stream().map(UUID::toString).collect(Collectors.toSet());

    // run partitioned query on responses
    return findCachedObjects(
        Response.class,
        stringIds,
        effectiveTime,
        UnaryOperator.identity(),
        delegateFunction,
        response -> response.getId().toString());
  }

  @Override
  public List<Response> findResponsesById(
      Collection<UUID> responseIds, Instant effectiveTime, FacetingDefinition facetingDefinition) {
    DelegateTimeFunction<Response> delegateFunction =
        (List<String> idStrings, Instant effectiveAt) -> {
          List<UUID> ids = idStrings.stream().map(UUID::fromString).toList();

          List<Response> delegateResponses =
              delegate.findResponsesById(ids, effectiveAt, facetingDefinition);

          effectiveAt = checkAndUpdateEffectiveTime(effectiveAt);
          if (getOperationalRange().contains(effectiveAt)) {
            storeResponses(delegateResponses);
          }
          return delegateResponses;
        };

    var stringIds = responseIds.stream().map(UUID::toString).collect(Collectors.toSet());

    // run partitioned query on responses
    var responses =
        findCachedObjects(
            Response.class,
            stringIds,
            effectiveTime,
            UnaryOperator.identity(),
            delegateFunction,
            response -> response.getId().toString());

    // apply faceting to the cached responses
    return responses.stream()
        .map(
            response ->
                stationDefinitionFacetingUtility.populateFacets(
                    response, facetingDefinition, effectiveTime))
        .filter(Objects::nonNull)
        .distinct()
        .toList();
  }

  @Override
  public List<Response> findResponsesByIdAndTimeRange(
      Collection<UUID> responseIds, Instant startTime, Instant endTime) {
    DelegateRangeFunction<Response> delegateFunction =
        (List<String> responses, Instant start, Instant end) -> {
          List<UUID> responseUUIDs = responses.stream().map(UUID::fromString).toList();

          List<Response> delegateResponses =
              delegate.findResponsesByIdAndTimeRange(responseUUIDs, start, end);
          storeResponses(delegateResponses);
          return delegateResponses;
        };

    // find responses by name and time range
    List<String> responseIdStrings = responseIds.stream().map(UUID::toString).toList();

    // run partitioned query on responses
    return findCachedObjectsByIdAndTimeRange(
        Response.class,
        responseIdStrings,
        startTime,
        endTime,
        UnaryOperator.identity(),
        delegateFunction);
  }

  @Override
  public Response loadResponseFromWfdisc(long wfdiscRecord) {

    var mappedResponse = stationDefinitionIdUtility.getResponseForWfid(wfdiscRecord);
    Response versionedResponse = null;

    if (mappedResponse.isPresent()) {
      var response = mappedResponse.orElseThrow();
      var responseId = response.getId();
      var effectiveAt = response.getEffectiveAt();

      if (effectiveAt.isPresent()) {
        versionedResponse =
            (Response)
                versionCache.retrieveVersionsByEntityIdAndTime(
                    Response.class.getSimpleName().concat(responseId.toString()),
                    effectiveAt.orElseThrow());
      } else {
        var versionedResponseMap =
            versionCache.retrieveVersionsByEntityIdAndTimeRangeMap(
                Response.class.getSimpleName().concat(responseId.toString()));

        if (!versionedResponseMap.asMapOfRanges().isEmpty()) {
          Instant lastTime = versionedResponseMap.span().upperEndpoint();
          versionedResponse = (Response) versionedResponseMap.get(lastTime);
        }
      }
    }

    if (versionedResponse != null) {
      return versionedResponse;
    } else {
      var bridgedResponse = delegate.loadResponseFromWfdisc(wfdiscRecord);
      storeResponses(List.of(bridgedResponse));
      return bridgedResponse;
    }
  }

  @Override
  public void storeResponses(List<Response> responses) {

    responses.stream()
        .filter(response -> response.getEffectiveAt().isPresent())
        .collect(Collectors.groupingBy(Response::getId))
        .forEach(
            (UUID id, List<Response> value) -> {
              String key = Response.class.getSimpleName().concat(id.toString());

              RangeMap<Instant, Object> responseVersionTimeRanges =
                  value.stream()
                      .map(
                          response ->
                              Map.entry(
                                  getRange(
                                      response.getEffectiveAt(),
                                      response.isPresent(),
                                      response::getEffectiveUntil),
                                  (Object) response))
                      .filter(entry -> getOperationalRange().isConnected(entry.getKey()))
                      .collect(new TreeRangeMapCollector<>());
              versionCache.cacheVersionsByEntityIdAndTime(key, responseVersionTimeRanges);
            });

    delegate.storeResponses(responses);
  }

  @Override
  public void cache(List<String> stationGroupNames, Instant startTime, Instant endTime) {
    Objects.requireNonNull(stationGroupNames);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Preconditions.checkState(startTime.isBefore(endTime));

    setOperationalRange(Range.closed(startTime, endTime));
    versionCache.clear();
    List<StationGroup> stationGroups =
        findStationGroupsByNameAndTimeRange(stationGroupNames, startTime, endTime);

    List<String> stationNames =
        stationGroups.stream()
            .map(StationGroup::getStations)
            .flatMap(Set::stream)
            .map(Station::getName)
            .toList();

    List<Station> stations = findStationsByNameAndTimeRange(stationNames, startTime, endTime);

    List<String> channelGroupNames =
        stations.stream()
            .map(Station::getChannelGroups)
            .flatMap(Set::stream)
            .map(ChannelGroup::getName)
            .toList();

    List<ChannelGroup> channelGroups =
        findChannelGroupsByNameAndTimeRange(channelGroupNames, startTime, endTime);

    List<String> channelNames =
        channelGroups.stream()
            .map(ChannelGroup::getChannels)
            .flatMap(Set::stream)
            .map(Channel::getName)
            .toList();

    List<Channel> channels = findChannelsByNameAndTimeRange(channelNames, startTime, endTime);

    List<UUID> responseIds =
        channels.stream()
            .map(Channel::getResponse)
            .flatMap(Optional::stream)
            .map(Response::getId)
            .toList();

    findResponsesByIdAndTimeRange(responseIds, startTime, endTime);
  }

  /**
   * Retrieve objects from the cache of the desired type, faceting the children appropriately, and
   * delegating any missing values to the delegate {@link StationDefinitionAccessor}
   *
   * @param entityType The entity type to retrieve from the cache
   * @param ids The ids of the entities to retrieve
   * @param effectiveTime the time at which the entities must be effective
   * @param childFacetingFunction the function determining how to facet the children of the
   *     retrieved values
   * @param delegateFunction the function for retrieving data from the delegate
   * @param idExtractor function for getting the ids from the retrieved objects
   * @param <T> The COI type of object to retrieve
   * @return The objects from the cache and delegate
   */
  private <T> List<T> findCachedObjects(
      Class<T> entityType,
      Set<String> ids,
      Instant effectiveTime,
      UnaryOperator<List<T>> childFacetingFunction,
      DelegateTimeFunction<T> delegateFunction,
      Function<T, String> idExtractor) {

    var updatedEffectiveTime = checkAndUpdateEffectiveTime(effectiveTime);

    List<T> cachedEntities = new ArrayList<>();

    List<String> operatingIds = new ArrayList<>(ids);

    // need some logging here to see what's in the version cache
    if (getOperationalRange().contains(updatedEffectiveTime)) {

      cachedEntities =
          operatingIds.stream()
              .map(id -> entityType.getSimpleName().concat(id))
              .filter(versionCache::versionsByEntityIdAndTimeHasKey)
              .map(id -> versionCache.retrieveVersionsByEntityIdAndTime(id, updatedEffectiveTime))
              .filter(
                  (Object object) -> {
                    if (object != null) {
                      return true;
                    }
                    LOGGER.debug(
                        "Attempting to retrieve entities of type {} from the cache, but "
                            + "retrieved a null value, ignoring",
                        entityType.toString());
                    return false;
                  })
              .map(entityType::cast)
              .toList();

      cachedEntities =
          childFacetingFunction.apply(cachedEntities).stream()
              .filter(Objects::nonNull)
              .collect(Collectors.toCollection(ArrayList::new));
      operatingIds.removeAll(cachedEntities.stream().map(idExtractor).toList());
    }

    if (!operatingIds.isEmpty()) {

      List<T> nonCachedEntities = delegateFunction.apply(operatingIds, effectiveTime);

      nonCachedEntities =
          childFacetingFunction.apply(nonCachedEntities).stream()
              .filter(Objects::nonNull)
              .collect(Collectors.toCollection(ArrayList::new));

      cachedEntities.addAll(nonCachedEntities);
    }

    return cachedEntities;
  }

  /**
   * Retrieve cached objects of the provided type by key and time range
   *
   * @param entityType The entity type to retrieve
   * @param coiNames the names of objects to retrieve
   * @param startTime the start of the time range
   * @param endTime the end of the time range
   * @param childFacetingFunction the function for apply the appropriate faceting to the child
   *     objects
   * @param delegateFunction the function for retrieving names not found in the cache via the
   *     delegate
   * @param <T> The type of object to return
   * @return The objects from the cache and/or delegate
   */
  private <T> List<T> findCachedObjectsByIdAndTimeRange(
      Class<T> entityType,
      List<String> coiNames,
      Instant startTime,
      Instant endTime,
      UnaryOperator<List<T>> childFacetingFunction,
      DelegateRangeFunction<T> delegateFunction) {

    // create the time range from start and end
    Range<Instant> timeRange = Range.closed(startTime, endTime);
    List<String> uncachedNames = new ArrayList<>();

    // create delegate range set to query for ranges that aren't covered in the cache
    List<T> cachedObjects = new ArrayList<>();
    coiNames.forEach(
        (String name) -> {

          // create delegate range set to query for ranges that aren't covered in the cache
          RangeSet<Instant> delegateRangeSet = TreeRangeSet.create();
          delegateRangeSet.add(timeRange);

          String key = entityType.getSimpleName().concat(name);

          RangeMap<Instant, Object> cacheRangeMap =
              versionCache.retrieveVersionsByEntityIdAndTimeRangeMap(key);

          // check if the cache range map contains the station group key and pull the associated
          // RangeMap of Range->StationGroupVersion
          if (cacheRangeMap != null && !cacheRangeMap.asMapOfRanges().isEmpty()) {

            cachedObjects.addAll(
                cacheRangeMap.asDescendingMapOfRanges().entrySet().stream()
                    .map(entry -> removeTimeRangeFromDelegateSet(entry, delegateRangeSet))
                    .filter(entry -> timeRange.isConnected(entry.getKey()))
                    .map(Map.Entry::getValue)
                    .distinct()
                    .map(entityType::cast)
                    .toList());
          }

          // if the query range is not fully accounted for, it is faster to query the entire range
          // with all the coi names not fully accounted for at once
          // if necessary we can try to improve the speed of this method by creating new db queries
          if (!delegateRangeSet.isEmpty()) {
            uncachedNames.add(name);
          }
        });

    if (!uncachedNames.isEmpty()) {
      List<T> nonCachedEntities =
          delegateFunction.apply(uncachedNames, startTime, endTime).stream()
              .filter(Objects::nonNull)
              .collect(Collectors.toCollection(ArrayList::new));
      cachedObjects.addAll(nonCachedEntities);
    }

    List<T> facetedObjects = childFacetingFunction.apply(cachedObjects);

    return facetedObjects.stream().filter(Objects::nonNull).sorted().distinct().toList();
  }

  private static Map.Entry<Range<Instant>, Object> removeTimeRangeFromDelegateSet(
      Map.Entry<Range<Instant>, Object> entry, RangeSet<Instant> delegateRangeSet) {
    Range<Instant> timeRangeEntry = entry.getKey();
    delegateRangeSet.remove(timeRangeEntry);
    return entry;
  }

  @Override
  public FrequencyAmplitudePhase findFrequencyAmplitudePhaseById(UUID id) {
    return delegate.findFrequencyAmplitudePhaseById(id);
  }

  @FunctionalInterface
  private interface DelegateRangeFunction<T> {

    List<T> apply(List<String> names, Instant startTime, Instant endTime);
  }

  @FunctionalInterface
  private interface DelegateTimeFunction<T> {

    List<T> apply(List<String> names, Instant effectiveTime);
  }

  private static Range<Instant> getRange(
      Optional<Instant> effectiveAt,
      boolean dataPresent,
      Supplier<Optional<Instant>> effectiveUntilSupplier) {

    Instant start = effectiveAt.orElseThrow();
    if (dataPresent && effectiveUntilSupplier.get().isPresent()) {

      Optional<Instant> endTimeOptional = effectiveUntilSupplier.get();
      if (endTimeOptional.isPresent()) {
        return Range.closed(start, endTimeOptional.get());
      }
    }
    return Range.atLeast(start);
  }

  /**
   * Sort the cached station definition objects based on the names and effective times
   *
   * @param cachedObjects list of cached station def objects
   * @return list of T objects
   */
  private static <T> List<T> sortCachedObjects(
      List<T> cachedObjects,
      Function<T, String> getNameFunction,
      Function<T, Optional<Instant>> getEffAtFunction) {

    Comparator<T> compareByNameAndTime =
        comparing(getNameFunction)
            .thenComparing(
                getEffAtFunction, comparing(opt -> opt.orElse(null), nullsFirst(naturalOrder())));

    return cachedObjects.stream().sorted(compareByNameAndTime).toList();
  }

  private Range<Instant> getOperationalRange() {
    return operationalRange.get();
  }

  private void setOperationalRange(Range<Instant> operationalRange) {
    this.operationalRange.set(operationalRange);
  }

  // check effective time - if it's greater than operational time range subtract an hour
  private Instant checkAndUpdateEffectiveTime(Instant effectiveTime) {
    return effectiveTime.isAfter(getOperationalRange().upperEndpoint())
        ? effectiveTime.minus(1, ChronoUnit.HOURS)
        : effectiveTime;
  }
}
