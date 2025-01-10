package gms.shared.stationdefinition.converter.util.assemblers;

import static java.util.stream.Collectors.toMap;

import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Range;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.coi.utils.StationDefinitionObject;
import gms.shared.stationdefinition.converter.util.TemporalMap;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.NavigableSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.function.BiPredicate;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.UnaryOperator;
import java.util.stream.Collector;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;

public final class AssemblerUtils {

  public static final Duration MAX_GAP_ALLOWED = Duration.ofSeconds(1);

  public static final UnaryOperator<Instant> effectiveAtStartOfDayOffset =
      effectiveUntil -> applyTimeAlignment(effectiveUntil, 0, 0, 0, 0);

  public static final UnaryOperator<Instant> effectiveUntilNoonOffset =
      effectiveUntil -> applyTimeAlignment(effectiveUntil, 11, 59, 59, 999_000_000);

  public static final UnaryOperator<Instant> effectiveUntilEndOfDay =
      effectiveUntil -> applyTimeAlignment(effectiveUntil, 23, 59, 59, 999_000_000);

  public static final UnaryOperator<Instant> effectiveAtNoonOffset =
      effectiveUntil -> applyTimeAlignment(effectiveUntil, 12, 0, 0, 0);

  private AssemblerUtils() {}

  private static Instant applyTimeAlignment(
      Instant inputInstant, int applyHour, int applyMinute, int applySecond, int applyNano) {

    if (!inputInstant.equals(Instant.MAX)) {
      return inputInstant
          .atZone(ZoneOffset.UTC)
          .withHour(applyHour)
          .withMinute(applyMinute)
          .withSecond(applySecond)
          .withNano(applyNano)
          .toInstant();
    } else {
      return inputInstant;
    }
  }

  public static boolean changeTimeExistsForDay(Instant time, NavigableSet<Instant> changeTimes) {

    time = time.truncatedTo(ChronoUnit.DAYS);
    var correspondingTime = changeTimes.ceiling(time);
    return correspondingTime != null && correspondingTime.truncatedTo(ChronoUnit.DAYS).equals(time);
  }

  public static boolean siteOrSiteChansAdjacent(Instant prevTime, Instant startTime) {

    // 1 or less day difference between times
    return Duration.between(prevTime, startTime).compareTo(Duration.ofDays(1)) <= 0;
  }

  public static boolean onSameDay(Instant prev, Instant curr) {
    return prev.truncatedTo(ChronoUnit.DAYS).equals(curr.truncatedTo(ChronoUnit.DAYS));
  }

  public static boolean instantGreaterOrEqual(Instant i1, Instant i2) {
    return i1.isAfter(i2) || i1.equals(i2);
  }

  public static boolean fullTimePrecisionObjectAdjacent(Instant prev, Instant curr) {

    if (prev == null || curr == null) {
      return false;
    }
    return Duration.between(prev, curr).abs().compareTo(MAX_GAP_ALLOWED) <= 0;
  }

  /**
   * Builds a table of version for a provided collection of objects
   *
   * @param rowKeyExtractor A function that extracts the first key (row key) from the object to be
   *     versioned
   * @param columnKeyExtractor A function that extracts the second key (column key) from the object
   *     to be versioned
   * @param versionKeyExtractor A function that extracts the key that defines the version of the
   *     object
   * @param versions The objects to be versioned
   * @param <R> The type of the row key
   * @param <C> The type of the column key
   * @param <V> The type of object to be versioned
   * @return A table of versions of object, based on row and column keys
   */
  public static <R, C, V> Table<R, C, NavigableMap<Instant, V>> buildVersionTable(
      Function<V, R> rowKeyExtractor,
      Function<V, C> columnKeyExtractor,
      Function<V, Instant> versionKeyExtractor,
      Collection<V> versions) {

    if (versions == null) {
      return HashBasedTable.create();
    }

    return versions.stream()
        .collect(
            Collector.of(
                HashBasedTable::create,
                (HashBasedTable<R, C, NavigableMap<Instant, V>> table, V version) -> {
                  var rowKey = rowKeyExtractor.apply(version);
                  var columnKey = columnKeyExtractor.apply(version);
                  if (!table.contains(rowKey, columnKey)) {
                    table.put(rowKey, columnKey, new TreeMap<>());
                  }

                  table.get(rowKey, columnKey).put(versionKeyExtractor.apply(version), version);
                },
                (HashBasedTable<R, C, NavigableMap<Instant, V>> table1,
                    HashBasedTable<R, C, NavigableMap<Instant, V>> table2) -> {
                  table2
                      .cellSet()
                      .forEach(
                          (Table.Cell<R, C, NavigableMap<Instant, V>> cell) -> {
                            if (!table1.contains(cell.getRowKey(), cell.getColumnKey())) {
                              table1.put(cell.getRowKey(), cell.getColumnKey(), cell.getValue());
                            } else {
                              table1
                                  .get(cell.getRowKey(), cell.getColumnKey())
                                  .putAll(cell.getValue());
                            }
                          });

                  return table1;
                }));
  }

