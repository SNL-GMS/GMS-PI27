package gms.shared.signaldetection.repository;

import static java.util.Comparator.comparing;
import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.maxBy;

import gms.shared.signaldetection.dao.css.AmplitudeDynParsIntDao;
import gms.shared.signaldetection.dao.css.ArrivalDynParsIntDao;
import gms.shared.signaldetection.database.connector.AmplitudeDynParsIntDatabaseConnector;
import gms.shared.signaldetection.database.connector.ArrivalDynParsIntDatabaseConnector;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/** Utility for finding filterIds for given arids and ampids. */
public final class FilterIdUtility {

  private static final List<String> ORDERED_GROUP_NAMES = List.of("FK", "ONSET", "DETECT");

  private FilterIdUtility() {}

  /**
   * Return a filterid associated with the given arid.
   *
   * @param arid the arid to search
   * @return the Optional.of(filterid), after reducing the set of potential ArrivalDSN records, or
   *     Optional.empty(), if ArrivalDSN records are not found.
   */
  public static Optional<Long> getFilterIdForArid(
      ArrivalDynParsIntDatabaseConnector arrivalDynParsIntDatabaseConnector, long arid) {

    return getArrivalDynParsIntDaoForArid(arrivalDynParsIntDatabaseConnector, arid)
        .map(ArrivalDynParsIntDao::getIvalue);
  }

  public static Optional<ArrivalDynParsIntDao> getArrivalDynParsIntDaoForArid(
      ArrivalDynParsIntDatabaseConnector arrivalDynParsIntDatabaseConnector, long arid) {

    var adpiList = arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(Set.of(arid));

    return adpiList.stream()
        .collect(
            groupingBy(
                arrDpi -> arrDpi.getArrivalDynParsIntKey().getGroupName(),
                maxBy(comparing(ArrivalDynParsIntDao::getLdDate))))
        .entrySet()
        .stream()
        .filter(entry -> ORDERED_GROUP_NAMES.contains(entry.getKey()))
        .sorted(FilterIdUtility::groupPriorityCompare)
        .findFirst()
        .flatMap(Map.Entry::getValue);
  }

  /**
   * Return a filterId associated with the given ampid.
   *
   * @param ampid
   * @return the Optional.of(filterid), after reducing the set of potential AmpDSN records, or
   *     Optional.empty(), if AmpDSN records are not found.
   */
  public static Optional<Long> getFilterIdForAmpid(
      AmplitudeDynParsIntDatabaseConnector amplitudeDynParsIntDatabaseConnector, long ampid) {

    var adpiList = amplitudeDynParsIntDatabaseConnector.findFilterAdpisByIds(Set.of(ampid));

    if (adpiList.isEmpty()) {
      return Optional.empty();
    } else {
      return adpiList.stream()
          .max((adpi1, adpi2) -> adpi1.getLdDate().compareTo(adpi2.getLdDate()))
          .map(AmplitudeDynParsIntDao::getIvalue);
    }
  }

  private static int groupPriorityCompare(
      Map.Entry<String, Optional<ArrivalDynParsIntDao>> firstAdpiEntry,
      Map.Entry<String, Optional<ArrivalDynParsIntDao>> secondAdpiEntry) {

    return Integer.compare(
        ORDERED_GROUP_NAMES.indexOf(firstAdpiEntry.getKey()),
        ORDERED_GROUP_NAMES.indexOf(secondAdpiEntry.getKey()));
  }
}
