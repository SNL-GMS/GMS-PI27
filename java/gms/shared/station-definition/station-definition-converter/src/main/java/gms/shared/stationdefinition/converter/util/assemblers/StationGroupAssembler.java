package gms.shared.stationdefinition.converter.util.assemblers;

import static gms.shared.stationdefinition.converter.ConverterWarnings.AFFILIATIONS_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.EFFECTIVE_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.NETWORKS_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.STATIONS_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.STATION_GROUPS_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.TIME_RANGE_STR;
import static java.util.stream.Collectors.groupingBy;

import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.coi.utils.comparator.StationGroupComparator;
import gms.shared.stationdefinition.converter.interfaces.StationGroupConverter;
import gms.shared.stationdefinition.converter.util.TemporalMap;
import gms.shared.stationdefinition.dao.css.AffiliationDao;
import gms.shared.stationdefinition.dao.css.NetworkDao;
import gms.shared.stationdefinition.dao.css.NetworkStationTimeKey;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.NavigableSet;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeSet;
import java.util.function.BiPredicate;
import java.util.function.UnaryOperator;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Assemble CSS DAOS into COI StationGroups */
@Component
public class StationGroupAssembler {

  private static final Logger LOGGER = LoggerFactory.getLogger(StationGroupAssembler.class);

  BiPredicate<NetworkDao, NetworkDao> changeOccuredForSite =
      (NetworkDao prev, NetworkDao curr) -> {
        if (Objects.isNull(prev) || Objects.isNull(curr)) {
          return true;
        }
        return !prev.getDescription().equals(curr.getDescription());
      };

  private final StationGroupConverter stationGroupConverter;

  public StationGroupAssembler(StationGroupConverter stationGroupConverter) {
    this.stationGroupConverter = stationGroupConverter;
  }

  public List<StationGroup> buildAllForTime(
      Instant effectiveAt,
      List<NetworkDao> networkDaos,
      List<AffiliationDao> affiliationDaos,
      List<AffiliationDao> nextAffiliationDaos,
      List<Station> stations) {

    Preconditions.checkNotNull(effectiveAt, STATION_GROUPS_NOT_NULL);
    Preconditions.checkNotNull(networkDaos, NETWORKS_NOT_NULL + EFFECTIVE_TIME_STR, effectiveAt);
    Preconditions.checkNotNull(
        affiliationDaos, AFFILIATIONS_NOT_NULL + EFFECTIVE_TIME_STR, effectiveAt);
    Preconditions.checkNotNull(stations, STATIONS_NOT_NULL + EFFECTIVE_TIME_STR, effectiveAt);

    UnaryOperator<Station> stationFacetOperator =
        station ->
            Station.createVersionReference(
                station.getName(), station.getEffectiveAt().orElseThrow());

    List<StationGroup> stationGroups =
        createStationGroupTablesAndMaps(
            Pair.of(effectiveAt, effectiveAt),
            networkDaos,
            affiliationDaos,
            nextAffiliationDaos,
            stations,
            stationFacetOperator);
    Map<String, List<StationGroup>> stationGroupMap =
        stationGroups.stream().collect(groupingBy(StationGroup::getName));

    // we need to remove the prev/next versions since they were only used to set the start/end time
    // we also return the version that is effectiveAt the request time or the one previous to it if
    // none exist
    return stationGroupMap.values().stream()
        .map(
            list ->
                list.stream()
                    .filter(station -> !station.getEffectiveAt().get().isAfter(effectiveAt))
                    .sorted(new StationGroupComparator())
                    .sorted(Comparator.reverseOrder())
                    .findFirst())
        .flatMap(Optional::stream)
        .sorted(new StationGroupComparator())
        .toList();
  }

  public List<StationGroup> buildAllForTimeRange(
      Range<Instant> timeRange,
      List<NetworkDao> networkDaos,
      List<AffiliationDao> affiliationDaos,
      List<AffiliationDao> nextAffiliationDaos,
      List<Station> stations) {

    Preconditions.checkNotNull(timeRange, "Station groups can't be built from null time range.");
    Preconditions.checkNotNull(networkDaos, NETWORKS_NOT_NULL + TIME_RANGE_STR, timeRange);
    Preconditions.checkNotNull(affiliationDaos, AFFILIATIONS_NOT_NULL + TIME_RANGE_STR, timeRange);
    Preconditions.checkNotNull(stations, STATIONS_NOT_NULL + TIME_RANGE_STR, timeRange);

    UnaryOperator<Station> stationFacetOperator = Station::toEntityReference;

    return createStationGroupTablesAndMaps(
            Pair.of(timeRange.lowerEndpoint(), timeRange.upperEndpoint()),
            networkDaos,
            affiliationDaos,
            nextAffiliationDaos,
            stations,
            stationFacetOperator)
        .stream()
        .filter(
            stationGroup ->
                !stationGroup.getEffectiveUntil().isPresent()
                    || !stationGroup.getEffectiveUntil().get().isBefore(timeRange.lowerEndpoint()))
        .filter(
            stationGroup ->
                !stationGroup.getEffectiveAt().orElseThrow().isAfter(timeRange.upperEndpoint()))
        .sorted(new StationGroupComparator())
        .toList();
  }