  /*
   * Check for name changes of sub-objects that trigger top object change
   *
   */
  public static <T extends StationDefinitionObject> NavigableSet<Instant> getTimesForObjectChanges(
      Map<String, NavigableMap<Instant, T>> sdoByStaChan) {

    return getTimesForObjectChanges(
        sdoByStaChan,
        sdo -> sdo.getEffectiveAt().orElseThrow(),
        sdo -> sdo.getEffectiveUntil().orElse(Instant.MAX),
        StationDefinitionObject::getName);
  }

  public static <T> NavigableSet<Instant> getTimesForObjectChanges(
      Map<String, NavigableMap<Instant, T>> map,
      Function<T, Instant> startTimeExtractor,
      Function<T, Instant> endTimeExtractor,
      Function<T, String> nameExtractor) {

    var versionChanges = new TreeSet<Instant>();
    var possibleVersionTimes =
        getPossibleChangeTimesForObjects(map, startTimeExtractor, endTimeExtractor);

    Iterator<Instant> versionTimeIterator = possibleVersionTimes.iterator();
    Set<String> currNames;
    Set<String> prevNames = Collections.emptySet();

    if (versionTimeIterator.hasNext()) {

      var currInstant = versionTimeIterator.next();
      versionChanges.add(currInstant);

      prevNames =
          map.values().stream()
              .map(naviMap -> naviMap.floorEntry(currInstant))
              .filter(Objects::nonNull)
              .map(Map.Entry::getValue)
              .filter(sdo -> !endTimeExtractor.apply(sdo).isBefore(currInstant))
              .map(nameExtractor::apply)
              .collect(Collectors.toSet());
    }

    while (versionTimeIterator.hasNext()) {

      var currInstant = versionTimeIterator.next();

      currNames =
          map.values().stream()
              .map(naviMap -> naviMap.floorEntry(currInstant))
              .filter(Objects::nonNull)
              .map(Map.Entry::getValue)
              .filter(sdo -> !endTimeExtractor.apply(sdo).isBefore(currInstant))
              .map(nameExtractor::apply)
              .collect(Collectors.toSet());

      if (!prevNames.equals(currNames)) {
        versionChanges.add(currInstant);
      }
      prevNames = currNames;
    }
    return versionChanges;
  }

  public static <T> NavigableSet<Instant> getPossibleChangeTimesForObjects(
      Map<String, NavigableMap<Instant, T>> map,
      Function<T, Instant> startTimeExtractor,
      Function<T, Instant> endTimeExtractor) {

    var possibleVersionTimes = new TreeSet<Instant>();

    for (NavigableMap<Instant, T> sdoMap : map.values()) {
      Instant prevTime = null;
      for (Map.Entry<Instant, T> sdo : sdoMap.entrySet()) {
        Instant effectiveAt = startTimeExtractor.apply(sdo.getValue());

        possibleVersionTimes.add(effectiveAt);

        // need to check if there are other sdos adjacent to prevtime
        if (prevTime != null && !fullTimePrecisionObjectAdjacent(prevTime, effectiveAt)) {
          possibleVersionTimes.add(getImmediatelyAfterInstant(prevTime));
        }

        prevTime = endTimeExtractor.apply(sdo.getValue());
      }

      if (prevTime != null) {
        possibleVersionTimes.add(getImmediatelyAfterInstant(prevTime));
      }
    }
    return possibleVersionTimes;
  }

