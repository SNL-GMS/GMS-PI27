package gms.shared.stationdefinition.repository;

import com.google.common.base.Functions;
import gms.shared.stationdefinition.converter.util.StationDefinitionDataHolder;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SensorKey;
import gms.shared.stationdefinition.dao.css.SiteAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.util.SiteAndSiteChanUtility;
import gms.shared.stationdefinition.dao.util.StartAndEndForSiteAndSiteChan;
import gms.shared.stationdefinition.database.connector.InstrumentDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.repository.util.CssCoiConverterUtility;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;

public final class BridgedRepositoryUtils {

  private BridgedRepositoryUtils() {
    // Hide implicit public constructor
  }

  static final long SECONDS_IN_DAY = 86400;

  /**
   * this will get the min/max times for the siteDao list, then add 1 sec to either end which allows
   * us to get the next version the next version is needed to determine the start/end time
   * (11:59:59, 23:59:59, 12:00:00) in the assembler
   *
   * @param daos sites covered by the start/endTime
   * @param startTime
   * @param endTime
   * @return
   */
  public static Pair<Instant, Instant> getMinMaxFromSiteDaos(
      List<SiteDao> daos, Instant startTime, Instant endTime) {

    return getMinMaxFromDaos(
        daos,
        startTime,
        endTime,
        Functions.compose(SiteKey::getOnDate, SiteDao::getId),
        SiteDao::getOffDate,
        1);
  }

