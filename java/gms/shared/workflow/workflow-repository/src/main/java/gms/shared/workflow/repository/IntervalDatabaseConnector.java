package gms.shared.workflow.repository;

import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import gms.shared.workflow.dao.IntervalDao;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.apache.commons.lang3.Validate;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Executes Interval-related queries against the database */
@Component
public class IntervalDatabaseConnector extends DatabaseConnector {

  static final String MISSING_START_TIME_ERROR =
      "Received a null value for start time.  findIntervalsByTimeRange must be given a non null"
          + " start time";
  static final String MISSING_END_TIME_ERROR =
      "Received a null value for end time.  findIntervalsByTimeRange must be given a non null end"
          + " time";
  static final String MISSING_INTERVAL_CLASS_AND_NAMES_ERROR =
      "Request for Interval by time range must  be given an interval name";
  static final String START_NOT_BEFORE_END_TIME_ERROR =
      "Start time, {}, must be before end time {}";

  // names of the tables in the Interval database
  private static final String TIME = "time";
  private static final String END_TIME = "endTime";
  public static final String CLASS_END_TIME_NAME_TIME_KEY = "classEndTimeNameTimeKey";

  static final String INTERVALS_TIME_RANGE_ERROR = "Intervals by time range exception";
  static final String INTERVALS_NAMES_TIME_RANGE_ERROR = "Intervals by time range exception";
  static final String INTERVALS_TIME_RANGE_MOD_DATE_ERROR =
      "Intervals by time range and mod date exception";

  static final String INTERVALS_TIME_RANGE_MESSAGE = "time range %s - %s";
  static final String INTERVALS_NAMES_TIME_RANGE_MESSAGE = "names %s, time range %s - %s";
  static final String INTERVALS_TIME_RANGE_MOD_DATE_MESSAGE = "time range %s - %s, mod date %s";

  @Autowired
  public IntervalDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  /**
   * Retrieves all {@link IntervalDao}s that lie within the given time range
   *
   * @param seedDataStartTime Start time of the query range, inclusive
   * @param seedDataEndTime End time of the query range, exclusive
   * @return All {@link IntervalDao}s that lie between the given time range
   */
  public List<IntervalDao> findIntervalsByTimeRange(
      Instant seedDataStartTime, Instant seedDataEndTime) {

    Validate.notNull(seedDataStartTime, MISSING_START_TIME_ERROR);
    Validate.notNull(seedDataEndTime, MISSING_END_TIME_ERROR);
    Validate.isTrue(
        seedDataStartTime.isBefore(seedDataEndTime),
        START_NOT_BEFORE_END_TIME_ERROR,
        seedDataStartTime,
        seedDataEndTime);

    var errMessage =
        String.format(INTERVALS_TIME_RANGE_MESSAGE, seedDataStartTime, seedDataEndTime);
    EntityResultListFunction<IntervalDao> delegateFunc =
        (EntityManager em) -> {
          var cb = em.getCriteriaBuilder();
          CriteriaQuery<IntervalDao> query = cb.createQuery(IntervalDao.class);
          Root<IntervalDao> fromInterval = query.from(IntervalDao.class);

          query.select(fromInterval);
          query.where(
              cb.and(
                  cb.greaterThan(
                      fromInterval.get(CLASS_END_TIME_NAME_TIME_KEY).get(END_TIME),
                      seedDataStartTime.getEpochSecond()),
                  cb.lessThanOrEqualTo(
                      fromInterval.get(CLASS_END_TIME_NAME_TIME_KEY).get(END_TIME),
                      seedDataEndTime.getEpochSecond())));

          return em.createQuery(query).getResultList();
        };

    return runWithEntityManagerResultListFunction(
        delegateFunc, INTERVALS_TIME_RANGE_ERROR, errMessage);
  }

