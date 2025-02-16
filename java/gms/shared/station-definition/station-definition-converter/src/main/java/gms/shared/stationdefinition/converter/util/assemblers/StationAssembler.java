package gms.shared.stationdefinition.converter.util.assemblers;

import static java.util.stream.Collectors.groupingBy;

import com.google.common.base.Functions;
import com.google.common.collect.Range;
import com.google.common.collect.Table;
import com.google.common.math.DoubleMath;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.comparator.StationComparator;
import gms.shared.stationdefinition.converter.interfaces.StationConverter;
import gms.shared.stationdefinition.converter.util.TemporalMap;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.util.StartAndEndForSiteAndSiteChan;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.NavigableMap;
import java.util.NavigableSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.BiPredicate;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class StationAssembler {
  public static final double FLOAT24_EPSILON = 1e-7;
  // logic of what changes in site cause a change in station
  private static final BiPredicate<SiteDao, SiteDao> changeOccuredForMainSite =
      (SiteDao prev, SiteDao curr) -> {
        if (prev == null) {
          return curr != null;
        }

        return !prev.equals(curr);
      };

  private static final BiPredicate<SiteDao, SiteDao> changeOccuredForSiteRelPos =
      (SiteDao prev, SiteDao curr) -> {
        if (prev == null) {
          return curr != null;
        }

        if (curr == null) {
          return true;
        }

        return !DoubleMath.fuzzyEquals(
                prev.getDegreesEast(), curr.getDegreesEast(), FLOAT24_EPSILON)
            || !DoubleMath.fuzzyEquals(
                prev.getDegreesNorth(), curr.getDegreesNorth(), FLOAT24_EPSILON);
      };

  private static final Logger LOGGER = LoggerFactory.getLogger(StationAssembler.class);
  private final StationConverter stationConverter;

  public StationAssembler(StationConverter stationConverter) {
    this.stationConverter = stationConverter;
  }

  public List<Station> buildAllForTime(
      List<SiteDao> sites,
      List<SiteChanDao> siteChans,
      Collection<ChannelGroup> channelGroups,
      Collection<Channel> channels,
      Instant effectiveAt,
      Map<String, SiteChanKey> channelNameSiteChanKeyMap,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    List<Station> stationList =
        createStationTablesAndMaps(
            sites,
            siteChans,
            Pair.of(effectiveAt, effectiveAt),
            channelGroups,
            channels,
            Channel::createVersionReference,
            channelNameSiteChanKeyMap,
            startEndBooleans);

    Map<String, List<Station>> stationMap =
        stationList.stream().collect(groupingBy(Station::getName));

    // we need to remove the prev/next versions since they were only used to set the start/end time
    // we also return the version that is effectiveAt the request time or the one previous to it if
    // none exist
    return stationMap.values().stream()
        .map(
            list ->
                list.stream()
                    .filter(station -> !station.getEffectiveAt().get().isAfter(effectiveAt))
                    .sorted(new StationComparator())
                    .sorted(Comparator.reverseOrder())
                    .findFirst())
        .flatMap(Optional::stream)
        .sorted(new StationComparator())
        .toList();
  }

  /**
   * Build list of {@link Station} for the entire time range of the query
   *
   * @param sites - list of {@link SiteDao}s
   * @param siteChans - list of {@link SiteChanDao}s
   * @param channelGroups
   * @param channels
   * @return list of {@link Station}s
   */
  public List<Station> buildAllForTimeRange(
      List<SiteDao> sites,
      List<SiteChanDao> siteChans,
      Collection<ChannelGroup> channelGroups,
      Collection<Channel> channels,
      Instant requestStartTime,
      Instant requestEndTime,
      Map<String, SiteChanKey> channelNameSiteChanKeyMap,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    List<Station> stationList =
        createStationTablesAndMaps(
            sites,
            siteChans,
            Pair.of(requestStartTime, requestEndTime),
            channelGroups,
            channels,
            Channel::createEntityReference,
            channelNameSiteChanKeyMap,
            startEndBooleans);

    return stationList.stream()
        .filter(
            station ->
                !station.getEffectiveUntil().isPresent()
                    || !station.getEffectiveUntil().get().isBefore(requestStartTime))
        .filter(station -> !station.getEffectiveAt().orElseThrow().isAfter(requestEndTime))
        .sorted(new StationComparator())
        .toList();
  }

  /**
   * At this stage necessary tables and maps for sites/sitechans are created for station then for
   * each reference station string, all the sites/sitechans associated with that string are passed
   * to
   *
   * @param sites - List of {@link SiteDao}
   * @param siteChans - List of {@link SiteChanDao}
   * @param startEndTime
   * @param channelGroups
   * @param channels
   * @param channelFunc
   */
  private List<Station> createStationTablesAndMaps(
      List<SiteDao> sites,
      List<SiteChanDao> siteChans,
      Pair<Instant, Instant> startEndTime,
      Collection<ChannelGroup> channelGroups,
      Collection<Channel> channels,
      UnaryOperator<Channel> channelFunc,
      Map<String, SiteChanKey> channelNameSiteChanKeyMap,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    Table<String, String, NavigableMap<Instant, Channel>> channelTable =
        AssemblerUtils.buildVersionTable(
            Functions.compose(channelNameSiteChanKeyMap::get, Channel::getName)
                .andThen(SiteChanKey::getStationCode),
            Functions.compose(channelNameSiteChanKeyMap::get, Channel::getName)
                .andThen(SiteChanKey::getChannelCode),
            Functions.compose(Optional::get, Channel::getEffectiveAt),
            channels);

    Table<String, String, NavigableMap<Instant, ChannelGroup>> channelGroupTable =
        AssemblerUtils.buildVersionTable(
            Functions.compose(
                Station::getName, Functions.compose(Optional::get, ChannelGroup::getStation)),
            ChannelGroup::getName,
            Functions.compose(Optional::get, ChannelGroup::getEffectiveAt),
            channelGroups);

    Map<String, Set<String>> stationCodesByReferenceStation =
        sites.stream()
            .collect(
                groupingBy(
                    SiteDao::getReferenceStation,
                    Collectors.mapping(
                        Functions.compose(SiteKey::getStationCode, SiteDao::getId),
                        Collectors.toSet())));

    TemporalMap<String, SiteDao> sitesByStationCode =
        sites.stream()
            .collect(
                TemporalMap.collector(
                    Functions.compose(SiteKey::getStationCode, SiteDao::getId),
                    Functions.compose(SiteKey::getOnDate, SiteDao::getId)));

    Table<String, String, NavigableMap<Instant, SiteChanDao>> siteChansByStationAndChannel =
        AssemblerUtils.buildVersionTable(
            Functions.compose(SiteChanKey::getStationCode, SiteChanDao::getId),
            Functions.compose(SiteChanKey::getChannelCode, SiteChanDao::getId),
            Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId),
            siteChans);

    return stationCodesByReferenceStation.entrySet().stream()
        .flatMap(
            entry ->
                processStations(
                    entry.getKey(),
                    entry.getValue(),
                    startEndTime,
                    sitesByStationCode,
                    siteChansByStationAndChannel,
                    channelGroupTable.row(entry.getKey()),
                    channelTable,
                    channelFunc,
                    startEndBooleans)
                    .stream())
        .filter(Objects::nonNull)
        .sorted()
        .toList();
  }

  /** At this stage for a set of station codes associated with a single reference station */
  private List<Station> processStations(
      String mainStationCode,
      Set<String> stationCodes,
      Pair<Instant, Instant> startEndTime,
      TemporalMap<String, SiteDao> sitesByStationCode,
      Table<String, String, NavigableMap<Instant, SiteChanDao>> siteChansByStationAndChannel,
      Map<String, NavigableMap<Instant, ChannelGroup>> channelGroupMap,
      Table<String, String, NavigableMap<Instant, Channel>> channelTable,
      UnaryOperator<Channel> channelFunc,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    // determine if range or single point in time
    boolean isRange = startEndTime.getLeft().isBefore(startEndTime.getRight());

    // get mapping of station code + channel code to a navigable map of channels
    Map<String, NavigableMap<Instant, Channel>> channelMap =
        stationCodes.stream()
            .map(stationCode -> Pair.of(stationCode, channelTable.row(stationCode).entrySet()))
            .flatMap(
                pair ->
                    pair.getRight().stream()
                        .map(
                            entry ->
                                Pair.of(pair.getLeft() + "." + entry.getKey(), entry.getValue())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight));

    Map<String, NavigableMap<Instant, SiteDao>> sitesForStation =
        stationCodes.stream()
            .map(stationCode -> Pair.of(stationCode, sitesByStationCode.getVersionMap(stationCode)))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight));

    Map<String, NavigableMap<Instant, SiteChanDao>> siteChansForStation =
        stationCodes.stream()
            .map(
                stationCode ->
                    Pair.of(stationCode, siteChansByStationAndChannel.row(stationCode).entrySet()))
            .flatMap(
                pair ->
                    pair.getRight().stream()
                        .map(
                            entry ->
                                Pair.of(pair.getLeft() + "." + entry.getKey(), entry.getValue())))
            .collect(Collectors.toMap(Pair::getLeft, Pair::getRight));

    // check for attribute changes
    NavigableSet<Instant> possibleVersionTimes =
        getChangeTimes(
            sitesForStation, mainStationCode, channelGroupMap, channelMap, startEndBooleans);
    var validTimes = AssemblerUtils.getValidTimes(startEndTime, possibleVersionTimes, isRange);

    return processPossibleVersionTimes(
        startEndTime,
        validTimes,
        sitesForStation,
        siteChansForStation,
        channelGroupMap,
        channelMap,
        channelFunc);
  }

  private List<Station> processPossibleVersionTimes(
      Pair<Instant, Instant> startEndTime,
      List<Instant> possibleVersionTimes,
      Map<String, NavigableMap<Instant, SiteDao>> sitesForVersion,
      Map<String, NavigableMap<Instant, SiteChanDao>> siteChansForVersion,
      Map<String, NavigableMap<Instant, ChannelGroup>> channelGroupsByStaChan,
      Map<String, NavigableMap<Instant, Channel>> channelsByStaChan,
      UnaryOperator<Channel> channelFunc) {

    Instant sdoTime;

    List<Station> versionedStation = new ArrayList<>();
    for (var i = 0; i < possibleVersionTimes.size() - 1; i++) {
      Range<Instant> versionRange =
          Range.open(possibleVersionTimes.get(i), possibleVersionTimes.get(i + 1));

      var endtime = AssemblerUtils.getImmediatelyBeforeInstant(versionRange.upperEndpoint());
      List<Channel> activeChannels;
      List<ChannelGroup> activeChannelGroups;

      if (startEndTime.getLeft().equals(startEndTime.getRight())
          && versionRange.contains(startEndTime.getLeft())) {
        sdoTime = startEndTime.getLeft();

        // get channels/channel groups active at specific time
        activeChannels =
            AssemblerUtils.getObjectsForVersionTimeEnd(
                sdoTime, channelsByStaChan, chan -> chan.getEffectiveUntil().orElse(Instant.MAX));

        activeChannelGroups =
            AssemblerUtils.getObjectsForVersionTimeEnd(
                sdoTime,
                channelGroupsByStaChan,
                chanGroup -> chanGroup.getEffectiveUntil().orElse(Instant.MAX));

      } else {
        sdoTime = versionRange.lowerEndpoint();
        activeChannels =
            AssemblerUtils.getObjectsForVersionTime(
                sdoTime, channelsByStaChan, chan -> chan.getEffectiveUntil().orElse(Instant.MAX));
        activeChannelGroups =
            AssemblerUtils.getObjectsForVersionTime(
                sdoTime,
                channelGroupsByStaChan,
                chanGroup -> chanGroup.getEffectiveUntil().orElse(Instant.MAX));
      }

      List<SiteDao> versionSites =
          AssemblerUtils.getObjectsForVersionTime(
              versionRange.lowerEndpoint(), sitesForVersion, SiteDao::getOffDate);
      List<SiteChanDao> versionSiteChanDaos =
          AssemblerUtils.getObjectsForVersionTime(
              versionRange.lowerEndpoint(), siteChansForVersion, SiteChanDao::getOffDate);

      if (activeChannels.isEmpty() || activeChannelGroups.isEmpty()) {
        LOGGER.debug("No Active Channels or ChannelGroups for time range: {}", versionRange);
        continue;
      }

      var curStation =
          convertStation(
              Range.closed(versionRange.lowerEndpoint(), endtime),
              versionSites,
              versionSiteChanDaos,
              activeChannelGroups,
              activeChannels);

      if (curStation.isPresent()) {
        versionedStation.add(curStation.orElseThrow());
      }
    }

    versionedStation =
        versionedStation.stream()
            .map(
                (Station station) -> {
                  var rawChannels =
                      station.getAllRawChannels().stream().map(channelFunc::apply).toList();
                  return station.toBuilder()
                      .setData(
                          station.getData().get().toBuilder()
                              .setAllRawChannels(rawChannels)
                              .build())
                      .build();
                })
            .toList();

    return versionedStation;
  }

  private Optional<Station> convertStation(
      Range<Instant> versionRange,
      List<SiteDao> versionSiteDaos,
      List<SiteChanDao> versionSiteChanDaos,
      List<ChannelGroup> channelGroups,
      List<Channel> channels) {
    Optional<Station> curStation = Optional.empty();
    try {
      curStation =
          Optional.ofNullable(
              stationConverter.convert(
                  versionRange.lowerEndpoint(),
                  versionRange.upperEndpoint(),
                  versionSiteDaos,
                  versionSiteChanDaos,
                  channelGroups,
                  channels));
    } catch (Exception ex) {
      var errMsg =
          String.format(
              "Could not convert station with time range %s - %s",
              versionRange.lowerEndpoint(), versionRange.upperEndpoint());
      errMsg =
          errMsg.concat(
              String.format(
                  " with sites %s",
                  versionSiteDaos.stream().map(SiteDao::getId).map(SiteKey::toString).toList()));
      errMsg =
          errMsg.concat(
              String.format(
                  " and siteChans %s",
                  versionSiteChanDaos.stream()
                      .map(SiteChanDao::getId)
                      .map(SiteChanKey::toString)
                      .toList()));

      LOGGER.debug(errMsg, ex);
    }
    return curStation;
  }

  private static NavigableSet<Instant> getChangeTimes(
      Map<String, NavigableMap<Instant, SiteDao>> sitesForVersion,
      String mainSiteCode,
      Map<String, NavigableMap<Instant, ChannelGroup>> channelGroupMap,
      Map<String, NavigableMap<Instant, Channel>> channelMap,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    // first get times based on channel group and channel
    NavigableSet<Instant> changeTimes = AssemblerUtils.getTimesForObjectChanges(channelGroupMap);
    changeTimes.addAll(AssemblerUtils.getTimesForObjectChanges(channelMap));

    if (sitesForVersion.get(mainSiteCode) != null) {
      AssemblerUtils.addChangeTimesToListForDaosWithDayAccuracy(
          changeTimes,
          sitesForVersion.get(mainSiteCode),
          changeOccuredForMainSite,
          Functions.compose(SiteKey::getOnDate, SiteDao::getId),
          SiteDao::getOffDate,
          startEndBooleans::isPrevTimeOverLapForSite,
          startEndBooleans::isNextTimeOverLapForSite);
    }

    var relPosTimes = getRelativeChangeTimes(sitesForVersion, channelGroupMap, startEndBooleans);
    changeTimes.addAll(relPosTimes);
    return changeTimes;
  }

  private static NavigableSet<Instant> getRelativeChangeTimes(
      Map<String, NavigableMap<Instant, SiteDao>> sitesForVersion,
      Map<String, NavigableMap<Instant, ChannelGroup>> channelGroupMap,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    NavigableSet<Instant> relPosTimes = new TreeSet<>();

    for (Entry<String, NavigableMap<Instant, SiteDao>> entry : sitesForVersion.entrySet()) {

      NavigableSet<Instant> possTimes = new TreeSet<>();
      AssemblerUtils.addChangeTimesToListForDaosWithDayAccuracy(
          possTimes,
          entry.getValue(),
          changeOccuredForSiteRelPos,
          Functions.compose(SiteKey::getOnDate, SiteDao::getId),
          SiteDao::getOffDate,
          startEndBooleans::isPrevTimeOverLapForSite,
          startEndBooleans::isNextTimeOverLapForSite);

      var channelGroups = channelGroupMap.get(entry.getKey());
      relPosTimes.addAll(getTimesWithChannelGroup(possTimes, channelGroups));
    }
    return relPosTimes;
  }

  private static NavigableSet<Instant> getTimesWithChannelGroup(
      NavigableSet<Instant> possTimes, NavigableMap<Instant, ChannelGroup> channelGroups) {

    if (channelGroups == null || channelGroups.isEmpty()) {
      return new TreeSet<>();
    }

    return possTimes.stream()
        .map(
            (Instant time) -> {
              var chanGroupEntry = Optional.ofNullable(channelGroups.floorEntry(time));

              Optional<Instant> endTimeOptional =
                  chanGroupEntry.flatMap(entry -> entry.getValue().getEffectiveUntil());
              var endTime = endTimeOptional.orElseGet(() -> Instant.MIN);

              if (endTime.isAfter(time)) {
                return time;
              }

              return null;
            })
        .filter(Objects::nonNull)
        .collect(Collectors.toCollection(TreeSet::new));
  }
}
