package gms.shared.stationdefinition.database.connector;

import gms.shared.stationdefinition.dao.css.AffiliationDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class AffiliationDatabaseConnector extends DatabaseConnector {

  private static final String NETWORK_STATION_TIME_KEY = "networkStationTimeKey";
  private static final String NETWORK = "network";
  private static final String TIME = "time";
  private static final String END_TIME = "endTime";

  private static final Logger LOGGER = LoggerFactory.getLogger(AffiliationDatabaseConnector.class);

  static final String AFFILIATION_NAMES_AFTER_TIME_ERROR =
      "Affiliation by names and after time exception";
  static final String AFFILIATION_NAMES_EFFECTIVE_TIME_ERROR =
      "Affiliation by names and after time exception";
  static final String AFFILIATION_NAMES_TIME_RANGE_ERROR =
      "Affiliation by names and time range exception";
  static final String AFFILIATION_TIME_RANGE_ERROR = "Affiliation by time range exception";

  static final String NAMES_AFTER_TIME_MESSAGE = "names size %s, after time %s";
  static final String NAMES_EFFECTIVE_TIME_MESSAGE = "names size %s, effective time %s";
  static final String NAMES_TIME_RANGE_MESSAGE = "names size %s, time range %s - %s";
  static final String TIME_RANGE_MESSAGE = "time range %s - %s";

  @Autowired
  public AffiliationDatabaseConnector(
      @Qualifier("oracle") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public List<AffiliationDao> findNextAffiliationByNameAfterTime(
      Collection<String> networkNames, Instant effectiveTime) {

    if (effectiveTime == null || networkNames == null || networkNames.isEmpty()) {
      LOGGER.debug(
          "Request for Affiliation by name was given an empty list of network names or invalid"
              + " effective time");
      return new ArrayList<>();
    } else {
      var errMessage = String.format(NAMES_AFTER_TIME_MESSAGE, networkNames.size(), effectiveTime);
      return runPartitionedQuery(
          networkNames,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<AffiliationDao> delegateFunc =
                (EntityManager entityManager) ->
                    buildDelegateFunction(entityManager, partition, effectiveTime);

            return runWithEntityManagerResultListFunction(
                delegateFunc, AFFILIATION_NAMES_AFTER_TIME_ERROR, errMessage);
          });
    }
  }

  private static List<AffiliationDao> buildDelegateFunction(
      EntityManager entityManager, Collection<String> partition, Instant effectiveTime) {
    CriteriaBuilder cb = entityManager.getCriteriaBuilder();

    CriteriaQuery<AffiliationDao> query = cb.createQuery(AffiliationDao.class);
    Root<AffiliationDao> fromAffiliation = query.from(AffiliationDao.class);
    query.select(fromAffiliation);

    Subquery<Instant> subQuery = query.subquery(Instant.class);
    Root<AffiliationDao> subRoot = subQuery.from(AffiliationDao.class);
    subQuery.where(
        cb.and(
            cb.equal(
                fromAffiliation.get(NETWORK_STATION_TIME_KEY).get(NETWORK),
                subRoot.get(NETWORK_STATION_TIME_KEY).get(NETWORK)),
            subRoot.get(NETWORK_STATION_TIME_KEY).get(NETWORK).in(partition),
            cb.greaterThan(subRoot.get(NETWORK_STATION_TIME_KEY).get(TIME), effectiveTime)));

    Subquery<Instant> subSelect =
        subQuery.select(cb.least(subRoot.get(NETWORK_STATION_TIME_KEY).<Instant>get(TIME)));
    query.where(cb.equal(fromAffiliation.get(NETWORK_STATION_TIME_KEY).get(TIME), subSelect));

    return entityManager.createQuery(query).getResultList();
  }

  public List<AffiliationDao> findAffiliationsByNameAndTime(
      Collection<String> networkNames, Instant effectiveTime) {

    if (effectiveTime == null || networkNames == null || networkNames.isEmpty()) {
      LOGGER.debug(
          "Request for Affiliation by name was given an empty list of network names or invalid"
              + " effective time");
      return new ArrayList<>();
    } else {
      var errMessage =
          String.format(NAMES_EFFECTIVE_TIME_MESSAGE, networkNames.size(), effectiveTime);
      return runPartitionedQuery(
          networkNames,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<AffiliationDao> delegateFunc =
                (EntityManager entityManager) -> {
                  CriteriaBuilder cb = entityManager.getCriteriaBuilder();
                  CriteriaQuery<AffiliationDao> query = cb.createQuery(AffiliationDao.class);
                  Root<AffiliationDao> fromAffiliation = query.from(AffiliationDao.class);

                  query.select(fromAffiliation);

                  query.where(
                      cb.and(
                          fromAffiliation.get(NETWORK_STATION_TIME_KEY).get(NETWORK).in(partition),
                          cb.lessThanOrEqualTo(
                              fromAffiliation.get(NETWORK_STATION_TIME_KEY).get(TIME),
                              effectiveTime),
                          cb.greaterThanOrEqualTo(fromAffiliation.get(END_TIME), effectiveTime)));

                  return entityManager.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, AFFILIATION_NAMES_EFFECTIVE_TIME_ERROR, errMessage);
          });
    }
  }

  public List<AffiliationDao> findAffiliationsByNameAndTimeRange(
      Collection<String> networkNames, Instant startTime, Instant endTime) {

    if (startTime == null || endTime == null || networkNames == null || networkNames.isEmpty()) {
      LOGGER.debug(
          "Request for Affiliation by name was given an empty list of network names or invalid time"
              + " range parameters");
      return new ArrayList<>();
    } else {
      var errMessage =
          String.format(NAMES_TIME_RANGE_MESSAGE, networkNames.size(), startTime, endTime);
      return runPartitionedQuery(
          networkNames,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<AffiliationDao> delegateFunc =
                (EntityManager entityManager) -> {
                  CriteriaBuilder cb = entityManager.getCriteriaBuilder();
                  CriteriaQuery<AffiliationDao> query = cb.createQuery(AffiliationDao.class);
                  Root<AffiliationDao> fromAffiliation = query.from(AffiliationDao.class);

                  query.select(fromAffiliation);

                  query.where(
                      cb.and(
                          fromAffiliation.get(NETWORK_STATION_TIME_KEY).get(NETWORK).in(partition),
                          cb.greaterThanOrEqualTo(fromAffiliation.get(END_TIME), startTime),
                          cb.lessThanOrEqualTo(
                              fromAffiliation.get(NETWORK_STATION_TIME_KEY).get(TIME), endTime)));

                  return entityManager.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, AFFILIATION_NAMES_TIME_RANGE_ERROR, errMessage);
          });
    }
  }

  public Collection<AffiliationDao> findAffiliationsByTimeRange(
      Instant startTime, Instant endTime) {
    var errorMessage = String.format(TIME_RANGE_MESSAGE, startTime, endTime);
    EntityResultListFunction<AffiliationDao> delegateFunc =
        (EntityManager entityManager) -> {
          CriteriaBuilder cb = entityManager.getCriteriaBuilder();
          CriteriaQuery<AffiliationDao> query = cb.createQuery(AffiliationDao.class);
          Root<AffiliationDao> fromAffiliation = query.from(AffiliationDao.class);

          query.select(fromAffiliation);

          query.where(
              cb.and(
                  cb.greaterThanOrEqualTo(fromAffiliation.get(END_TIME), startTime),
                  cb.lessThanOrEqualTo(
                      fromAffiliation.get(NETWORK_STATION_TIME_KEY).get(TIME), endTime)));

          return entityManager.createQuery(query).getResultList();
        };

    return runWithEntityManagerResultListFunction(
        delegateFunc, AFFILIATION_TIME_RANGE_ERROR, errorMessage);
  }
}