  private List<StationGroup> createStationGroupTablesAndMaps(
      Pair<Instant, Instant> startEndTime,
      List<NetworkDao> networkDaos,
      List<AffiliationDao> affiliationDaos,
      List<AffiliationDao> nextAffiliationDaos,
      List<Station> stations,
      UnaryOperator<Station> stationFacetOperator) {

    List<AffiliationDao> allAffiliationDaos = new ArrayList<>();
    allAffiliationDaos.addAll(affiliationDaos);
    allAffiliationDaos.addAll(nextAffiliationDaos);

    TemporalMap<String, NetworkDao> netToNetworkMap =
        networkDaos.stream()
            .collect(
                TemporalMap.collector(
                    NetworkDao::getNet, StationGroupAssembler::getNetworkDaoOnDate));

    Table<String, String, NavigableMap<Instant, AffiliationDao>> netToAffiliationMap =
        AssemblerUtils.buildVersionTable(
            Functions.compose(
                NetworkStationTimeKey::getNetwork, AffiliationDao::getNetworkStationTimeKey),
            Functions.compose(
                NetworkStationTimeKey::getStation, AffiliationDao::getNetworkStationTimeKey),
            Functions.compose(
                NetworkStationTimeKey::getTime, AffiliationDao::getNetworkStationTimeKey),
            allAffiliationDaos);

    TemporalMap<String, Station> stationTemporalMap =
        stations.stream()
            .collect(
                TemporalMap.collector(
                    Station::getName, Functions.compose(Optional::get, Station::getEffectiveAt)));

    return netToNetworkMap.keySet().stream()
        .flatMap(
            netString ->
                processStationGroups(
                    startEndTime,
                    netToNetworkMap.getVersionMap(netString),
                    netToAffiliationMap.row(netString),
                    stationTemporalMap,
                    stationFacetOperator)
                    .stream())
        .filter(Objects::nonNull)
        .sorted()
        .toList();
  }

  private List<StationGroup> processStationGroups(
      Pair<Instant, Instant> startEndTime,
      NavigableMap<Instant, NetworkDao> netToNetworkMap,
      Map<String, NavigableMap<Instant, AffiliationDao>> affiliationDaos,
      TemporalMap<String, Station> stationTemporalMap,
      UnaryOperator<Station> stationFacetOperator) {

    // determine if range or single point in time
    boolean isRange = startEndTime.getLeft().isBefore(startEndTime.getRight());
    Range<Instant> stationGroupRange =
        Range.closed(startEndTime.getLeft(), startEndTime.getRight());

    var netWorksInRange =
        AssemblerUtils.getDaosInRange(
            stationGroupRange,
            netToNetworkMap,
            StationGroupAssembler::getNetworkDaoOnDate,
            StationGroupAssembler::getNetworkDaoOffDate);

    var affiliationsInRange =
        AssemblerUtils.getDaosWithinRange(
            stationGroupRange,
            affiliationDaos,
            Functions.compose(
                NetworkStationTimeKey::getTime, AffiliationDao::getNetworkStationTimeKey),
            AffiliationDao::getEndTime);

    NavigableSet<Instant> possibleVersionTimes =
        getChangeTimes(netWorksInRange, affiliationsInRange);

    var validTimes = AssemblerUtils.getValidTimes(startEndTime, possibleVersionTimes, isRange);
    return processPossibleVersionTimes(
        validTimes, netWorksInRange, affiliationsInRange, stationTemporalMap, stationFacetOperator);
  }

