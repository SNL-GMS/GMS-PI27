package gms.shared.stationdefinition.accessor;

import com.google.common.base.Functions;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.RelativePositionChannelPair;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class DefaultFacetingFunctions {

  private static final Logger LOGGER = LoggerFactory.getLogger(DefaultFacetingFunctions.class);

  private DefaultFacetingFunctions() {
    // Hide implicit public constructor
  }

  public static UnaryOperator<List<StationGroup>> getStationGroupForTimeFacetingFunction(
      EntityCachingStationDefinitionAccessor accessor, Instant effectiveTime) {
    return stationGroups ->
        buildStationGroupForTimeFacetingFunction(stationGroups, accessor, effectiveTime);
  }

  private static List<StationGroup> buildStationGroupForTimeFacetingFunction(
      List<StationGroup> stationGroups,
      EntityCachingStationDefinitionAccessor accessor,
      Instant effectiveTime) {

    List<String> stationNames =
        stationGroups.stream()
            .flatMap(stationGroup -> stationGroup.getStations().stream())
            .filter(station -> station.getEffectiveAt().isEmpty())
            .map(Station::getName)
            .distinct()
            .toList();

    Map<String, Station> versionReferenceStations;
    if (!stationNames.isEmpty()) {
      versionReferenceStations =
          accessor.findStationsByNameAndTimeEmptyData(stationNames, effectiveTime).stream()
              .collect(Collectors.toMap(Station::getName, Function.identity()));
    } else {
      versionReferenceStations = new HashMap<>();
    }

    return stationGroups.stream()
        .map(
            (StationGroup stationGroup) -> {

              // ensure that all stations in station group have effective at time
              List<Station> stations =
                  stationGroup.getStations().stream()
                      .map(
                          station ->
                              versionReferenceStations
                                  .getOrDefault(station.getName(), station)
                                  .toBuilder()
                                  .setData(Optional.empty())
                                  .build())
                      .toList();

              return stationGroup.toBuilder()
                  .setData(
                      stationGroup.getData().orElseThrow().toBuilder()
                          .setStations(stations)
                          .build())
                  .build();
            })
        .toList();
  }

  public static UnaryOperator<List<Station>> getStationsForTimeFacetingFunction(
      EntityCachingStationDefinitionAccessor accessor, Instant effectiveTime) {

    return stations -> buildStationsForTimeFacetingFunction(stations, accessor, effectiveTime);
  }

  private static List<Station> buildStationsForTimeFacetingFunction(
      List<Station> stations,
      EntityCachingStationDefinitionAccessor accessor,
      Instant effectiveTime) {
    List<String> channelNames =
        stations.stream()
            .flatMap(station -> station.getAllRawChannels().stream())
            .filter(channel -> channel.getEffectiveAt().isEmpty())
            .map(Channel::getName)
            .toList();

    Map<String, Channel> versionReferenceChannels;
    if (!channelNames.isEmpty()) {
      versionReferenceChannels =
          accessor.findChannelsByNameAndTimeEmptyData(channelNames, effectiveTime).stream()
              .collect(Collectors.toMap(Channel::getName, Function.identity()));
    } else {
      versionReferenceChannels = new HashMap<>();
    }

    List<String> channelGroupNames =
        stations.stream()
            .flatMap(station -> station.getChannelGroups().stream())
            .filter(
                channelGroup ->
                    channelGroup.getEffectiveAt().isEmpty()
                        || !channelGroupHasVersionChannels(channelGroup))
            .map(ChannelGroup::getName)
            .toList();

    Map<String, ChannelGroup> channelGroupFacets;
    if (!channelGroupNames.isEmpty()) {
      // The faceting for channel groups by time is the same as the faceting for channel groups
      // within stations by time
      channelGroupFacets =
          accessor.findChannelGroupsByNameAndTime(channelGroupNames, effectiveTime).stream()
              .collect(Collectors.toMap(ChannelGroup::getName, Function.identity()));
    } else {
      channelGroupFacets = new HashMap<>();
    }

    return stations.stream()
        .map(station -> facetStation(station, versionReferenceChannels, channelGroupFacets))
        .flatMap(Optional::stream)
        .toList();
  }

  private static Optional<Station> facetStation(
      Station station,
      Map<String, Channel> versionReferenceChannels,
      Map<String, ChannelGroup> channelGroupFacets) {
    List<Channel> rawChannels =
        station.getAllRawChannels().stream()
            .map(
                channel ->
                    versionReferenceChannels.getOrDefault(channel.getName(), channel).toBuilder()
                        .setData(Optional.empty())
                        .build())
            .toList();

    List<String> channelNamesForFiltering =
        station.getAllRawChannels().stream().map(Channel::getName).toList();

    List<ChannelGroup> channelGroups =
        station.getChannelGroups().stream()
            .map(
                channelGroup ->
                    channelGroupFacets.getOrDefault(channelGroup.getName(), channelGroup))
            .filter(
                channelGroup ->
                    channelNamesForFiltering.containsAll(
                        channelGroup.getChannels().stream().map(Channel::getName).toList()))
            .toList();

    // filter version reference channels using channel group raw channels
    List<Channel> filteredReferenceChannels =
        filterVersionReferenceChannels(rawChannels, channelGroups);

    if (channelGroups.isEmpty() || filteredReferenceChannels.isEmpty()) {
      LOGGER.warn("No channel group or channels found for station {}", station.getName());
      return Optional.empty();
    }

    Map<String, Channel> channelNameMap =
        rawChannels.stream().collect(Collectors.toMap(Channel::getName, Functions.identity()));

    List<RelativePositionChannelPair> relPositions =
        station.getRelativePositionChannelPairs().stream()
            .map(
                (RelativePositionChannelPair relPos) -> {
                  var posChan = channelNameMap.get(relPos.getChannel().getName());
                  if (posChan != null) {
                    relPos =
                        RelativePositionChannelPair.create(relPos.getRelativePosition(), posChan);
                  }
                  return relPos;
                })
            .toList();

    return Optional.of(
        station.toBuilder()
            .setData(
                station.getData().orElseThrow().toBuilder()
                    .setAllRawChannels(filteredReferenceChannels)
                    .setChannelGroups(channelGroups)
                    .setRelativePositionChannelPairs(relPositions)
                    .build())
            .build());
  }

  private static boolean channelGroupHasVersionChannels(ChannelGroup channelGroup) {

    if (channelGroup.isPresent()) {
      var channels = channelGroup.getChannels();

      for (Channel channel : channels) {
        if (channel.getEffectiveAt().isEmpty()) {
          return false;
        }
      }

      return true;
    }
    return false;
  }

  public static UnaryOperator<List<Station>> getStationsForTimeRangeFacetingFunction(
      EntityCachingStationDefinitionAccessor accessor, Instant startTime, Instant endTime) {

    return stations ->
        stations.stream()
            .map(station -> getStationFacetedForTimeRange(station, accessor))
            .flatMap(Optional::stream)
            .toList();
  }

  private static Optional<Station> getStationFacetedForTimeRange(
      Station station, EntityCachingStationDefinitionAccessor accessor) {

    List<String> channelNamesForFiltering =
        station.getAllRawChannels().stream().map(Channel::getName).toList();

    List<ChannelGroup> populatedChannelGroups =
        station.getChannelGroups().stream()
            .filter(chanGroup -> chanGroup.getEffectiveAt().isPresent() && chanGroup.isPresent())
            .collect(Collectors.toList());

    List<String> names =
        station.getChannelGroups().stream()
            .filter(chanGroup -> !chanGroup.getEffectiveAt().isPresent() || !chanGroup.isPresent())
            .map(ChannelGroup::getName)
            .toList();

    populatedChannelGroups.addAll(
        accessor.findChannelGroupsByNameAndTime(names, station.getEffectiveAt().orElseThrow()));

    // channel group used for stations in a range query is the version that exists at
    // the start of the station
    List<ChannelGroup> channelGroups =
        populatedChannelGroups.stream()
            .filter(Objects::nonNull)
            .filter(
                channelGroup ->
                    channelNamesForFiltering.containsAll(
                        channelGroup.getChannels().stream().map(Channel::getName).toList()))
            .map(
                (ChannelGroup channelGroup) -> {
                  List<Channel> entityChannels =
                      channelGroup.getChannels().stream().map(Channel::toEntityReference).toList();

                  return channelGroup.toBuilder()
                      .setData(
                          channelGroup.getData().orElseThrow().toBuilder()
                              .setChannels(entityChannels)
                              .build())
                      .build();
                })
            .toList();

    List<Channel> rawChannels =
        station.getAllRawChannels().stream().map(Channel::toEntityReference).toList();

    // filter version reference channels using channel group raw channels
    List<Channel> filteredReferenceChannels =
        filterVersionReferenceChannels(rawChannels, channelGroups);

    if (channelGroups.isEmpty() || filteredReferenceChannels.isEmpty()) {
      return Optional.empty();
    }

    return Optional.of(
        station.toBuilder()
            .setData(
                station.getData().orElseThrow().toBuilder()
                    .setAllRawChannels(filteredReferenceChannels)
                    .setChannelGroups(channelGroups)
                    .build())
            .build());
  }

  public static UnaryOperator<List<ChannelGroup>> getChannelGroupForTimeFacetingFunction(
      EntityCachingStationDefinitionAccessor accessor, Instant effectiveTime) {

    return channelGroups ->
        buildChannelGroupForTimeFacetingFunction(channelGroups, accessor, effectiveTime);
  }

  private static List<ChannelGroup> buildChannelGroupForTimeFacetingFunction(
      List<ChannelGroup> channelGroups,
      EntityCachingStationDefinitionAccessor accessor,
      Instant effectiveTime) {
    List<String> channelNames =
        channelGroups.stream()
            .flatMap(channelGroup -> channelGroup.getChannels().stream())
            .filter(channelGroup -> channelGroup.getEffectiveAt().isEmpty())
            .map(Channel::getName)
            .toList();

    Map<String, Channel> versionReferenceChannels;
    if (!channelNames.isEmpty()) {
      versionReferenceChannels =
          accessor.findChannelsByNameAndTimeEmptyData(channelNames, effectiveTime).stream()
              .collect(Collectors.toMap(Channel::getName, Function.identity()));
    } else {
      versionReferenceChannels = new HashMap<>();
    }

    return channelGroups.stream()
        .map(channelGroup -> facetChannelGroup(channelGroup, versionReferenceChannels))
        .flatMap(Optional::stream)
        .toList();
  }

  private static Optional<ChannelGroup> facetChannelGroup(
      ChannelGroup channelGroup, Map<String, Channel> versionReferenceChannels) {
    List<Channel> channels =
        channelGroup.getChannels().stream()
            .map(
                channel ->
                    versionReferenceChannels.getOrDefault(channel.getName(), channel).toBuilder()
                        .setData(Optional.empty())
                        .build())
            .toList();

    if (channels.isEmpty()) {
      return Optional.empty();
    }

    return Optional.of(
        channelGroup.toBuilder()
            .setData(channelGroup.getData().orElseThrow().toBuilder().setChannels(channels).build())
            .build());
  }

  public static UnaryOperator<List<Channel>> getChannelsForTimeFacetingFunction(
      EntityCachingStationDefinitionAccessor accessor, Instant effectiveTime) {

    return channels -> buildChannelsForTimeFacetingFunction(channels, accessor, effectiveTime);
  }

  private static List<Channel> buildChannelsForTimeFacetingFunction(
      List<Channel> channels,
      EntityCachingStationDefinitionAccessor accessor,
      Instant effectiveTime) {
    List<UUID> uuids =
        channels.stream()
            .map(Channel::getResponse)
            .filter(response -> response.isPresent() && !response.get().isPresent())
            .map(res -> res.get().getId())
            .toList();

    Map<UUID, Response> responseMap;
    if (!uuids.isEmpty()) {
      responseMap =
          accessor.findResponsesById(uuids, effectiveTime).stream()
              .collect(Collectors.toMap(Response::getId, Function.identity()));
    } else {
      responseMap = new HashMap<>();
    }

    List<String> stationNames =
        channels.stream()
            .map(Channel::getData)
            .flatMap(Optional::stream)
            .map(chanData -> chanData.getStation().getName())
            .distinct()
            .toList();

    UnaryOperator<List<Station>> versionFacet =
        (List<Station> stations) -> stations.stream().map(Station::createVersionReference).toList();

    Map<String, Station> stationNameMap =
        accessor.findStationsByNameAndTime(stationNames, effectiveTime, versionFacet).stream()
            .collect(Collectors.toMap(Station::getName, Functions.identity()));

    return channels.stream()
        .map(
            (Channel channel) -> {
              var dataBuilder = channel.getData().orElseThrow().toBuilder();
              if (channel.getResponse().isPresent()) {
                var res =
                    responseMap.getOrDefault(
                        channel.getResponse().get().getId(), channel.getResponse().get());
                dataBuilder.setResponse(res);
              }
              var posStation = stationNameMap.get(channel.getStation().getName());
              if (posStation != null) {
                dataBuilder.setStation(posStation);
              }

              return channel.toBuilder().setData(dataBuilder.build()).build();
            })
        .toList();
  }

  /**
   * Filtering operation to remove version reference channels that don't exist in channel groups
   *
   * @param versionReferenceChannels list of version reference channels
   * @param channelGroups list of channel groups
   * @return filtered version reference channels
   */
  private static List<Channel> filterVersionReferenceChannels(
      Collection<Channel> versionReferenceChannels, List<ChannelGroup> channelGroups) {
    Set<String> rawChannels =
        channelGroups.stream()
            .map(ChannelGroup::getChannels)
            .flatMap(Collection::stream)
            .map(Channel::getName)
            .collect(Collectors.toSet());

    return versionReferenceChannels.stream()
        .filter(channel -> rawChannels.contains(channel.getName()))
        .toList();
  }
}
