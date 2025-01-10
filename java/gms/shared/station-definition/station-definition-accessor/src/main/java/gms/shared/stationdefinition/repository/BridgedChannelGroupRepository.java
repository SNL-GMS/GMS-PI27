package gms.shared.stationdefinition.repository;

import com.google.common.base.Functions;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.api.channel.ChannelGroupRepository;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.converter.util.StationDefinitionDataHolder;
import gms.shared.stationdefinition.converter.util.assemblers.AssemblerUtils;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelGroupAssembler;
import gms.shared.stationdefinition.dao.css.SiteAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import gms.shared.stationdefinition.dao.util.SiteAndSiteChanUtility;
import gms.shared.stationdefinition.dao.util.StartAndEndForSiteAndSiteChan;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.NavigableMap;
import java.util.Optional;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.stereotype.Component;

/**
 * A {@link ChannelGroupRepository} implementation that uses a bridged database to provide {@link
 * ChannelGroup} instances
 */
@Component("bridgedChannelGroupRepository")
public class BridgedChannelGroupRepository implements ChannelGroupRepository {

  private final SiteDatabaseConnector siteDatabaseConnector;
  private final SiteChanDatabaseConnector siteChanDatabaseConnector;
  private final ChannelGroupAssembler channelGroupAssembler;
  private final BridgedChannelUtil bridgedChannelUtil;

