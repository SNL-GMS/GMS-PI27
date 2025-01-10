package gms.shared.stationdefinition.accessor;

import com.google.common.base.Preconditions;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.api.channel.ChannelGroupRepository;
import gms.shared.stationdefinition.api.channel.ChannelRepository;
import gms.shared.stationdefinition.api.channel.FrequencyAmplitudePhaseRepository;
import gms.shared.stationdefinition.api.channel.ResponseRepository;
import gms.shared.stationdefinition.api.station.StationGroupRepository;
import gms.shared.stationdefinition.api.station.StationRepository;
import gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component("defaultStationDefinitionAccessor")
public class DefaultStationDefinitionAccessor implements StationDefinitionAccessor {

  public static final String CACHE_INITIALIZED = "Cache already initialized: ";
  public static final String NULL_STATION_MESSAGE = "Station cannot be null";
  public static final String NULL_START_TIME_MESSAGE = "Start time cannot be null";
  public static final String NULL_END_TIME_MESSAGE = "End time cannot be null";
  public static final String END_BEFORE_START_MESSAGE = "End time cannot be before start time";
  private final StationGroupRepository stationGroupRepository;
  private final StationRepository stationRepository;
  private final ChannelGroupRepository channelGroupRepository;
  private final ChannelRepository channelRepository;
  private final ResponseRepository responseRepository;
  private final FrequencyAmplitudePhaseRepository frequencyAmplitudePhaseRepository;
  private StationDefinitionFacetingUtility stationDefinitionFacetingUtility;
  private final SystemConfig systemConfig;

  @Autowired
  public DefaultStationDefinitionAccessor(
      SystemConfig systemConfig,
      @Qualifier("bridgedStationGroupRepository") StationGroupRepository stationGroupRepository,
      @Qualifier("bridgedStationRepository") StationRepository stationRepository,
      @Qualifier("bridgedChannelGroupRepository") ChannelGroupRepository channelGroupRepository,
      @Qualifier("bridgedChannelRepository") ChannelRepository channelRepository,
      @Qualifier("bridgedResponseRepository") ResponseRepository responseRepository,
      @Qualifier("bridgedFrequencyAmplitudePhaseRepository") FrequencyAmplitudePhaseRepository frequencyAmplitudePhaseRepository) {

    this.systemConfig = systemConfig;
    this.stationGroupRepository = stationGroupRepository;
    this.stationRepository = stationRepository;
    this.channelGroupRepository = channelGroupRepository;
    this.channelRepository = channelRepository;
    this.responseRepository = responseRepository;
    this.frequencyAmplitudePhaseRepository = frequencyAmplitudePhaseRepository;
  }

  @PostConstruct
  public void init() {
    stationDefinitionFacetingUtility = StationDefinitionFacetingUtility.create(this);
    StationDefinitionCacheFactory.setUpCache(systemConfig);
  }

  @Override
  public List<StationGroup> findStationGroupsByNameAndTime(
      List<String> stationGroupNames, Instant effectiveAt) {
    return stationGroupRepository.findStationGroupsByNameAndTime(stationGroupNames, effectiveAt);
  }

  @Override
  public List<StationGroup> findStationGroupsByNameAndTime(
      List<String> stationGroupNames,
      Instant effectiveTime,
      FacetingDefinition facetingDefinition) {
    return stationGroupRepository
        .findStationGroupsByNameAndTime(stationGroupNames, effectiveTime)
        .stream()
        .map(
            stationGroup ->
                stationDefinitionFacetingUtility.populateFacets(
                    stationGroup, facetingDefinition, effectiveTime))
        .filter(Objects::nonNull)
        .distinct()
        .toList();
  }

  @Override
  public List<StationGroup> findStationGroupsByNameAndTimeRange(
      List<String> stationGroupNames, Instant startTime, Instant endTime) {
    return stationGroupRepository.findStationGroupsByNameAndTimeRange(
        stationGroupNames, startTime, endTime);
  }

  @Override
  public List<Station> findStationsByNameAndTime(List<String> stationNames, Instant effectiveTime) {
    return stationRepository.findStationsByNameAndTime(stationNames, effectiveTime).stream()
        .filter(Objects::nonNull)
        .distinct()
        .toList();
  }

  @Override
  public List<Station> findStationsByNameAndTime(
      List<String> stationNames, Instant effectiveTime, FacetingDefinition facetingDefinition) {
    return stationRepository.findStationsByNameAndTime(stationNames, effectiveTime).stream()
        .map(
            station ->
                stationDefinitionFacetingUtility.populateFacets(
                    station, facetingDefinition, effectiveTime))
        .filter(Objects::nonNull)
        .distinct()
        .toList();
  }