  /**
   * Returns a list of objects in range
   *
   * @param versionTime the instant to get objects for
   * @param navMap a map of navigableMaps of the object
   * @param endTimeExtractor a function to get the end time of the object
   * @param <V> The type of the object
   * @return A list of objects
   */
  public static <V> List<V> getObjectsForVersionTime(
      Instant versionTime,
      Map<String, NavigableMap<Instant, V>> navMap,
      Function<V, Instant> endTimeExtractor) {

    if (navMap == null) {
      return Collections.emptyList();
    }

    return navMap.values().stream()
        .map(naviMap -> naviMap.floorEntry(versionTime))
        .filter(Objects::nonNull)
        .map(Map.Entry::getValue)
        .filter(sdo -> endTimeExtractor.apply(sdo).isAfter(versionTime))
        .toList();
  }

  // temporary fix for dealing with effective at time queries
  public static <V> List<V> getObjectsForVersionTimeEnd(
      Instant versionTime,
      Map<String, NavigableMap<Instant, V>> navMap,
      Function<V, Instant> endTimeExtractor) {

    if (navMap == null) {
      return Collections.emptyList();
    }

    return navMap.values().stream()
        .map(naviMap -> naviMap.floorEntry(versionTime))
        .filter(Objects::nonNull)
        .map(Map.Entry::getValue)
        .filter(
            sdo ->
                endTimeExtractor.apply(sdo).isAfter(versionTime)
                    || endTimeExtractor.apply(sdo).equals(versionTime))
        .toList();
  }

  /**
   * Returns a list of objects in range
   *
   * @param versionTime the Instant of time to get objects for
   * @param navMap a map of navigableMaps of the object
   * @param endTimeExtractor a function to get the end time of the object
   * @param <V> The type of the object
   * @return An optional object
   */
  public static <V> Optional<V> getObjectsForVersionTime(
      Instant versionTime, NavigableMap<Instant, V> navMap, Function<V, Instant> endTimeExtractor) {

    if (navMap == null) {
      return Optional.empty();
    }

    var objAtTime = navMap.floorEntry(versionTime);

    if (Objects.nonNull(objAtTime)
        && endTimeExtractor.apply(objAtTime.getValue()).isAfter(versionTime)) {
      return Optional.of(objAtTime.getValue());
    }

    return Optional.empty();
  }

  public static <V> Optional<V> getObjectsForVersionTimeEnd(
      Instant versionTime, NavigableMap<Instant, V> navMap, Function<V, Instant> endTimeExtractor) {

    if (navMap == null) {
      return Optional.empty();
    }

    var objAtTime = navMap.floorEntry(versionTime);

    if (Objects.nonNull(objAtTime)
        && (endTimeExtractor.apply(objAtTime.getValue()).isAfter(versionTime)
            || endTimeExtractor.apply(objAtTime.getValue()).equals(versionTime))) {
      return Optional.of(objAtTime.getValue());
    }

    return Optional.empty();
  }

  /**
   * Returns a Map of sta or sta+chan code to a navigable map of daos within range
   *
   * @param range the
   * @param daosByStationCode a temporal map of daos to a sta code string
   * @param stationCodes a set of sta codes
   * @param startTimeExtractor a function to get the start time of the dao
   * @param endTimeExtractor a function to get the end time of the dao
   * @param <V> The type of the dao
   * @return A map of navigable maps
   */
  public static <V> Map<String, NavigableMap<Instant, V>> getDaosWithinRange(
      Range<Instant> range,
      TemporalMap<String, V> daosByStationCode,
      Set<String> stationCodes,
      Function<V, Instant> startTimeExtractor,
      Function<V, Instant> endTimeExtractor) {

    var daoStream =
        stationCodes.stream()
            .map(stationCode -> Pair.of(stationCode, daosByStationCode.getVersionMap(stationCode)));

    return getSubMap(range, daoStream, startTimeExtractor, endTimeExtractor);
  }

  /**
   * Returns a Map of chan code to a navigable map of daos within range
   *
   * @param range the
   * @param daosByChanCode a temporal map of daos to a chan code string
   * @param startTimeExtractor a function to get the start time of the dao
   * @param endTimeExtractor a function to get the end time of the dao
   * @param <V> The type of the dao
   * @return A map of navigable maps
   */
  public static <V> Map<String, NavigableMap<Instant, V>> getDaosWithinRange(
      Range<Instant> range,
      Map<String, NavigableMap<Instant, V>> daosByChanCode,
      Function<V, Instant> startTimeExtractor,
      Function<V, Instant> endTimeExtractor) {

    var daoStream =
        daosByChanCode.entrySet().stream().map(entry -> Pair.of(entry.getKey(), entry.getValue()));

    return getSubMap(range, daoStream, startTimeExtractor, endTimeExtractor);
  }

