package gms.shared.stationdefinition.repository;

import com.google.common.base.Functions;
import gms.shared.stationdefinition.api.station.StationRepository;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.converter.util.StationDefinitionDataHolder;
import gms.shared.stationdefinition.converter.util.assemblers.StationAssembler;
import gms.shared.stationdefinition.dao.css.SiteAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.util.SiteAndSiteChanUtility;
import gms.shared.stationdefinition.dao.util.StartAndEndForSiteAndSiteChan;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.stereotype.Component;

/**
 * A {@link StationRepository} implementation that uses a bridged database to provide * {@link
 * Station} instances
 */
@Component("bridgedStationRepository")
public class BridgedStationRepository implements StationRepository {

  private final BridgedChannelUtil channelUtil;
  private final BridgedChannelGroupRepository channelGroupRepository;
  private final SiteDatabaseConnector siteDatabaseConnector;
  private final SiteChanDatabaseConnector siteChanDatabaseConnector;
  private final StationAssembler stationAssembler;

  public BridgedStationRepository(
      BridgedChannelGroupRepository channelGroupRepository,
      SiteDatabaseConnector siteDatabaseConnector,
      SiteChanDatabaseConnector siteChanDatabaseConnector,
      StationAssembler stationAssembler,
      BridgedChannelUtil bridgedChannelUtil) {
    this.channelUtil = bridgedChannelUtil;
    this.channelGroupRepository = channelGroupRepository;
    this.siteDatabaseConnector = siteDatabaseConnector;
    this.siteChanDatabaseConnector = siteChanDatabaseConnector;
    this.stationAssembler = stationAssembler;
  }

  @Override
  public List<Station> findStationsByNameAndTime(List<String> stationNames, Instant effectiveAt) {
    // find site daos using surrounding dates
    List<SiteAndSurroundingDates> sitesAndSurroundingDates =
        siteDatabaseConnector.findSitesAndSurroundingDatesByRefStaAndTime(
            stationNames, effectiveAt);

    var startEndBooleans = new StartAndEndForSiteAndSiteChan();

    List<SiteDao> siteDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteDaos(
            startEndBooleans, sitesAndSurroundingDates);

    Pair<Instant, Instant> minMaxPair =
        BridgedRepositoryUtils.getMinMaxFromSiteDaos(siteDaos, effectiveAt, effectiveAt);

    List<String> stationCodes =
        siteDaos.stream().map(SiteDao::getId).map(SiteKey::getStationCode).toList();

    // find site chan daos using surrounding dates
    List<SiteChanAndSurroundingDates> siteChanAndSurroundingDates =
        siteChanDatabaseConnector.findSiteChansAndSurroundingDatesByStationCodeAndTimeRange(
            stationCodes, minMaxPair.getLeft(), minMaxPair.getRight());

    List<SiteChanDao> siteChanDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteChanDaos(
            startEndBooleans, siteChanAndSurroundingDates);

    if (siteDaos.isEmpty() || siteChanDaos.isEmpty()) {
      return List.of();
    }

    var stationDefinitionDataHolder =
        new StationDefinitionDataHolder(siteDaos, siteChanDaos, null, null, null, startEndBooleans);

    List<Channel> channels =
        channelUtil
            .findChannelsGivenSiteAndSiteChan(
                stationDefinitionDataHolder, minMaxPair.getLeft(), minMaxPair.getRight())
            .stream()
            .toList();

    List<ChannelGroup> channelGroups =
        channelGroupRepository.findChannelGroupsGivenChannelsSitesAndSiteChansAndTimeRange(
            stationDefinitionDataHolder, channels, minMaxPair.getLeft(), minMaxPair.getRight());

    if (channels.isEmpty() || channelGroups.isEmpty()) {
      return List.of();
    }

    Map<String, SiteChanKey> channelNameSiteChanKeyMap =
        channels.stream()
            .collect(
                Collectors.toMap(
                    Channel::getName,
                    Functions.compose(
                        StationDefinitionIdUtility::getCssKeyFromName, Channel::getName),
                    (k1, k2) -> k1));

    return stationAssembler.buildAllForTime(
        siteDaos,
        siteChanDaos,
        channelGroups,
        channels,
        effectiveAt,
        channelNameSiteChanKeyMap,
        startEndBooleans);
  }

  @Override
  public List<Station> findStationsByNameAndTimeRange(
      List<String> stationNames, Instant startTime, Instant endTime) {

    var sitesAndSurroundingDates =
        siteDatabaseConnector.findSitesAndSurroundingDatesByRefStaAndTimeRange(
            stationNames, startTime, endTime);

    var startEndBooleans = new StartAndEndForSiteAndSiteChan();

    var siteDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteDaos(
            startEndBooleans, sitesAndSurroundingDates);

    Pair<Instant, Instant> minMaxPair =
        BridgedRepositoryUtils.getMinMaxFromSiteDaos(siteDaos, startTime, endTime);

    List<String> stationCodes =
        siteDaos.stream().map(SiteDao::getId).map(SiteKey::getStationCode).toList();

    var siteChanAndSurroundingDates =
        siteChanDatabaseConnector.findSiteChansAndSurroundingDatesByStationCodeAndTimeRange(
            stationCodes, minMaxPair.getLeft(), minMaxPair.getRight());

    var siteChanDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteChanDaos(
            startEndBooleans, siteChanAndSurroundingDates);

    if (siteDaos.isEmpty() || siteChanDaos.isEmpty()) {
      return List.of();
    }

    var stationDefinitionDataHolder =
        new StationDefinitionDataHolder(siteDaos, siteChanDaos, null, null, null, startEndBooleans);

    List<Channel> channels =
        channelUtil.findChannelsGivenSiteAndSiteChan(
            stationDefinitionDataHolder, minMaxPair.getLeft(), minMaxPair.getRight());

    List<ChannelGroup> channelGroups =
        channelGroupRepository.findChannelGroupsGivenChannelsSitesAndSiteChansAndTimeRange(
            stationDefinitionDataHolder, channels, minMaxPair.getLeft(), minMaxPair.getRight());

    if (channels.isEmpty() || channelGroups.isEmpty()) {
      return List.of();
    }

    Map<String, SiteChanKey> channelNameSiteChanKeyMap =
        channels.stream()
            .collect(
                Collectors.toMap(
                    Channel::getName,
                    Functions.compose(
                        StationDefinitionIdUtility::getCssKeyFromName, Channel::getName),
                    (k1, k2) -> k1));

    return stationAssembler.buildAllForTimeRange(
        siteDaos,
        siteChanDaos,
        channelGroups,
        channels,
        startTime,
        endTime,
        channelNameSiteChanKeyMap,
        startEndBooleans);
  }
}
