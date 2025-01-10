package gms.shared.stationdefinition.converter;

import static gms.shared.stationdefinition.converter.ConverterWarnings.CHANNELS_NOT_EMPTY;
import static gms.shared.stationdefinition.converter.ConverterWarnings.CHANNEL_GROUPS_NOT_EMPTY;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITES_NOT_EMPTY;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITE_CHANS_NOT_EMPTY;
import static gms.shared.stationdefinition.converter.ConverterWarnings.START_END_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.VERSION_END_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.VERSION_START_STR;

import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableTable;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.RelativePosition;
import gms.shared.stationdefinition.coi.channel.RelativePositionChannelPair;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationType;
import gms.shared.stationdefinition.converter.interfaces.StationConverter;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class DaoStationConverter implements StationConverter {
  private static final Logger LOGGER = LoggerFactory.getLogger(DaoStationConverter.class);

  public static Optional<SiteDao> getMainSiteDao(Collection<SiteDao> siteDaos) {
    SiteDao mainSiteDao = null;
    try {
      mainSiteDao =
          siteDaos.stream()
              .filter(
                  siteDao -> siteDao.getReferenceStation().equals(siteDao.getId().getStationCode()))
              .findFirst()
              .orElseThrow();
    } catch (NoSuchElementException e) {
      LOGGER.error("MainSiteDao does not exist, could not create station");
    }
    return Optional.ofNullable(mainSiteDao);
  }

  @Override
  public Station convert(String referenceStation) {
    Preconditions.checkNotNull(referenceStation, "Reference station must not be null.");

    return Station.builder().setName(referenceStation).build();
  }

  /**
   * Converts a single main SiteDao to a {@link Station} version reference
   *
   * @param siteDao - {@link SiteDao}
   * @return {@link Station}
   */
  @Override
  public Station convertToVersionReference(SiteDao siteDao) {
    Preconditions.checkNotNull(siteDao);

    return Station.builder()
        .setName(siteDao.getReferenceStation())
        .setEffectiveAt(siteDao.getId().getOnDate())
        .build();
  }

  @Override
  public Station convertToEntityReference(SiteDao siteDao) {
    Preconditions.checkNotNull(siteDao);

    return Station.createEntityReference(siteDao.getReferenceStation());
  }

  /**
   * Converts a list of SiteDaos and SiteChanDaos to a populated {@link Station} with {@link
   * Channel} and {@link ChannelGroup} version reference lists
   *
   * @param versionStartTime the start of the time range of interest
   * @param versionEndTime the end of the time range of interest
   * @param siteDaos list of {@link SiteDao}
   * @param siteChanDaos list of {@link SiteChanDao}
   * @param channelGroups list of reference {@link ChannelGroup}s
   * @param channels list of reference {@link Channel}s
   * @return {@link Station}
   */
  @Override
  public Station convert(
      Instant versionStartTime,
      Instant versionEndTime,
      Collection<SiteDao> siteDaos,
      Collection<SiteChanDao> siteChanDaos,
      Collection<ChannelGroup> channelGroups,
      Collection<Channel> channels) {

    checkPreconditions(
        versionStartTime, versionEndTime, siteDaos, siteChanDaos, channelGroups, channels);

    Optional<SiteDao> mainSiteDao = getMainSiteDao(siteDaos);
    if (mainSiteDao.isEmpty()) {
      return null;
    }

    var siteChansByStation = getSiteChansByStation(siteChanDaos);
    Map<String, ChannelGroup> channelGroupMap =
        channelGroups.stream()
            .collect(Collectors.toMap(ChannelGroup::getName, Function.identity()));
    Map<Channel, RelativePosition> relativePositionMap = new HashMap<>();
    List<String> channelsFromChannelGroups = new ArrayList<>();
    populatePositionMapAndChannelGroups(
        siteDaos,
        siteChansByStation,
        channelGroupMap,
        channelsFromChannelGroups,
        relativePositionMap);

    // depending on the version info from channelGroup, not all channels may be in this version of
    // the station
    channels =
        channels.stream()
            .filter(chan -> channelsFromChannelGroups.contains(chan.getName()))
            .toList();

    List<ChannelTypes> channelTypes =
        siteChanDaos.stream()
            .map(
                siteChan -> ChannelTypesParser.parseChannelTypes(siteChan.getId().getChannelCode()))
            .flatMap(Optional::stream)
            .toList();

    var staType = mainSiteDao.orElseThrow().getStaType();
    var stationType = stationTypeFromChannelsTypes(channelTypes, staType);
    var location = getLocation(mainSiteDao.orElseThrow());

    try {
      Instant newEndDate = versionEndTime;
      // this should be done in the jpa converter, but there are side effects of setting it to null,
      // needs to be set to Optional.empty()
      if (newEndDate.equals(Instant.MAX)) {
        newEndDate = null;
      }
      var stationData =
          Station.Data.builder()
              .setType(stationType)
              .setDescription(mainSiteDao.orElseThrow().getStationName())
              .setRelativePositionChannelPairs(
                  relativePositionMap.entrySet().stream()
                      .map(
                          entry ->
                              RelativePositionChannelPair.create(entry.getValue(), entry.getKey()))
                      .toList())
              .setLocation(location)
              .setEffectiveUntil(newEndDate)
              .setChannelGroups(channelGroupMap.values())
              .setAllRawChannels(channels)
              .build();

      return Station.builder()
          .setName(mainSiteDao.orElseThrow().getReferenceStation())
          .setEffectiveAt(versionStartTime)
          .setData(stationData)
          .build();
    } catch (IllegalArgumentException e) {
      LOGGER.error(
          "IllegalArgumentException for station {}",
          mainSiteDao.orElseThrow().getId().getStationCode(),
          e);
      return null;
    }
  }

  private static void checkPreconditions(
      Instant versionStartTime,
      Instant versionEndTime,
      Collection<SiteDao> siteDaos,
      Collection<SiteChanDao> siteChanDaos,
      Collection<ChannelGroup> channelGroups,
      Collection<Channel> channels) {
    Preconditions.checkNotNull(versionStartTime, VERSION_START_STR);
    Preconditions.checkNotNull(versionEndTime, VERSION_END_STR);
    Preconditions.checkNotNull(
        siteDaos, SITES_NOT_EMPTY + START_END_TIME_STR, versionStartTime, versionEndTime);
    Preconditions.checkNotNull(
        siteChanDaos, SITE_CHANS_NOT_EMPTY + START_END_TIME_STR, versionStartTime, versionEndTime);
    Preconditions.checkNotNull(
        channelGroups,
        CHANNEL_GROUPS_NOT_EMPTY + START_END_TIME_STR,
        versionStartTime,
        versionEndTime);
    Preconditions.checkNotNull(
        channels, CHANNELS_NOT_EMPTY + START_END_TIME_STR, versionStartTime, versionEndTime);

    Preconditions.checkState(
        !siteDaos.isEmpty(),
        SITES_NOT_EMPTY + START_END_TIME_STR,
        versionStartTime,
        versionEndTime);
    Preconditions.checkState(
        !siteChanDaos.isEmpty(),
        SITE_CHANS_NOT_EMPTY + START_END_TIME_STR,
        versionStartTime,
        versionEndTime);
    Preconditions.checkState(
        !channelGroups.isEmpty(),
        CHANNEL_GROUPS_NOT_EMPTY + START_END_TIME_STR,
        versionStartTime,
        versionEndTime);
    Preconditions.checkState(
        !channels.isEmpty(),
        CHANNELS_NOT_EMPTY + START_END_TIME_STR,
        versionStartTime,
        versionEndTime);
  }

  private static Map<String, List<SiteChanDao>> getSiteChansByStation(
      Collection<SiteChanDao> siteChanDaos) {
    return siteChanDaos.stream()
        .collect(
            Collectors.groupingBy(
                Functions.compose(SiteChanKey::getStationCode, SiteChanDao::getId)));
  }

  private static void populatePositionMapAndChannelGroups(
      Collection<SiteDao> siteDaos,
      Map<String, List<SiteChanDao>> siteChansByStation,
      Map<String, ChannelGroup> channelGroupMap,
      List<String> channelsFromChannelGroups,
      Map<Channel, RelativePosition> relativePositionMap) {
    siteDaos.stream()
        // remove reference sites
        .filter(
            siteDao ->
                !(siteDao.getId().getStationCode().equalsIgnoreCase(siteDao.getReferenceStation())
                    && siteDao.getStaType() == StaType.ARRAY_STATION))
        // get the channels from the channel groups
        .forEach(
            (SiteDao siteDao) -> {
              if (channelExistsForTheStation(siteDao, siteChansByStation)) {

                var relativePosition =
                    RelativePosition.from(siteDao.getDegreesNorth(), siteDao.getDegreesEast(), 0);

                // get associated channel group
                var channelGroup = channelGroupMap.get(siteDao.getId().getStationCode());

                if (channelGroup != null) {
                  channelsFromChannelGroups.addAll(
                      channelGroup.getChannels().stream().map(Channel::getName).toList());

                  // map relative positions
                  for (Channel channel : channelGroup.getChannels()) {
                    relativePositionMap.put(channel, relativePosition);
                  }
                } else {
                  LOGGER.warn(
                      "Channel group necessary for site {} is not present.",
                      siteDao.getId().getStationCode());
                }
              }
            });
  }

  private static boolean channelExistsForTheStation(
      SiteDao siteDao, Map<String, List<SiteChanDao>> siteChansByStation) {
    return siteChansByStation.containsKey(siteDao.getId().getStationCode())
        && !siteChansByStation.get(siteDao.getId().getStationCode()).isEmpty();
  }

  /**
   * Extracts the {@link StationType} from list of {@link ChannelTypes} given a {@link StaType}. If
   * the list contains more than one {@link ChannelTypes}, the first {@link ChannelTypes} is used.
   *
   * @param channelTypesList the list of {@link ChannelTypes}
   * @param staType array vs single station (or unknown)
   * @return the corresponding {@link StationType}
   */
  public static StationType stationTypeFromChannelsTypes(
      List<ChannelTypes> channelTypesList, StaType staType) {
    Table<StaType, ChannelDataType, StationType> stationTypeTable =
        ImmutableTable.<StaType, ChannelDataType, StationType>builder()
            .put(
                StaType.ARRAY_STATION,
                ChannelDataType.HYDROACOUSTIC,
                StationType.HYDROACOUSTIC_ARRAY)
            .put(StaType.ARRAY_STATION, ChannelDataType.INFRASOUND, StationType.INFRASOUND_ARRAY)
            .put(StaType.ARRAY_STATION, ChannelDataType.SEISMIC, StationType.SEISMIC_ARRAY)
            .put(StaType.SINGLE_STATION, ChannelDataType.HYDROACOUSTIC, StationType.HYDROACOUSTIC)
            .put(StaType.SINGLE_STATION, ChannelDataType.INFRASOUND, StationType.INFRASOUND)
            .put(StaType.SINGLE_STATION, ChannelDataType.WEATHER, StationType.WEATHER)
            .build();

    List<ChannelDataType> channelDataTypes =
        channelTypesList.stream().map(ChannelTypes::getDataType).distinct().sorted().toList();

    if (channelDataTypes.isEmpty()) {
      return StationType.UNKNOWN;
    }

    // This uses the enumberation order to derive the station type for stations with mixed types
    // for example, a station with weather and infrasound will be labeled as infrasound
    var channelDataType = channelDataTypes.get(0);
    StationType result;

    if (StaType.SINGLE_STATION == staType && ChannelDataType.SEISMIC == channelDataType) {
      Map<ChannelOrientationType, Long> orientationCounts =
          channelTypesList.stream()
              .map(ChannelTypes::getOrientationType)
              .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
      // after grouping by orientation, if we have multiple orientations, we have more than a 1
      // component
      if (orientationCounts.size() == 1) {
        result = StationType.SEISMIC_1_COMPONENT;
      } else {
        result = StationType.SEISMIC_3_COMPONENT;
      }
    } else {
      result = stationTypeTable.get(staType, channelDataType);
    }

    return result;
  }

  public static Location getLocation(SiteDao mainSiteDao) {
    // TODO continue to hardcode depth to 0?
    return Location.from(
        mainSiteDao.getLatitude(), mainSiteDao.getLongitude(), 0, mainSiteDao.getElevation());
  }
}