  /**
   * Retrieves all {@link IntervalDao}s with the given interval class and names that lie within the
   * given time range
   *
   * @param intervalClassAndNames Class and names of IntervalDaos to retrieve
   * @param startTime Start time of the query range, inclusive
   * @param endTime End time of the query range, exclusive
   * @return All {@link IntervalDao}s with the given interval class and names that lie within the
   *     given time range
   */
  public List<IntervalDao> findIntervalsByNameAndTimeRange(
      Set<Pair<String, String>> intervalClassAndNames, Instant startTime, Instant endTime) {

    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);
    Validate.notNull(intervalClassAndNames, MISSING_INTERVAL_CLASS_AND_NAMES_ERROR);
    Validate.isTrue(startTime.isBefore(endTime), START_NOT_BEFORE_END_TIME_ERROR);

    var errMessage =
        String.format(
            INTERVALS_NAMES_TIME_RANGE_MESSAGE, intervalClassAndNames.size(), startTime, endTime);
    EntityResultListFunction<IntervalDao> func =
        em -> createIntervalDaoQuery(em, intervalClassAndNames, startTime, endTime, null);

    return runWithEntityManagerResultListFunction(
        func, INTERVALS_NAMES_TIME_RANGE_ERROR, errMessage);
  }

  /**
   * Retrieves all {@link IntervalDao}s with the given interval class and names that lie within the
   * given time range and were modified after the given modification date
   *
   * @param intervalClassAndNames Class and names of IntervalDaos to retrieve
   * @param startTime Start time of the query range, inclusive
   * @param endTime End time of the query range, exclusive
   * @param modDate Intervals are retrieved if they have a modDate after this time
   * @return All {@link IntervalDao}s with the given interval class and names that lie within the
   *     given time range and were modified after the given modification date
   */
  public List<IntervalDao> findIntervalsByNameAndTimeRangeAfterModDate(
      Set<Pair<String, String>> intervalClassAndNames,
      Instant startTime,
      Instant endTime,
      Instant modDate) {
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);
    Validate.notNull(intervalClassAndNames, MISSING_INTERVAL_CLASS_AND_NAMES_ERROR);
    Validate.isTrue(startTime.isBefore(endTime), START_NOT_BEFORE_END_TIME_ERROR);

    var errMessage =
        String.format(INTERVALS_TIME_RANGE_MOD_DATE_MESSAGE, startTime, endTime, modDate);
    EntityResultListFunction<IntervalDao> func =
        em -> createIntervalDaoQuery(em, intervalClassAndNames, startTime, endTime, modDate);

    return runWithEntityManagerResultListFunction(
        func, INTERVALS_TIME_RANGE_MOD_DATE_ERROR, errMessage);
  }

  private List<IntervalDao> createIntervalDaoQuery(
      EntityManager em,
      Set<Pair<String, String>> intervalClassAndNames,
      Instant startTime,
      Instant endTime,
      Instant modDate) {

    var cb = em.getCriteriaBuilder();
    CriteriaQuery<IntervalDao> query = cb.createQuery(IntervalDao.class);
    Root<IntervalDao> intervalDaoRoot = query.from(IntervalDao.class);

    var cbPredicate =
        cb.and(
            cb.greaterThan(
                intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get(END_TIME),
                startTime.getEpochSecond()),
            cb.lessThan(
                intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get(TIME),
                endTime.getEpochSecond()),
            cb.or(
                intervalClassAndNames.stream()
                    .map(
                        classAndName ->
                            cb.and(
                                cb.equal(
                                    intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get("type"),
                                    classAndName.getLeft()),
                                cb.equal(
                                    intervalDaoRoot.get(CLASS_END_TIME_NAME_TIME_KEY).get("name"),
                                    classAndName.getRight())))
                    .toArray(Predicate[]::new)));

    if (modDate != null) {
      cbPredicate =
          cb.and(cbPredicate, cb.greaterThan(intervalDaoRoot.get("lastModificationDate"), modDate));
    }

    query.select(intervalDaoRoot).where(cbPredicate);

    return em.createQuery(query).getResultList();
  }
}