  /**
   * Returns a Map of sta or sta+chan code to a navigable map of daos within range
   *
   * @param range the Instant range
   * @param daosByStationAndChannel a table of navigable map of daos to a sta code and chan code
   * @param stationCodes a set of sta codes
   * @param startTimeExtractor a function to get the start time of the dao
   * @param endTimeExtractor a function to get the end time of the dao
   * @param <V> The type of the dao
   * @return A map of navigable maps
   */
  public static <V> Map<String, NavigableMap<Instant, V>> getDaosWithinRange(
      Range<Instant> range,
      Table<String, String, NavigableMap<Instant, V>> daosByStationAndChannel,
      Set<String> stationCodes,
      Function<V, Instant> startTimeExtractor,
      Function<V, Instant> endTimeExtractor) {

    var daoStream =
        stationCodes.stream()
            .map(
                stationCode ->
                    Pair.of(stationCode, daosByStationAndChannel.row(stationCode).entrySet()))
            .flatMap(
                pair ->
                    pair.getRight().stream()
                        .map(
                            entry ->
                                Pair.of(pair.getLeft() + "." + entry.getKey(), entry.getValue())));

    return getSubMap(range, daoStream, startTimeExtractor, endTimeExtractor);
  }

  private static <V> Map<String, NavigableMap<Instant, V>> getSubMap(
      Range<Instant> range,
      Stream<Pair<String, NavigableMap<Instant, V>>> daosByStationAndChannel,
      Function<V, Instant> startTimeExtractor,
      Function<V, Instant> endTimeExtractor) {

    return daosByStationAndChannel
        .map(
            navMapPair ->
                Pair.of(
                    navMapPair.getLeft(),
                    getDaosInRange(
                        range, navMapPair.getValue(), startTimeExtractor, endTimeExtractor)))
        .collect(toMap(Pair::getKey, Pair::getValue));
  }

  public static <V> NavigableMap<Instant, V> getDaosInRange(
      Range<Instant> range,
      NavigableMap<Instant, V> daosNavMap,
      Function<V, Instant> startTimeExtractor,
      Function<V, Instant> endTimeExtractor) {

    if (daosNavMap == null) {
      return new TreeMap<>();
    }

    var daosInRange = daosNavMap.subMap(range.lowerEndpoint(), true, range.upperEndpoint(), true);
    var possibleDaoEndingInRange = daosNavMap.floorEntry(range.lowerEndpoint().minusNanos(1));
    if (possibleDaoEndingInRange != null
        && instantGreaterOrEqual(
            endTimeExtractor.apply(possibleDaoEndingInRange.getValue()), range.lowerEndpoint())) {

      var treeMap = new TreeMap<Instant, V>();
      treeMap.putAll(daosInRange);
      treeMap.put(
          startTimeExtractor.apply(possibleDaoEndingInRange.getValue()),
          possibleDaoEndingInRange.getValue());
      daosInRange = treeMap;
    }

    return daosInRange;
  }

  public static <T> void addChangeTimesToListForDaosWithDayAccuracy(
      NavigableSet<Instant> changeTimes,
      Map<String, NavigableMap<Instant, T>> daosForVersion,
      BiPredicate<T, T> changeOccured,
      Function<T, Instant> startTimeExtractor,
      Function<T, Instant> endTimeExtractor,
      Predicate<T> startOverlap,
      Predicate<T> endOverlap) {

    for (var daoEntry : daosForVersion.entrySet()) {

      addChangeTimesToListForDaosWithDayAccuracy(
          changeTimes,
          daoEntry.getValue(),
          changeOccured,
          startTimeExtractor,
          endTimeExtractor,
          startOverlap,
          endOverlap);
    }
  }

  public static <T> void addChangeTimesToListForDaosWithDayAccuracy(
      NavigableSet<Instant> changeTimes,
      NavigableMap<Instant, T> daosForVersion,
      BiPredicate<T, T> changeOccured,
      Function<T, Instant> startTimeExtractor,
      Function<T, Instant> endTimeExtractor,
      Predicate<T> startOverlap,
      Predicate<T> endOverlap) {

    T prevDao = null;
    Instant prevEndTime = null;

    for (var entry : daosForVersion.entrySet()) {

      var startTime = startTimeExtractor.apply(entry.getValue());
      var endTime = endTimeExtractor.apply(entry.getValue());
      var currDao = entry.getValue();

      if (prevEndTime != null
          && !siteOrSiteChansAdjacent(prevEndTime, startTime)
          && !changeTimeExistsForDay(prevEndTime, changeTimes)) {

        changeTimes.add(getImmediatelyAfterInstant(effectiveUntilEndOfDay.apply(prevEndTime)));
      }

      addCurrTimeToChangeTimes(
          prevEndTime, startTime, changeOccured, changeTimes, startOverlap, prevDao, currDao);

      prevEndTime = endTime;
      prevDao = currDao;
    }

    addPrevTimeToChangeTimes(prevEndTime, changeTimes, endOverlap, prevDao);
  }

