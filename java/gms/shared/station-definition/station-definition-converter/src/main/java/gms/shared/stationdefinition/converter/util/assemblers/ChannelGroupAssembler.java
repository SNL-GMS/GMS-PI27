package gms.shared.stationdefinition.converter.util.assemblers;

import static gms.shared.stationdefinition.converter.ConverterWarnings.CHANNELS_BY_STATION_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.EFFECTIVE_TIME_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.END_TIME_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITES_MUST_NOT_BE_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITE_CHANS_MUST_NOT_BE_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.START_END_BOOLEANS_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.START_END_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.START_TIME_NOT_NULL;
import static java.util.stream.Collectors.groupingBy;

import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import com.google.common.collect.Table;
import com.google.common.math.DoubleMath;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.utils.comparator.ChannelGroupComparator;
import gms.shared.stationdefinition.converter.interfaces.ChannelGroupConverter;
import gms.shared.stationdefinition.converter.util.TemporalMap;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.util.StartAndEndForSiteAndSiteChan;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.NavigableSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.BiPredicate;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ChannelGroupAssembler {
  public static final double FLOAT24_EPSILON = 1e-7;
  private static final Logger LOGGER = LoggerFactory.getLogger(ChannelGroupAssembler.class);

  private final ChannelGroupConverter channelGroupConverter;

  public ChannelGroupAssembler(ChannelGroupConverter channelGroupConverter) {
    this.channelGroupConverter = channelGroupConverter;
  }

  // logic of what changes in site cause a change in station
  BiPredicate<SiteDao, SiteDao> changeOccuredForSite =
      (SiteDao prev, SiteDao curr) -> {
        if (prev == null) {
          return curr != null;
        }

        return !prev.equals(curr);
      };

  // logic of what changes in site chan cause a change in station
  BiPredicate<SiteChanDao, SiteChanDao> changeOccuredForSiteChan =
      (SiteChanDao prev, SiteChanDao curr) -> {
        if (Objects.isNull(prev) || Objects.isNull(curr)) {
          return true;
        }

        return !prev.getId().getStationCode().equals(curr.getId().getStationCode())
            || !prev.getId().getChannelCode().equals(curr.getId().getChannelCode())
            || !DoubleMath.fuzzyEquals(
                prev.getEmplacementDepth(), curr.getEmplacementDepth(), FLOAT24_EPSILON);
      };

  public List<ChannelGroup> buildAllForTime(
      List<SiteDao> sites,
      List<SiteChanDao> siteChans,
      Instant effectiveAt,
      Table<String, String, NavigableMap<Instant, Channel>> channelsByStaChan,
      StartAndEndForSiteAndSiteChan startEndBooleans) {
    Preconditions.checkNotNull(effectiveAt, EFFECTIVE_TIME_NOT_NULL);
    Preconditions.checkNotNull(
        sites, SITES_MUST_NOT_BE_NULL + EFFECTIVE_TIME_NOT_NULL, effectiveAt);
    Preconditions.checkNotNull(
        siteChans, SITE_CHANS_MUST_NOT_BE_NULL + EFFECTIVE_TIME_NOT_NULL, effectiveAt);
    Preconditions.checkNotNull(
        channelsByStaChan, CHANNELS_BY_STATION_NOT_NULL + EFFECTIVE_TIME_NOT_NULL, effectiveAt);
    Preconditions.checkNotNull(
        startEndBooleans, START_END_BOOLEANS_NOT_NULL + EFFECTIVE_TIME_NOT_NULL, effectiveAt);

    // we use buildAllForTimeRange since we need to determine the prev/next versions to determine
    // start/end Time for the
    // version we're interested in
    List<ChannelGroup> resultList =
        createChannelGroupTablesAndMaps(
            sites,
            siteChans,
            Pair.of(effectiveAt, effectiveAt),
            channelsByStaChan,
            Channel::createVersionReference,
            startEndBooleans);

    Map<String, List<ChannelGroup>> channelGroupMap =
        resultList.stream().collect(groupingBy(ChannelGroup::getName));

    // we need to remove the prev/next versions since they were only used to set the start/end time
    // we also return the version that is effectiveAt the request time or the one previous to it if
    // none exist
    return channelGroupMap.values().stream()
        .map(
            list ->
                list.stream()
                    .filter(
                        channelGroup -> !channelGroup.getEffectiveAt().get().isAfter(effectiveAt))
                    .sorted(new ChannelGroupComparator())
                    .sorted(Comparator.reverseOrder())
                    .findFirst())
        .flatMap(Optional::stream)
        .sorted(new ChannelGroupComparator())
        .toList();
  }

  public List<ChannelGroup> buildAllForTimeRange(
      List<SiteDao> sites,
      List<SiteChanDao> siteChans,
      Instant startTime,
      Instant endTime,
      Table<String, String, NavigableMap<Instant, Channel>> channelsByStaChan,
      StartAndEndForSiteAndSiteChan startEndBooleans) {
    Preconditions.checkNotNull(startTime, START_TIME_NOT_NULL);
    Preconditions.checkNotNull(endTime, END_TIME_NOT_NULL);
    Preconditions.checkNotNull(
        sites, SITES_MUST_NOT_BE_NULL + START_END_TIME_STR, startTime, endTime);
    Preconditions.checkNotNull(
        siteChans, SITE_CHANS_MUST_NOT_BE_NULL + START_END_TIME_STR, startTime, endTime);
    Preconditions.checkNotNull(
        channelsByStaChan, CHANNELS_BY_STATION_NOT_NULL + START_END_TIME_STR, startTime, endTime);
    Preconditions.checkNotNull(
        startEndBooleans, START_END_BOOLEANS_NOT_NULL + START_END_TIME_STR, startTime, endTime);

    List<ChannelGroup> resultList =
        createChannelGroupTablesAndMaps(
            sites,
            siteChans,
            Pair.of(startTime, endTime),
            channelsByStaChan,
            Channel::createEntityReference,
            startEndBooleans);

    return resultList.stream()
        .filter(
            channelGroup ->
                !channelGroup.getEffectiveUntil().isPresent()
                    || !channelGroup.getEffectiveUntil().get().isBefore(startTime))
        .filter(
            channelGroup ->
                !channelGroup
                    .getEffectiveAt()
                    .get()
                    .isAfter(AssemblerUtils.effectiveAtNoonOffset.apply(endTime)))
        .sorted(new ChannelGroupComparator())
        .toList();
  }

  private List<ChannelGroup> createChannelGroupTablesAndMaps(
      List<SiteDao> sites,
      List<SiteChanDao> siteChans,
      Pair<Instant, Instant> startEndTime,
      Table<String, String, NavigableMap<Instant, Channel>> channelsByStaChan,
      UnaryOperator<Channel> channelConverter,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    Set<String> stationCodes =
        sites.stream().map(siteDao -> siteDao.getId().getStationCode()).collect(Collectors.toSet());

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

    return stationCodes.stream()
        .flatMap(
            stationCode ->
                processChannelGroups(
                    startEndTime,
                    sitesByStationCode.getVersionMap(stationCode),
                    siteChansByStationAndChannel.row(stationCode),
                    channelsByStaChan.row(stationCode),
                    channelConverter,
                    startEndBooleans)
                    .stream())
        .filter(Objects::nonNull)
        .sorted()
        .toList();
  }

  private List<ChannelGroup> processChannelGroups(
      Pair<Instant, Instant> startEndTime,
      NavigableMap<Instant, SiteDao> siteNavMap,
      Map<String, NavigableMap<Instant, SiteChanDao>> siteChanNavMap,
      Map<String, NavigableMap<Instant, Channel>> chanCodeChannelNavMap,
      UnaryOperator<Channel> channelFunc,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    // determine if range or single point in time
    boolean isRange = startEndTime.getLeft().isBefore(startEndTime.getRight());

    // check for attribute changes
    NavigableSet<Instant> possibleVersionTimes =
        getChangeTimes(siteNavMap, siteChanNavMap, chanCodeChannelNavMap, startEndBooleans);

    var validTimes = AssemblerUtils.getValidTimes(startEndTime, possibleVersionTimes, isRange);
    return processPossibleVersionTimes(
        startEndTime, validTimes, siteNavMap, siteChanNavMap, chanCodeChannelNavMap, channelFunc);
  }

  private List<ChannelGroup> processPossibleVersionTimes(
      Pair<Instant, Instant> startEndTime,
      List<Instant> possibleVersionTimes,
      NavigableMap<Instant, SiteDao> sitesForVersion,
      Map<String, NavigableMap<Instant, SiteChanDao>> siteChansForVersion,
      Map<String, NavigableMap<Instant, Channel>> chanCodeChannelNavMap,
      UnaryOperator<Channel> channelFunc) {

    Instant chanTime;

    List<ChannelGroup> versionedChannelGroups = new ArrayList<>();
    for (var i = 0; i < possibleVersionTimes.size() - 1; i++) {
      Range<Instant> versionRange =
          Range.open(possibleVersionTimes.get(i), possibleVersionTimes.get(i + 1));

      // the endtime of the channel group will be up until the new time (this prevents overlapping)
      var endtime = AssemblerUtils.getImmediatelyBeforeInstant(versionRange.upperEndpoint());

      List<Channel> activeChannels;

      if (startEndTime.getLeft().equals(startEndTime.getRight())
          && versionRange.contains(startEndTime.getLeft())) {
        chanTime = startEndTime.getLeft();

        activeChannels =
            AssemblerUtils.getObjectsForVersionTimeEnd(
                chanTime,
                chanCodeChannelNavMap,
                chan -> chan.getEffectiveUntil().orElse(Instant.MAX));

      } else {
        chanTime = versionRange.lowerEndpoint();
        activeChannels =
            AssemblerUtils.getObjectsForVersionTime(
                chanTime,
                chanCodeChannelNavMap,
                chan -> chan.getEffectiveUntil().orElse(Instant.MAX));
      }

      Optional<SiteDao> possibleSite =
          AssemblerUtils.getObjectsForVersionTime(
              versionRange.lowerEndpoint(), sitesForVersion, SiteDao::getOffDate);
      List<SiteChanDao> versionSiteChanDaos =
          AssemblerUtils.getObjectsForVersionTime(
              versionRange.lowerEndpoint(), siteChansForVersion, SiteChanDao::getOffDate);

      if (activeChannels.isEmpty() || possibleSite.isEmpty()) {
        LOGGER.debug("No Active Channels or Site for time range: {}", versionRange);
        continue;
      }

      var curChannelGroup =
          convertChannelGroup(
              Range.open(versionRange.lowerEndpoint(), endtime),
              possibleSite,
              versionSiteChanDaos,
              activeChannels,
              channelFunc);

      if (curChannelGroup.isPresent()) {
        versionedChannelGroups.add(curChannelGroup.orElseThrow());
      }
    }
    return versionedChannelGroups;
  }

  private Optional<ChannelGroup> convertChannelGroup(
      Range<Instant> versionRange,
      Optional<SiteDao> site,
      List<SiteChanDao> versionSiteChanDaos,
      List<Channel> activeChannels,
      UnaryOperator<Channel> channelConverter) {
    Optional<ChannelGroup> curChannelGroup = Optional.empty();
    try {
      curChannelGroup =
          Optional.ofNullable(
              channelGroupConverter.convert(
                  site.orElse(null),
                  versionSiteChanDaos,
                  channelConverter,
                  versionRange.lowerEndpoint(),
                  versionRange.upperEndpoint(),
                  activeChannels));
    } catch (Exception ex) {
      var errMsg =
          String.format(
              "Could not convert channel group with time range %s - %s",
              versionRange.lowerEndpoint(), versionRange.upperEndpoint());
      errMsg =
          site.isPresent()
              ? errMsg.concat(String.format(" for station %s", site.get().getStationName()))
              : errMsg;

      LOGGER.debug(errMsg, ex);
    }
    return curChannelGroup;
  }

  private NavigableSet<Instant> getChangeTimes(
      NavigableMap<Instant, SiteDao> sitesForVersion,
      Map<String, NavigableMap<Instant, SiteChanDao>> siteChansForVersion,
      Map<String, NavigableMap<Instant, Channel>> chanCodeChannelNavMap,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    // first get times based on channel group and channel
    NavigableSet<Instant> changeTimes =
        AssemblerUtils.getTimesForObjectChanges(chanCodeChannelNavMap);

    AssemblerUtils.addChangeTimesToListForDaosWithDayAccuracy(
        changeTimes,
        siteChansForVersion,
        changeOccuredForSiteChan,
        Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId),
        SiteChanDao::getOffDate,
        startEndBooleans::isPrevTimeOverLapForSiteChan,
        startEndBooleans::isNextTimeOverLapForSiteChan);
    AssemblerUtils.addChangeTimesToListForDaosWithDayAccuracy(
        changeTimes,
        sitesForVersion,
        changeOccuredForSite,
        Functions.compose(SiteKey::getOnDate, SiteDao::getId),
        SiteDao::getOffDate,
        startEndBooleans::isPrevTimeOverLapForSite,
        startEndBooleans::isNextTimeOverLapForSite);

    return changeTimes;
  }
}