  public static Pair<Instant, Instant> getMinMaxFromSiteChanDaos(
      List<SiteChanDao> daos, Instant startTime, Instant endTime) {

    return getMinMaxFromDaos(
        daos,
        startTime,
        endTime,
        Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId),
        SiteChanDao::getOffDate,
        1);
  }

  public static Pair<Instant, Instant> getMinMaxFromSiteChanDaosDays(
      List<SiteChanDao> daos, Instant startTime, Instant endTime) {

    return getMinMaxFromDaos(
        daos,
        startTime,
        endTime,
        Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId),
        SiteChanDao::getOffDate,
        SECONDS_IN_DAY);
  }

  public static <T> Pair<Instant, Instant> getMinMaxFromDaos(
      List<T> daos,
      Instant startTime,
      Instant endTime,
      Function<T, Instant> startTimeExtractor,
      Function<T, Instant> endTimeExtractor,
      long seconds) {

    // need min/max for siteDaos so that we can load all siteChans for that range in case there are
    // siteChans that need to be merged
    // may need to revisit and do this on a per station basis and update the query to get min/max
    // for each station
    Optional<T> minDao = daos.stream().min(Comparator.comparing(startTimeExtractor::apply));
    Optional<T> maxDao = daos.stream().max(Comparator.comparing(endTimeExtractor::apply));

    // we need to load siteChans on either side of the versions we're interested in
    var minStartTime = minDao.isPresent() ? startTimeExtractor.apply(minDao.get()) : startTime;
    minStartTime = minStartTime == Instant.MIN ? minStartTime : minStartTime.minusSeconds(seconds);

    var maxEndTime = maxDao.isPresent() ? endTimeExtractor.apply(maxDao.get()) : endTime;
    maxEndTime = maxEndTime == Instant.MAX ? Instant.now() : maxEndTime.plusSeconds(seconds);

    return Pair.of(minStartTime, maxEndTime);
  }

  public static List<InstrumentDao> getInstrumentData(
      StationDefinitionDataHolder stationDefinitionDataHolder,
      InstrumentDatabaseConnector instrumentDatabaseConnector) {

    var sensorDaos = stationDefinitionDataHolder.getSensorDaos();

    var instrumentIds =
        sensorDaos.stream()
            .map(SensorDao::getInstrument)
            .map(InstrumentDao::getInstrumentId)
            .toList();

    return instrumentDatabaseConnector.findInstruments(instrumentIds);
  }

  public static StationDefinitionDataHolder findDataByTimeForChannel(
      List<SiteChanKey> siteChanKeys,
      Instant effectiveTime,
      SiteDatabaseConnector siteDatabaseConnector,
      SiteChanDatabaseConnector siteChanDatabaseConnector,
      SensorDatabaseConnector sensorDatabaseConnector,
      WfdiscDatabaseConnector wfdiscDatabaseConnector) {

    Set<String> stationNames = CssCoiConverterUtility.getStationCodesFromSiteChanKeys(siteChanKeys);
    var map = new StartAndEndForSiteAndSiteChan();

    // find site chan daos using surrounding dates
    var siteChanAndSurroundingDates =
        siteChanDatabaseConnector.findSiteChansAndSurroundingDatesByKeysAndTime(
            siteChanKeys, effectiveTime);
    var siteChanDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteChanDaos(
            map, siteChanAndSurroundingDates);

    var minMaxTimes = getMinMaxFromSiteChanDaos(siteChanDaos, effectiveTime, effectiveTime);

    // find site daos using surrounding dates
    List<SiteAndSurroundingDates> sitesAndSurroundingDates =
        siteDatabaseConnector.findSitesAndSurroundingDatesByStaCodeAndTimeRange(
            stationNames, minMaxTimes.getLeft(), minMaxTimes.getRight());
    List<SiteDao> siteDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteDaos(map, sitesAndSurroundingDates);

    return getSensorAndWfdiscData(
        new StationDefinitionDataHolder(siteDaos, siteChanDaos, null, null, null, map),
        sensorDatabaseConnector,
        wfdiscDatabaseConnector);
  }

  /**
   * Get daos using connector queries with specified start and end times
   *
   * @param siteChanKeys
   * @param startTime
   * @param endTime
   * @param siteDatabaseConnector
   * @param siteChanDatabaseConnector
   * @param sensorDatabaseConnector
   * @param wfdiscDatabaseConnector
   * @return
   */
  public static StationDefinitionDataHolder findDataByTimeRangeForChannel(
      List<SiteChanKey> siteChanKeys,
      Instant startTime,
      Instant endTime,
      SiteDatabaseConnector siteDatabaseConnector,
      SiteChanDatabaseConnector siteChanDatabaseConnector,
      SensorDatabaseConnector sensorDatabaseConnector,
      WfdiscDatabaseConnector wfdiscDatabaseConnector) {

    Set<String> stationCodes = CssCoiConverterUtility.getStationCodesFromSiteChanKeys(siteChanKeys);
    var map = new StartAndEndForSiteAndSiteChan();

    var siteChanAndSurroundingDates =
        siteChanDatabaseConnector.findSiteChansAndSurroundingDatesByKeysAndTimeRange(
            siteChanKeys, startTime, endTime);
    var siteChanDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteChanDaos(
            map, siteChanAndSurroundingDates);

    var minMaxTimes = getMinMaxFromSiteChanDaos(siteChanDaos, startTime, endTime);

    // find site daos using surrounding dates
    var sitesAndSurroundingDates =
        siteDatabaseConnector.findSitesAndSurroundingDatesByStaCodeAndTimeRange(
            stationCodes, minMaxTimes.getLeft(), minMaxTimes.getRight());
    var siteDaos =
        SiteAndSiteChanUtility.updateStartEndAndReturnSiteDaos(map, sitesAndSurroundingDates);

    return getSensorAndWfdiscData(
        new StationDefinitionDataHolder(siteDaos, siteChanDaos, null, null, null, map),
        sensorDatabaseConnector,
        wfdiscDatabaseConnector);
  }

  public static StationDefinitionDataHolder getSensorAndWfdiscData(
      StationDefinitionDataHolder stationDefinitionDataHolder,
      SensorDatabaseConnector sensorDatabaseConnector,
      WfdiscDatabaseConnector wfdiscDatabaseConnector) {

    var siteDaos = stationDefinitionDataHolder.getSiteDaos();
    var siteChanDaos = stationDefinitionDataHolder.getSiteChanDaos();

    var minMaxTimes = getMinMaxFromSiteChanDaosDays(siteChanDaos, Instant.now(), Instant.now());

    List<SiteChanKey> siteChanKeys = siteChanDaos.stream().map(SiteChanDao::getId).toList();

    var queryStartTime = minMaxTimes.getLeft();
    var queryEndTime = minMaxTimes.getRight();

    // max causes an overthrow (it can be set from the siteChan)
    if (queryEndTime == Instant.MAX) {
      queryEndTime = Instant.now();
    }

    List<SensorDao> sensorDaos =
        sensorDatabaseConnector.findSensorsByKeyAndTimeRange(
            siteChanKeys, queryStartTime, queryEndTime);

    // we only care about wfdiscs once we have siteChans or a sensor, whichever is earliest
    // (sensorDaos could be empty)
    Instant wfdiscQueryMin =
        Stream.of(
                sensorDaos.stream()
                    .map(Functions.compose(SensorKey::getTime, SensorDao::getSensorKey))
                    .min(Instant::compareTo)
                    .orElse(Instant.MAX),
                siteChanDaos.stream()
                    .map(Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId))
                    .min(Instant::compareTo)
                    .orElse(Instant.MAX))
            .min(Instant::compareTo)
            .orElseThrow();

    List<WfdiscDao> wfdiscs =
        wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(
            siteChanKeys, wfdiscQueryMin, queryEndTime);
    var wfdiscVersions = WfdiscPreprocessingUtility.mergeWfdiscsAndUpdateTime(wfdiscs, sensorDaos);

    return new StationDefinitionDataHolder(
        siteDaos,
        siteChanDaos,
        sensorDaos,
        null,
        wfdiscVersions,
        stationDefinitionDataHolder.getStartEndBoolean());
  }
}