  public BridgedChannelGroupRepository(
      SiteDatabaseConnector siteDatabaseConnector,
      SiteChanDatabaseConnector siteChanDatabaseConnector,
      ChannelGroupAssembler channelGroupAssembler,
      BridgedChannelUtil bridgedChannelUtil) {
    this.siteDatabaseConnector = siteDatabaseConnector;
    this.siteChanDatabaseConnector = siteChanDatabaseConnector;
    this.channelGroupAssembler = channelGroupAssembler;
    this.bridgedChannelUtil = bridgedChannelUtil;
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByNameAndTime(
      List<String> channelGroupNames, Instant effectiveAt) {

    var startAndEnd = new StartAndEndForSiteAndSiteChan();
    // find site daos using surrounding dates
    List<SiteAndSurroundingDates> sitesAndSurroundingDates =
        siteDatabaseConnector.findSitesAndSurroundingDatesByStaCodeAndTime(
            channelGroupNames, effectiveAt);

    List<SiteDao> siteDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteDaos(
            startAndEnd, sitesAndSurroundingDates);

    Pair<Instant, Instant> minMaxPair =
        BridgedRepositoryUtils.getMinMaxFromSiteDaos(siteDaos, effectiveAt, effectiveAt);

    siteDaos =
        siteDaos.stream()
            .filter(
                siteDao ->
                    !(siteDao
                            .getId()
                            .getStationCode()
                            .equalsIgnoreCase(siteDao.getReferenceStation())
                        && siteDao.getStaType() == StaType.ARRAY_STATION))
            .toList();

    List<String> stationCodes =
        siteDaos.stream().map(SiteDao::getId).map(SiteKey::getStationCode).toList();

    // find site chan daos using surrounding dates
    List<SiteChanAndSurroundingDates> siteChanAndSurroundingDates =
        siteChanDatabaseConnector.findSiteChansAndSurroundingDatesByStationCodeAndTimeRange(
            stationCodes, minMaxPair.getLeft(), minMaxPair.getRight());

    var siteChanDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteChanDaos(
            startAndEnd, siteChanAndSurroundingDates);

    List<String> channelNames =
        siteChanDaos.stream()
            .map(
                siteChan ->
                    siteChan.getId().getStationCode()
                        + "."
                        + siteChan.getId().getStationCode()
                        + "."
                        + siteChan.getId().getChannelCode())
            .distinct()
            .toList();

    if (channelNames.isEmpty()) {
      return new ArrayList<>();
    }

    var stationDefinitiondataHolder =
        new StationDefinitionDataHolder(siteDaos, siteChanDaos, null, null, null, startAndEnd);

    List<Channel> channels =
        bridgedChannelUtil.findChannelsGivenSiteAndSiteChan(
            stationDefinitiondataHolder, minMaxPair.getLeft(), minMaxPair.getRight());

    Table<String, String, NavigableMap<Instant, Channel>> channelsByStaChan =
        AssemblerUtils.buildVersionTable(
            Functions.compose(StationDefinitionIdUtility::getCssKeyFromName, Channel::getName)
                .andThen(SiteChanKey::getStationCode),
            Functions.compose(StationDefinitionIdUtility::getCssKeyFromName, Channel::getName)
                .andThen(SiteChanKey::getChannelCode),
            Functions.compose(Optional::get, Channel::getEffectiveAt),
            channels);

    return channelGroupAssembler.buildAllForTime(
        siteDaos, siteChanDaos, effectiveAt, channelsByStaChan, startAndEnd);
  }

  public List<ChannelGroup> findChannelGroupsGivenChannelsSitesAndSiteChans(
      StationDefinitionDataHolder stationDefinitionDataHolder,
      Instant effectiveAt,
      List<Channel> channels) {

    var siteDaosForChannelGroup =
        stationDefinitionDataHolder.getSiteDaos().stream()
            .filter(
                siteDao ->
                    !(siteDao
                            .getId()
                            .getStationCode()
                            .equalsIgnoreCase(siteDao.getReferenceStation())
                        && siteDao.getStaType() == StaType.ARRAY_STATION))
            .toList();

    Table<String, String, NavigableMap<Instant, Channel>> channelsByStaChan =
        AssemblerUtils.buildVersionTable(
            Functions.compose(StationDefinitionIdUtility::getCssKeyFromName, Channel::getName)
                .andThen(SiteChanKey::getStationCode),
            Functions.compose(StationDefinitionIdUtility::getCssKeyFromName, Channel::getName)
                .andThen(SiteChanKey::getChannelCode),
            Functions.compose(Optional::get, Channel::getEffectiveAt),
            channels);

    return channelGroupAssembler.buildAllForTime(
        siteDaosForChannelGroup,
        stationDefinitionDataHolder.getSiteChanDaos(),
        effectiveAt,
        channelsByStaChan,
        stationDefinitionDataHolder.getStartEndBoolean());
  }

  @Override
  public List<ChannelGroup> findChannelGroupsByNameAndTimeRange(
      List<String> channelGroupNames, Instant startTime, Instant endTime) {

    var startAndEnd = new StartAndEndForSiteAndSiteChan();
    // find site daos using surrounding dates
    var sitesAndSurroundingDates =
        siteDatabaseConnector.findSitesAndSurroundingDatesByStaCodeAndTimeRange(
            channelGroupNames, startTime, endTime);

    var siteDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteDaos(
                startAndEnd, sitesAndSurroundingDates)
            .stream()
            .filter(
                siteDao ->
                    !(siteDao
                            .getId()
                            .getStationCode()
                            .equalsIgnoreCase(siteDao.getReferenceStation())
                        && siteDao.getStaType() == StaType.ARRAY_STATION))
            .toList();

    Pair<Instant, Instant> minMaxPair =
        BridgedRepositoryUtils.getMinMaxFromSiteDaos(siteDaos, startTime, endTime);

    List<String> stationCodes =
        siteDaos.stream().map(SiteDao::getId).map(SiteKey::getStationCode).distinct().toList();

    var siteChanAndSurroundingDates =
        siteChanDatabaseConnector.findSiteChansAndSurroundingDatesByStationCodeAndTimeRange(
            stationCodes, minMaxPair.getLeft(), minMaxPair.getRight());
    var siteChans =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteChanDaos(
            startAndEnd, siteChanAndSurroundingDates);

    List<String> channelNames =
        siteChans.stream()
            .map(
                siteChan ->
                    siteChan.getId().getStationCode()
                        + "."
                        + siteChan.getId().getStationCode()
                        + "."
                        + siteChan.getId().getChannelCode())
            .toList();
    if (channelNames.isEmpty()) {
      return new ArrayList<>();
    }

    var stationDefinitiondataHolder =
        new StationDefinitionDataHolder(siteDaos, siteChans, null, null, null, startAndEnd);

    List<Channel> channels =
        bridgedChannelUtil.findChannelsGivenSiteAndSiteChan(
            stationDefinitiondataHolder, minMaxPair.getLeft(), minMaxPair.getRight());
    Table<String, String, NavigableMap<Instant, Channel>> channelsByStaChan =
        AssemblerUtils.buildVersionTable(
            Functions.compose(StationDefinitionIdUtility::getCssKeyFromName, Channel::getName)
                .andThen(SiteChanKey::getStationCode),
            Functions.compose(StationDefinitionIdUtility::getCssKeyFromName, Channel::getName)
                .andThen(SiteChanKey::getChannelCode),
            Functions.compose(Optional::get, Channel::getEffectiveAt),
            channels);
    return channelGroupAssembler.buildAllForTimeRange(
        siteDaos, siteChans, startTime, endTime, channelsByStaChan, startAndEnd);
  }

  public List<ChannelGroup> findChannelGroupsGivenChannelsSitesAndSiteChansAndTimeRange(
      StationDefinitionDataHolder stationDefinitionDataHolder,
      List<Channel> channels,
      Instant startTime,
      Instant endTime) {

    var siteDaosForChannelGroup =
        stationDefinitionDataHolder.getSiteDaos().stream()
            .filter(
                siteDao ->
                    !(siteDao
                            .getId()
                            .getStationCode()
                            .equalsIgnoreCase(siteDao.getReferenceStation())
                        && siteDao.getStaType() == StaType.ARRAY_STATION))
            .toList();

    Table<String, String, NavigableMap<Instant, Channel>> channelsByStaChan =
        AssemblerUtils.buildVersionTable(
            Functions.compose(StationDefinitionIdUtility::getCssKeyFromName, Channel::getName)
                .andThen(SiteChanKey::getStationCode),
            Functions.compose(StationDefinitionIdUtility::getCssKeyFromName, Channel::getName)
                .andThen(SiteChanKey::getChannelCode),
            Functions.compose(Optional::get, Channel::getEffectiveAt),
            channels);

    return channelGroupAssembler.buildAllForTimeRange(
        siteDaosForChannelGroup,
        stationDefinitionDataHolder.getSiteChanDaos(),
        startTime,
        endTime,
        channelsByStaChan,
        stationDefinitionDataHolder.getStartEndBoolean());
  }
}