  @Override
  public List<Station> findStationsByNameAndTimeRange(
      List<String> stationNames, Instant startTime, Instant endTime) {
    return stationRepository.findStationsByNameAndTimeRange(stationNames, startTime, endTime);
  }

  @Override
  public List<Instant> determineStationChangeTimes(
      Station station, Instant startTime, Instant endTime) {
    Objects.requireNonNull(station, NULL_STATION_MESSAGE);
    Objects.requireNonNull(startTime, NULL_START_TIME_MESSAGE);
    Objects.requireNonNull(endTime, NULL_END_TIME_MESSAGE);
    Preconditions.checkState(!endTime.isBefore(startTime), END_BEFORE_START_MESSAGE);

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
  public List<ChannelGroup> findChannelGroupsByNameAndTime(
      List<String> channelGroupNames, Instant effectiveAt) {
    return channelGroupRepository
        .findChannelGroupsByNameAndTime(channelGroupNames, effectiveAt)
        .stream()
        .filter(Objects::nonNull)
        .distinct()
        .toList();
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByNameAndTime(
      List<String> channelGroupNames,
      Instant effectiveTime,
      FacetingDefinition facetingDefinition) {
    return channelGroupRepository
        .findChannelGroupsByNameAndTime(channelGroupNames, effectiveTime)
        .stream()
        .map(
            channelGroup ->
                stationDefinitionFacetingUtility.populateFacets(
                    channelGroup, facetingDefinition, effectiveTime))
        .filter(Objects::nonNull)
        .distinct()
        .toList();
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByNameAndTimeRange(
      List<String> channelGroupNames, Instant startTime, Instant endTime) {
    return channelGroupRepository.findChannelGroupsByNameAndTimeRange(
        channelGroupNames, startTime, endTime);
  }

  @Override
  public List<Channel> findChannelsByNameAndTime(List<String> channelNames, Instant effectiveAt) {
    return channelRepository.findChannelsByNameAndTime(channelNames, effectiveAt);
  }

  @Override
  public List<Channel> findChannelsByNameAndTime(
      List<String> channelNames, Instant effectiveAt, FacetingDefinition facetingDefinition) {
    return channelRepository.findChannelsByNameAndTime(channelNames, effectiveAt).stream()
        .map(
            channel ->
                stationDefinitionFacetingUtility.populateFacets(
                    channel, facetingDefinition, effectiveAt))
        .filter(Objects::nonNull)
        .distinct()
        .toList();
  }

  @Override
  public List<Channel> findChannelsByNameAndTimeRange(
      List<String> channelNames, Instant startTime, Instant endTime) {
    return channelRepository.findChannelsByNameAndTimeRange(channelNames, startTime, endTime);
  }

  @Override
  public List<Response> findResponsesById(Collection<UUID> responseIds, Instant effectiveTime) {
    Objects.requireNonNull(responseIds);
    Objects.requireNonNull(effectiveTime);

    return responseRepository.findResponsesById(responseIds, effectiveTime);
  }

  @Override
  public List<Response> findResponsesById(
      Collection<UUID> responseIds, Instant effectiveTime, FacetingDefinition facetingDefinition) {

    Objects.requireNonNull(responseIds);
    Objects.requireNonNull(effectiveTime);
    Objects.requireNonNull(facetingDefinition);

    return responseRepository.findResponsesById(responseIds, effectiveTime).stream()
        .map(
            response ->
                stationDefinitionFacetingUtility.populateFacets(
                    response, facetingDefinition, effectiveTime))
        .toList();
  }

  @Override
  public List<Response> findResponsesByIdAndTimeRange(
      Collection<UUID> responseIds, Instant startTime, Instant endTime) {

    Objects.requireNonNull(responseIds);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Preconditions.checkState(!endTime.isBefore(startTime), END_BEFORE_START_MESSAGE);

    return responseRepository.findResponsesByIdAndTimeRange(responseIds, startTime, endTime);
  }

  @Override
  public Response loadResponseFromWfdisc(long wfdiscRecord) {
    return responseRepository.loadResponseFromWfdisc(wfdiscRecord);
  }

  @Override
  public FrequencyAmplitudePhase findFrequencyAmplitudePhaseById(UUID id) {
    return frequencyAmplitudePhaseRepository.findFrequencyAmplitudePhaseById(id);
  }
}