  private static <T> void addCurrTimeToChangeTimes(
      Instant prevEndTime,
      Instant startTime,
      BiPredicate<T, T> changeOccured,
      NavigableSet<Instant> changeTimes,
      Predicate<T> startOverlap,
      T prevDao,
      T currDao) {

    if (changeOccured(prevEndTime, startTime, changeOccured, changeTimes, prevDao, currDao)) {

      if ((prevEndTime != null && onSameDay(prevEndTime, startTime))
          || (prevEndTime == null && startOverlap.test(currDao))) {
        changeTimes.add(effectiveAtNoonOffset.apply(startTime));
      } else {
        changeTimes.add(startTime);
      }
    }
  }

  private static <T> void addPrevTimeToChangeTimes(
      Instant prevEndTime, NavigableSet<Instant> changeTimes, Predicate<T> endOverlap, T prevDao) {

    if (prevEndTime != null && !changeTimeExistsForDay(prevEndTime, changeTimes)) {

      if (endOverlap.test(prevDao)) {
        changeTimes.add(effectiveAtNoonOffset.apply(prevEndTime));
      } else {
        changeTimes.add(getImmediatelyAfterInstant(effectiveUntilEndOfDay.apply(prevEndTime)));
      }
    }
  }

  private static <T> boolean changeOccured(
      Instant prevTime,
      Instant startTime,
      BiPredicate<T, T> changeOccured,
      NavigableSet<Instant> changeTimes,
      T prevDao,
      T currDao) {

    var timeExistsInList = changeTimeExistsForDay(startTime, changeTimes);
    var noGapOccured = (prevTime != null) && siteOrSiteChansAdjacent(prevTime, startTime);
    var changed = changeOccured.test(prevDao, currDao);

    return !timeExistsInList && (!noGapOccured || changed);
  }

  public static List<Instant> getValidTimes(
      Pair<Instant, Instant> startEndTime,
      NavigableSet<Instant> possibleVersionTimes,
      boolean isRange) {

    List<Instant> validTimes = new ArrayList<>();

    // if effectiveTime == a time in possibleVersionTimes, only 1 validTime will be found, we want
    // to find the nextValidTime as well
    Instant possibleVersionsEndTime;
    if (!isRange) {
      possibleVersionsEndTime = startEndTime.getRight().plus(1, ChronoUnit.DAYS);
    } else {
      possibleVersionsEndTime = getImmediatelyAfterInstant(startEndTime.getRight());
    }

    Optional<Instant> floor =
        Optional.ofNullable(possibleVersionTimes.floor(startEndTime.getLeft()));
    Optional<Instant> ceiling =
        Optional.ofNullable(possibleVersionTimes.ceiling(possibleVersionsEndTime));
    var inRangeTimes =
        possibleVersionTimes.subSet(
            floor.orElse(startEndTime.getLeft()),
            true,
            ceiling.orElse(possibleVersionsEndTime),
            true);

    // get rid of times with 1 or less second difference between them, these times are caused by db
    // inaccuracies
    Instant prevTime = null;
    for (Instant currTime : inRangeTimes) {

      if (prevTime != null) {

        validTimes.add(prevTime);
        if (!fullTimePrecisionObjectAdjacent(prevTime, currTime)) {
          prevTime = currTime;
        } else {
          prevTime = null;
        }
      } else {
        prevTime = currTime;
      }
    }

    if (prevTime != null) {
      validTimes.add(prevTime);
    }
    return validTimes;
  }

  public static Instant getImmediatelyBeforeInstant(Instant instant) {

    if (instant == Instant.MIN || instant == Instant.MAX) {
      return instant;
    }
    return instant.minusMillis(1);
  }

  public static Instant getImmediatelyAfterInstant(Instant instant) {

    if (instant == Instant.MIN || instant == Instant.MAX) {
      return instant;
    }
    return instant.plusMillis(1);
  }
}