  private List<StationGroup> processPossibleVersionTimes(
      List<Instant> possibleVersionTimes,
      NavigableMap<Instant, NetworkDao> networkDaos,
      Map<String, NavigableMap<Instant, AffiliationDao>> affiliationDaos,
      TemporalMap<String, Station> stationTemporalMap,
      UnaryOperator<Station> stationFacetOperator) {

    List<StationGroup> versionedStationGroups = new ArrayList<>();
    for (var i = 0; i < possibleVersionTimes.size() - 1; i++) {
      Range<Instant> versionRange =
          Range.open(possibleVersionTimes.get(i), possibleVersionTimes.get(i + 1));
      var currTime = versionRange.lowerEndpoint();

      Optional<NetworkDao> optNetworkDao =
          AssemblerUtils.getObjectsForVersionTime(
              currTime, networkDaos, StationGroupAssembler::getNetworkDaoOffDate);

      List<String> staCodes =
          affiliationDaos.entrySet().stream()
              .map(
                  (Map.Entry<String, NavigableMap<Instant, AffiliationDao>> entry) -> {
                    var currAffiliation = entry.getValue().floorEntry(currTime);

                    if (currAffiliation != null
                        && currAffiliation.getValue().getEndTime().isAfter(currTime)) {
                      return entry.getKey();
                    }
                    return null;
                  })
              .filter(Objects::nonNull)
              .toList();

      List<Station> stations =
          staCodes.stream()
              .map(sta -> getNearestInTimeStation(stationTemporalMap, currTime, sta))
              .flatMap(Optional::stream)
              .filter(station -> station.getEffectiveUntil().orElse(Instant.MAX).isAfter(currTime))
              .map(stationFacetOperator::apply)
              .toList();

      if (stations.isEmpty() || optNetworkDao.isEmpty()) {
        LOGGER.info("No Active Stations or Network Dao for time range: {}", versionRange);
        continue;
      }

      var endtime = AssemblerUtils.getImmediatelyBeforeInstant(versionRange.upperEndpoint());
      var endTimeOpt = Optional.of(endtime);
      if (endtime.equals(Instant.MAX)) {
        endTimeOpt = Optional.empty();
      }

      try {
        var stationGroup =
            stationGroupConverter.convert(currTime, endTimeOpt, optNetworkDao.get(), stations);
        versionedStationGroups.add(stationGroup);
      } catch (Exception ex) {
        LOGGER.warn(
            "Unable to build station group from stations, {}.  Message is {}",
            stations,
            ex.getMessage());
      }
    }

    return versionedStationGroups;
  }

  private static Optional<Station> getNearestInTimeStation(
      TemporalMap<String, Station> stationTemporalMap, Instant currTime, String sta) {

    Optional<Station> currStation = stationTemporalMap.getVersionFloor(sta, currTime);

    if (currStation.isEmpty()) {
      currStation = stationTemporalMap.getVersionCeiling(sta, currTime);
    }

    return currStation;
  }

  private NavigableSet<Instant> getChangeTimes(
      NavigableMap<Instant, NetworkDao> networkDaos,
      Map<String, NavigableMap<Instant, AffiliationDao>> affiliationDaos) {

    NavigableSet<Instant> changeTimes = getChangeTimesForNetworkDaos(networkDaos);
    changeTimes.addAll(
        AssemblerUtils.getTimesForObjectChanges(
            affiliationDaos,
            Functions.compose(
                NetworkStationTimeKey::getTime, AffiliationDao::getNetworkStationTimeKey),
            AffiliationDao::getEndTime,
            Functions.compose(
                NetworkStationTimeKey::getStation, AffiliationDao::getNetworkStationTimeKey)));

    return changeTimes;
  }

  private NavigableSet<Instant> getChangeTimesForNetworkDaos(
      NavigableMap<Instant, NetworkDao> networkDaos) {

    var changeTimes = new TreeSet<Instant>();

    NetworkDao prev = null;
    NetworkDao curr;

    for (var entry : networkDaos.entrySet()) {

      curr = entry.getValue();
      if (prev == null) {
        changeTimes.add(getNetworkDaoOnDate(curr));
      } else if (!AssemblerUtils.fullTimePrecisionObjectAdjacent(
          getNetworkDaoOffDate(prev), getNetworkDaoOnDate(curr))) {
        changeTimes.add(AssemblerUtils.getImmediatelyAfterInstant(getNetworkDaoOffDate(prev)));
        changeTimes.add(getNetworkDaoOnDate(curr));
      } else if (changeOccuredForSite.test(prev, curr)) {
        changeTimes.add(getNetworkDaoOnDate(curr));
      } else {
        // otherwise, take no action
      }
      prev = curr;
    }

    if (prev != null) {
      changeTimes.add(AssemblerUtils.getImmediatelyAfterInstant(getNetworkDaoOffDate(prev)));
    }
    return changeTimes;
  }

  private static Instant getNetworkDaoOnDate(NetworkDao networkDao) {
    return Optional.ofNullable(networkDao.getOnDate()).orElse(Instant.EPOCH);
  }

  private static Instant getNetworkDaoOffDate(NetworkDao networkDao) {
    return Optional.ofNullable(networkDao.getOffDate()).orElse(Instant.MAX);
  }
}
