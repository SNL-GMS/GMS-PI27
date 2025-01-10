package gms.testtools.simulators.bridgeddatasourceanalysissimulator.connector;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.event.dao.ArInfoDao;
import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.EventIdOriginIdKey;
import gms.shared.event.dao.NetMagDao;
import gms.shared.event.dao.OriginDao;
import gms.shared.event.dao.StaMagDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Provides several methods for retrieving DAOs from the simulator */
public class OriginSimulatorDatabaseConnector extends DatabaseConnector {

  private static final Logger logger =
      LoggerFactory.getLogger(OriginSimulatorDatabaseConnector.class);

  static final String RECORDS_BY_ID_ERROR = "Origin records by id exception";
  static final String ORIGIN_TIME_ERROR = "Origin time exception";
  static final String TIME_MESSAGE = "start and end time %s - %s";
  private static final String ORIGIN_ID_FIELD = "originId";

  public OriginSimulatorDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public static OriginSimulatorDatabaseConnector create(EntityManagerFactory entityManagerFactory) {
    checkNotNull(entityManagerFactory, "EntityManagerFactory cannot be null");

    return new OriginSimulatorDatabaseConnector(entityManagerFactory);
  }

  /**
   * Find origin records within the given time range. Note that this does not adjust by what is in
   * ORIGERR (like OriginDatabaseConnector does) because the simulator will want exactly the ORIGIN
   * records in the time range.
   *
   * @param startTime start of time range
   * @param endTime end of time range
   * @return list of OriginDaos found in the time range.
   */
  public List<OriginDao> findOriginDaosByPreciseTime(Instant startTime, Instant endTime) {
    var errMessage = String.format(TIME_MESSAGE, startTime, endTime);
    EntityResultListFunction<OriginDao> delegateFunction =
        entityManager -> {
          var criteriaBuilder = entityManager.getCriteriaBuilder();
          var query = criteriaBuilder.createQuery(OriginDao.class);
          var originDaoRt = query.from(OriginDao.class);

          query.where(
              criteriaBuilder.and(
                  criteriaBuilder.greaterThanOrEqualTo(
                      originDaoRt.get("latLonDepthTimeKey").get("time"),
                      startTime.toEpochMilli() / 1000.0),
                  criteriaBuilder.lessThan(
                      originDaoRt.get("latLonDepthTimeKey").get("time"),
                      endTime.toEpochMilli() / 1000.0)));

          return entityManager.createQuery(query).getResultList();
        };

    return runWithEntityManagerResultListFunction(delegateFunction, ORIGIN_TIME_ERROR, errMessage);
  }

  /**
   * Find the EventControlDao record associated with the eventIdOriginIdKey, and return an Optional
   * empty if it doesn't exist.
   *
   * @param eventIdOriginIdKey eventIdOriginIdKey to search for
   * @return Optional.of([record]) or Optional.empty().
   */
  public Optional<EventControlDao> retrieveEventControlDaoByEventIdAndOriginId(
      EventIdOriginIdKey eventIdOriginIdKey) {

    var singletonList =
        retrieveRecordsById(
            EventControlDao.class,
            eventControlDaoRt -> eventControlDaoRt.get("eventIdOriginIdKey"),
            eventIdOriginIdKey);

    //
    // Note: If we find more than one record, there is something seriously wrong, because the
    // database schema does not allow it.
    //
    if (singletonList.size() > 1) {
      logger.error(
          "Event control by event id and origin id failure: ",
          new IllegalStateException(
              "More than one EventControlDao found for " + eventIdOriginIdKey));
      return Optional.empty();
    }

    return singletonList.isEmpty() ? Optional.empty() : Optional.of(singletonList.get(0));
  }

  /**
   * Retrieve the ArInfoDaos associated with the given Origin id.
   *
   * @param originId origin ID
   * @return list of ArInfoDao objects
   */
  public List<ArInfoDao> retrieveArInfoDaoListForOriginId(long originId) {

    return retrieveRecordsById(
        ArInfoDao.class,
        arInfoDaoRt -> arInfoDaoRt.get("originIdArrivalIdKey").get(ORIGIN_ID_FIELD),
        originId);
  }

  /**
   * Retrieve the AssocDaos associated with the given originId
   *
   * @param originId origin IF
   * @return List of AssocDao objects
   */
  public List<AssocDao> retrieveAssocDaoListFromOriginId(long originId) {
    return retrieveRecordsById(
        AssocDao.class, assocDaoRt -> assocDaoRt.get("id").get(ORIGIN_ID_FIELD), originId);
  }

  /**
   * Retrieve the NetMagDaos associated with the given Origin id.
   *
   * @param originId origin ID
   * @return list of NetMagDao objects
   */
  public List<NetMagDao> retrieveNetMagDaoListForOriginId(long originId) {

    return retrieveRecordsById(
        NetMagDao.class, netMagDaoRt -> netMagDaoRt.get(ORIGIN_ID_FIELD), originId);
  }

  /**
   * Retrieve the StamagDaos associated with the given Origin id.
   *
   * @param originId origin ID
   * @return list of StaMagDao objects
   */
  public List<StaMagDao> retrieveStamagDaoListForOriginId(long originId) {

    return retrieveRecordsById(
        StaMagDao.class, stamagDaoRt -> stamagDaoRt.get(ORIGIN_ID_FIELD), originId);
  }

  /**
   * Retrieve a set of records of the given type that have the given id.
   *
   * @param recordClass The record class that represents the type of records to query
   * @param idPathGenerator lambda that takes a JPA root and returns a JPA path, used to identify
   *     the field to compare to.
   * @param id The ID to query for
   * @param <T> The type of the return record
   * @param <K> the type of the ID
   * @return List of records that match the ID.
   */
  private <T, K> List<T> retrieveRecordsById(
      Class<T> recordClass, Function<Root<T>, Path<K>> idPathGenerator, K id) {

    var idMessage = String.format("id = %s", id);
    EntityResultListFunction<T> delegateFunction =
        entityManager -> {
          var criteriaBuilder = entityManager.getCriteriaBuilder();

          var query = criteriaBuilder.createQuery(recordClass);
          var daoRt = query.from(recordClass);

          query.select(daoRt);

          query.where(criteriaBuilder.equal(idPathGenerator.apply(daoRt), id));

          return entityManager.createQuery(query).getResultList();
        };

    return runWithEntityManagerResultListFunction(delegateFunction, RECORDS_BY_ID_ERROR, idMessage);
  }
}
