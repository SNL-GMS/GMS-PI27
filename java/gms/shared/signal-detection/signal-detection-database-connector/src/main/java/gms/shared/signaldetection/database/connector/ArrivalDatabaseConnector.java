package gms.shared.signaldetection.database.connector;

import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import gms.shared.utilities.bridge.database.connector.EntitySingleResultFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope(BeanDefinition.SCOPE_PROTOTYPE)
public class ArrivalDatabaseConnector extends DatabaseConnector {

  private static final Logger LOGGER = LoggerFactory.getLogger(ArrivalDatabaseConnector.class);

  private static final String ARRIVAL_KEY = "arrivalKey";
  private static final String STATION_CODE = "stationCode";
  private static final String TIME = "time";
  private static final String ID = "id";

  static final String EMPTY_STATION_NAME_LIST_ERROR =
      "Request for Arrival by station name must be given a list of names";
  static final String EMPTY_EXCLUDED_ARID_LIST_ERROR =
      "Request for Arrival by excluded arids must be given a list of arids";
  static final String EMPTY_ARID_LIST_ERROR =
      "Request for Arrival by arids must be given a list of arids";
  static final String MISSING_START_TIME_ERROR =
      "Request for Arrival by time range must be given a start time";
  static final String MISSING_END_TIME_ERROR =
      "Request for Arrival by time range must be given a end time";
  static final String MISSING_LEAD_DELTA_ERROR =
      "Request for Arrival by time range must be given a lead time delta";
  static final String MISSING_LAG_DELTA_ERROR =
      "Request for Arrival by time range must be given a lag time delta";
  static final String START_NOT_BEFORE_END_TIME_ERROR = "Start time has to be before end time";

  static final String ARRIVAL_ARID_ERROR = "Arrival by arid exception";
  static final String ARRIVALS_ARIDS_ERROR = "Arrivals by arids exception";
  static final String ARRIVALS_TIME_RANGE_ERROR = "Arrivals by time range exception";
  static final String STATION_NAMES_EXCLUDED_ARIDS_ERROR =
      "Arrivals by stations names and excluded arids exception";

  static final String ARID_MESSAGE = "arid = %s";
  static final String ARID_SIZE_MESSAGE = "arids size = %s";
  static final String START_END_LAG_MESSAGE = "start - end: %s - %s, lead - lag: %s - %s";
  static final String TIME_RANGE_MESSAGE = "time range = %s - %s";

  @Autowired
  public ArrivalDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public Optional<ArrivalDao> findArrivalByArid(long arid) {
    var errorMessage = String.format(ARID_MESSAGE, arid);
    EntitySingleResultFunction<ArrivalDao> delegateFunction =
        (EntityManager entityManager) -> {
          var criteriaBuilder = entityManager.getCriteriaBuilder();
          var arrivalQuery = criteriaBuilder.createQuery(ArrivalDao.class);
          var fromArrival = arrivalQuery.from(ArrivalDao.class);
          arrivalQuery.select(fromArrival).where(criteriaBuilder.equal(fromArrival.get(ID), arid));

          return entityManager.createQuery(arrivalQuery).getSingleResult();
        };

    return runWithEntityManagerSingleResultFunction(
        delegateFunction, ARRIVAL_ARID_ERROR, errorMessage);
  }

  /**
   * Finds all {@link ArrivalDao}s for the given arids
   *
   * @param arids list of arids to search for
   * @return list of {@link ArrivalDao}s {@link Optional} if no such {@link ArrivalDao} exists
   */
  public List<ArrivalDao> findArrivalsByArids(Collection<Long> arids) {
    Validate.notNull(arids, EMPTY_ARID_LIST_ERROR);

    var errorMessage = String.format(ARID_SIZE_MESSAGE, arids.size());

    if (arids.isEmpty()) {
      LOGGER.debug("Request for Arrivals by arids was given an empty list of keys");
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          arids,
          250,
          (Collection<Long> partitionedArids) -> {
            EntityResultListFunction<ArrivalDao> delegateFunction =
                (EntityManager entityManager) -> {
                  var cb = entityManager.getCriteriaBuilder();
                  CriteriaQuery<ArrivalDao> arrivalQuery = cb.createQuery(ArrivalDao.class);
                  Root<ArrivalDao> fromArrival = arrivalQuery.from(ArrivalDao.class);

                  arrivalQuery.select(fromArrival);
                  arrivalQuery.where(fromArrival.get(ID).in(partitionedArids));

                  return entityManager.createQuery(arrivalQuery).getResultList().stream()
                      .distinct()
                      .toList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunction, ARRIVALS_ARIDS_ERROR, errorMessage);
          });
    }
  }

  /**
   * Find all {@link ArrivalDao}s for the given station names, excluded arids and time range
   *
   * @param stationNames Collections of station names
   * @param excludedArids Arrival ids to exclude
   * @param startTime Instant start time for time range
   * @param endTime Instant end time for time range
   * @param leadDelta Time delta for the start time
   * @param lagDelta Time delta for the end time
   * @return list of {@link ArrivalDao}s
   */
  public List<ArrivalDao> findArrivals(
      Collection<String> stationNames,
      Collection<Long> excludedArids,
      Instant startTime,
      Instant endTime,
      Duration leadDelta,
      Duration lagDelta) {

    Validate.notNull(stationNames, EMPTY_STATION_NAME_LIST_ERROR);
    Validate.notNull(excludedArids, EMPTY_EXCLUDED_ARID_LIST_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);
    Validate.notNull(leadDelta, MISSING_LEAD_DELTA_ERROR);
    Validate.notNull(lagDelta, MISSING_LAG_DELTA_ERROR);
    Validate.isTrue(startTime.isBefore(endTime), START_NOT_BEFORE_END_TIME_ERROR);

    var errorMessage =
        String.format(START_END_LAG_MESSAGE, startTime, endTime, leadDelta, lagDelta);

    if (stationNames.isEmpty()) {
      LOGGER.debug("Request for Arrival by station names was given an empty list of keys");
      return new ArrayList<>();
    } else {

      return runPartitionedQuery(
          stationNames,
          250,
          (Collection<String> partitionedStations) -> {
            EntityResultListFunction<ArrivalDao> delegateFunction =
                entityManager ->
                    createDelegateFunction(
                        entityManager,
                        partitionedStations,
                        excludedArids,
                        startTime.minus(leadDelta),
                        endTime.plus(lagDelta));

            return runWithEntityManagerResultListFunction(
                delegateFunction, STATION_NAMES_EXCLUDED_ARIDS_ERROR, errorMessage);
          });
    }
  }

  private static List<ArrivalDao> createDelegateFunction(
      EntityManager entityManager,
      Collection<String> partitionedStations,
      Collection<Long> excludedArids,
      Instant startTimeLower,
      Instant endTimeUpper) {

    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<ArrivalDao> query = cb.createQuery(ArrivalDao.class);
    Root<ArrivalDao> fromArrival = query.from(ArrivalDao.class);

    final Path<Object> idPath = fromArrival.get(ARRIVAL_KEY);

    Predicate excludeAridsPred =
        cb.and(
            excludedArids.stream()
                .map(arid -> cb.notEqual(fromArrival.get(ID), arid))
                .toArray(Predicate[]::new));

    // build the entire station name, excluded arids and time range query
    query.select(fromArrival);
    query.distinct(true);
    query.where(
        cb.and(
            idPath.get(STATION_CODE).in(partitionedStations),
            excludeAridsPred,
            cb.greaterThanOrEqualTo(idPath.get(TIME), startTimeLower),
            cb.lessThanOrEqualTo(idPath.get(TIME), endTimeUpper)));

    return entityManager.createQuery(query).getResultList();
  }

  /**
   * Find all {@link ArrivalDao}s for the given time range
   *
   * @param startTime Instant start time for time range
   * @param endTime Instant end time for time range
   * @return list of {@link ArrivalDao}s
   */
  public List<ArrivalDao> findArrivalsByTimeRange(Instant startTime, Instant endTime) {

    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);
    Validate.isTrue(startTime.isBefore(endTime), START_NOT_BEFORE_END_TIME_ERROR);

    var errorMessage = String.format(TIME_RANGE_MESSAGE, startTime, endTime);
    EntityResultListFunction<ArrivalDao> delegateFunction =
        (EntityManager entityManager) -> {
          var cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<ArrivalDao> query = cb.createQuery(ArrivalDao.class);
          Root<ArrivalDao> fromArrival = query.from(ArrivalDao.class);

          final Path<Object> idPath = fromArrival.get(ARRIVAL_KEY);
          query.select(fromArrival);
          query.distinct(true);
          query.where(cb.between(idPath.get(TIME), startTime, endTime));

          return entityManager.createQuery(query).getResultList();
        };

    return runWithEntityManagerResultListFunction(
        delegateFunction, ARRIVALS_TIME_RANGE_ERROR, errorMessage);
  }
}
