package gms.shared.stationdefinition.database.connector;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.dao.css.SiteChanAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import gms.shared.utilities.bridge.database.connector.EntitySingleResultFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class SiteChanDatabaseConnector extends DatabaseConnector {

  private static final String ID = "id";
  private static final String STATION_CODE = "stationCode";
  private static final String CHANNEL_CODE = "channelCode";
  private static final String ON_DATE = "onDate";
  private static final String OFF_DATE = "offDate";

  private static final Logger LOGGER = LoggerFactory.getLogger(SiteChanDatabaseConnector.class);

  private static final String MISSING_KEY_SET_ERROR =
      "Request for SiteChan by SiteChanKey was must be given a list of keys";
  private static final String MISSING_END_TIME_ERROR =
      "Request for SiteChan by time range was must be given a end time";
  static final String MISSING_START_TIME_ERROR =
      "Request for SiteChan by time range was must be given a start time";
  static final String MISSING_STATION_CODES_ERROR =
      "Request for SiteChan by station codes was must be given a list of station codes";

  static final String SITE_CHAN_KEY_ERROR = "Site chan by site chan key exception";
  static final String SITE_CHAN_TIME_RANGE_ERROR = "Site chan by time range exception";
  static final String SITE_CHAN_KEYS_EFFECTIVE_TIME_ERROR = "Site chan by keys and time exception";
  static final String SITE_CHAN_CODES_EFFECTIVE_TIME_ERROR =
      "Site chan by codes and time exception";
  static final String SITE_CHAN_KEYS_TIME_RANGE_ERROR =
      "Site chan by keys and time range exception";
  static final String SITE_CHAN_CODES_TIME_RANGE_ERROR =
      "Site chan by codes and time range exception";

  static final String SITE_CHAN_SURROUNDING_DATES_CODES_TIME_ERROR =
      "Site chan surround dates by codes and time exception";
  static final String SITE_CHAN_SURROUNDING_DATES_CODES_TIME_RANGE_ERROR =
      "Site chan surround dates by codes and time rnage exception";
  static final String SITE_CHAN_SURROUNDING_DATES_KEYS_TIME_ERROR =
      "Site chan surround dates by keys and time exception";
  static final String SITE_CHAN_SURROUNDING_DATES_KEYS_TIME_RANGE_ERROR =
      "Site chan surround dates by keys and time range exception";

  static final String SITE_CHAN_KEY_MESSAGE = "Sitechan key %s";
  static final String SITE_CHAN_TIME_RANGE_MESSAGE = "Sitechan by time range %s - %s";
  static final String SITE_CHAN_KEYS_EFFECTIVE_TIME_MESSAGE = "Sitechan keys %s, time %s";
  static final String SITE_CHAN_CODES_TIME_MESSAGE = "Sitechan codes %s, time %s";
  static final String SITE_CHAN_KEYS_TIME_RANGE_MESSAGE = "Sitechan keys %s, time range %s - %s";
  static final String SITE_CHAN_CODES_TIME_RANGE_MESSAGE = "Sitechan codes %s, time range %s - %s";

  static final String SITE_CHAN_SURROUNDING_DATES_CODES_TIME_MESSAGE = "codes %s and time %s";
  static final String SITE_CHAN_SURROUNDING_DATES_CODES_TIME_RANGE_MESSAGE =
      "codes %s and time range %s - %s";
  static final String SITE_CHAN_SURROUNDING_DATES_KEYS_TIME_MESSAGE = "keys %s and time %s";
  static final String SITE_CHAN_SURROUNDING_DATES_KEYS_TIME_RANGE_MESSAGE =
      "keys %s and time range %s - %s";

  @Autowired
  public SiteChanDatabaseConnector(@Qualifier("oracle") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public Optional<SiteChanDao> findSiteChan(SiteChanKey siteChanKey) {
    Validate.notNull(siteChanKey, "Request for SiteChan by SiteChanKey was must be given a key");

    final var stationCode = siteChanKey.getStationCode();
    final var channelCode = siteChanKey.getChannelCode();
    final var onDate = siteChanKey.getOnDate();

    var errMessage = String.format(SITE_CHAN_KEY_MESSAGE, siteChanKey.toString());
    EntitySingleResultFunction<SiteChanDao> delegateFunc =
        (EntityManager em) -> {
          var cb = em.getCriteriaBuilder();
          CriteriaQuery<SiteChanDao> query = cb.createQuery(SiteChanDao.class);
          Root<SiteChanDao> fromSiteChan = query.from(SiteChanDao.class);

          query.select(fromSiteChan);

          final Path<Object> channelId = fromSiteChan.get(ID);
          query.where(
              cb.and(
                  cb.equal(channelId.get(STATION_CODE), stationCode),
                  cb.equal(channelId.get(CHANNEL_CODE), channelCode),
                  cb.equal(channelId.get(ON_DATE), onDate)));

          return em.createQuery(query).getSingleResult();
        };

    return runWithEntityManagerSingleResultFunction(delegateFunc, SITE_CHAN_KEY_ERROR, errMessage);
  }

  public List<SiteChanDao> findSiteChansByStationCodeAndTime(
      Collection<String> stationCodes, Instant effectiveTime) {
    Objects.requireNonNull(stationCodes);
    Objects.requireNonNull(effectiveTime);

    var errMessage =
        String.format(SITE_CHAN_CODES_TIME_MESSAGE, stationCodes.size(), effectiveTime);
    if (stationCodes.isEmpty()) {
      LOGGER.debug("Request for SiteChan by name was given an empty list of station codes");
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          stationCodes,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteChanDao> delegateFunc =
                (EntityManager em) -> {
                  var builder = em.getCriteriaBuilder();
                  CriteriaQuery<SiteChanDao> query = builder.createQuery(SiteChanDao.class);
                  Root<SiteChanDao> fromSiteChan = query.from(SiteChanDao.class);
                  query
                      .select(fromSiteChan)
                      .where(
                          builder.and(
                              fromSiteChan.get(ID).get(STATION_CODE).in(partition),
                              builder.lessThanOrEqualTo(
                                  fromSiteChan.get(ID).get(ON_DATE), effectiveTime),
                              builder.greaterThanOrEqualTo(
                                  fromSiteChan.get(OFF_DATE), effectiveTime)));

                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITE_CHAN_CODES_EFFECTIVE_TIME_ERROR, errMessage);
          });
    }
  }

  public List<SiteChanDao> findSiteChansByStationCodeAndTimeRange(
      Collection<String> stationCodes, Instant startTime, Instant endTime) {

    Objects.requireNonNull(stationCodes, MISSING_STATION_CODES_ERROR);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Preconditions.checkState(endTime.isAfter(startTime));

    var errMessage =
        String.format(SITE_CHAN_CODES_TIME_RANGE_MESSAGE, stationCodes.size(), startTime, endTime);
    if (stationCodes.isEmpty()) {
      LOGGER.debug(MISSING_STATION_CODES_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          stationCodes,
          400,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteChanDao> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<SiteChanDao> query = cb.createQuery(SiteChanDao.class);
                  Root<SiteChanDao> fromSiteChan = query.from(SiteChanDao.class);

                  final Path<Object> idPath = fromSiteChan.get(ID);
                  query.select(fromSiteChan);
                  query.where(
                      cb.and(
                          idPath.get(STATION_CODE).in(partition),
                          cb.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), startTime),
                          cb.lessThanOrEqualTo(idPath.get(ON_DATE), endTime)));

                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITE_CHAN_CODES_TIME_RANGE_ERROR, errMessage);
          });
    }
  }

  public List<SiteChanDao> findSiteChansByNameAndTimeRange(
      Collection<SiteChanKey> siteChanKeys, Instant startTime, Instant endTime) {

    Validate.notNull(siteChanKeys, MISSING_KEY_SET_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    var errMessage =
        String.format(SITE_CHAN_KEYS_TIME_RANGE_MESSAGE, siteChanKeys.size(), startTime, endTime);
    if (siteChanKeys.isEmpty()) {
      LOGGER.debug(MISSING_KEY_SET_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          siteChanKeys,
          250,
          (Collection<SiteChanKey> keySublist) -> {
            EntityResultListFunction<SiteChanDao> delegateFunc =
                (EntityManager em) -> buildSiteChanDelegate(em, keySublist, startTime, endTime);

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITE_CHAN_KEYS_TIME_RANGE_ERROR, errMessage);
          });
    }
  }

  public List<SiteChanDao> findSiteChansByTimeRange(Instant startTime, Instant endTime) {

    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    var errMessage = String.format(SITE_CHAN_TIME_RANGE_MESSAGE, startTime, endTime);
    EntityResultListFunction<SiteChanDao> delegateFunc =
        (EntityManager em) -> {
          var cb = em.getCriteriaBuilder();
          CriteriaQuery<SiteChanDao> query = cb.createQuery(SiteChanDao.class);
          Root<SiteChanDao> fromSiteChan = query.from(SiteChanDao.class);

          final Path<Object> idPath = fromSiteChan.get(ID);
          query.select(fromSiteChan);
          query.where(
              cb.and(
                  cb.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), startTime),
                  cb.lessThanOrEqualTo(idPath.get(ON_DATE), endTime)));

          return em.createQuery(query).getResultList();
        };

    return runWithEntityManagerResultListFunction(
        delegateFunc, SITE_CHAN_TIME_RANGE_ERROR, errMessage);
  }

  public List<SiteChanDao> findSiteChansByKeyAndTime(
      List<SiteChanKey> siteChanKeys, Instant effectiveAt) {
    Objects.requireNonNull(siteChanKeys);
    Objects.requireNonNull(effectiveAt);

    if (siteChanKeys.isEmpty()) {
      LOGGER.debug(MISSING_KEY_SET_ERROR);
      return List.of();
    }

    var errMessage =
        String.format(SITE_CHAN_KEYS_EFFECTIVE_TIME_MESSAGE, siteChanKeys.size(), effectiveAt);
    return runPartitionedQuery(
        siteChanKeys,
        500,
        (Collection<SiteChanKey> keySublist) -> {
          EntityResultListFunction<SiteChanDao> delegateFunc =
              (EntityManager em) -> buildSiteChanDelegate(em, keySublist, effectiveAt, effectiveAt);

          return runWithEntityManagerResultListFunction(
              delegateFunc, SITE_CHAN_KEYS_EFFECTIVE_TIME_ERROR, errMessage);
        });
  }

  private static List<SiteChanDao> buildSiteChanDelegate(
      EntityManager em, Collection<SiteChanKey> keySublist, Instant startTime, Instant endTime) {
    var cb = em.getCriteriaBuilder();
    var query = cb.createQuery(SiteChanDao.class);
    Root<SiteChanDao> fromSiteChan = query.from(SiteChanDao.class);
    Path<Object> idPath = fromSiteChan.get(ID);

    query.select(fromSiteChan);
    query.where(
        cb.or(
            keySublist.stream()
                .map(
                    key ->
                        cb.and(
                            cb.equal(idPath.get(STATION_CODE), key.getStationCode()),
                            cb.equal(idPath.get(CHANNEL_CODE), key.getChannelCode()),
                            cb.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), startTime),
                            cb.lessThanOrEqualTo(idPath.get(ON_DATE), endTime)))
                .toArray(Predicate[]::new)));

    return em.createQuery(query).getResultList();
  }

  // SiteChanAndSurroundingDates queries
  public List<SiteChanAndSurroundingDates> findSiteChansAndSurroundingDatesByStationCodeAndTime(
      Collection<String> stationCodes, Instant effectiveAt) {
    Validate.notNull(stationCodes, MISSING_STATION_CODES_ERROR);
    Validate.notNull(effectiveAt, MISSING_START_TIME_ERROR);

    var errMessage =
        String.format(
            SITE_CHAN_SURROUNDING_DATES_CODES_TIME_MESSAGE, stationCodes.size(), effectiveAt);
    if (stationCodes.isEmpty()) {
      LOGGER.debug(MISSING_STATION_CODES_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          stationCodes,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteChanAndSurroundingDates> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<SiteChanAndSurroundingDates> siteChanQuery =
                      cb.createQuery(SiteChanAndSurroundingDates.class);

                  // site chan dao query from main site chan and surrounding dates
                  Root<SiteChanDao> fromSiteChan = siteChanQuery.from(SiteChanDao.class);

                  var predicate =
                      cb.and(
                          fromSiteChan.get(ID).get(STATION_CODE).in(partition),
                          cb.lessThanOrEqualTo(fromSiteChan.get(ID).get(ON_DATE), effectiveAt),
                          cb.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), effectiveAt));

                  var finalQuery = getStationCodeQuery(predicate, cb, siteChanQuery, fromSiteChan);

                  return em.createQuery(finalQuery).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITE_CHAN_SURROUNDING_DATES_CODES_TIME_ERROR, errMessage);
          });
    }
  }

  public List<SiteChanAndSurroundingDates>
      findSiteChansAndSurroundingDatesByStationCodeAndTimeRange(
          Collection<String> stationCodes, Instant startTime, Instant endTime) {
    Validate.notNull(stationCodes, MISSING_STATION_CODES_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    var errMessage =
        String.format(
            SITE_CHAN_SURROUNDING_DATES_CODES_TIME_RANGE_MESSAGE,
            stationCodes.size(),
            startTime,
            endTime);
    if (stationCodes.isEmpty()) {
      LOGGER.debug(MISSING_STATION_CODES_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          stationCodes,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteChanAndSurroundingDates> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<SiteChanAndSurroundingDates> siteChanQuery =
                      cb.createQuery(SiteChanAndSurroundingDates.class);

                  // site chan dao query from main site chan and surrounding dates
                  Root<SiteChanDao> fromSiteChan = siteChanQuery.from(SiteChanDao.class);

                  var predicate =
                      cb.and(
                          fromSiteChan.get(ID).get(STATION_CODE).in(partition),
                          cb.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), startTime),
                          cb.lessThanOrEqualTo(fromSiteChan.get(ID).get(ON_DATE), endTime));

                  var finalQuery = getStationCodeQuery(predicate, cb, siteChanQuery, fromSiteChan);

                  return em.createQuery(finalQuery).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITE_CHAN_SURROUNDING_DATES_CODES_TIME_RANGE_ERROR, errMessage);
          });
    }
  }

  public List<SiteChanAndSurroundingDates> findSiteChansAndSurroundingDatesByKeysAndTime(
      Collection<SiteChanKey> siteChanKeys, Instant effectiveAt) {

    Validate.notNull(siteChanKeys, MISSING_KEY_SET_ERROR);
    Validate.notNull(effectiveAt, MISSING_START_TIME_ERROR);

    if (siteChanKeys.isEmpty()) {
      LOGGER.debug(MISSING_KEY_SET_ERROR);
      return new ArrayList<>();
    }

    var errMessage =
        String.format(
            SITE_CHAN_SURROUNDING_DATES_KEYS_TIME_MESSAGE, siteChanKeys.size(), effectiveAt);
    return runPartitionedQuery(
        siteChanKeys,
        950,
        (Collection<SiteChanKey> partition) -> {
          EntityResultListFunction<SiteChanAndSurroundingDates> delegateFunc =
              (EntityManager em) ->
                  buildSiteChanAndSurroundingDatesDelegate(em, partition, effectiveAt, effectiveAt);

          return runWithEntityManagerResultListFunction(
              delegateFunc, SITE_CHAN_SURROUNDING_DATES_KEYS_TIME_ERROR, errMessage);
        });
  }

  public List<SiteChanAndSurroundingDates> findSiteChansAndSurroundingDatesByKeysAndTimeRange(
      Collection<SiteChanKey> siteChanKeys, Instant startTime, Instant endTime) {

    Validate.notNull(siteChanKeys, MISSING_KEY_SET_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    if (siteChanKeys.isEmpty()) {
      LOGGER.debug(MISSING_KEY_SET_ERROR);
      return new ArrayList<>();
    }

    var errMessage =
        String.format(
            SITE_CHAN_SURROUNDING_DATES_KEYS_TIME_RANGE_MESSAGE,
            siteChanKeys.size(),
            startTime,
            endTime);
    return runPartitionedQuery(
        siteChanKeys,
        950,
        (Collection<SiteChanKey> partition) -> {
          EntityResultListFunction<SiteChanAndSurroundingDates> delegateFunc =
              (EntityManager em) ->
                  buildSiteChanAndSurroundingDatesDelegate(em, partition, startTime, endTime);

          return runWithEntityManagerResultListFunction(
              delegateFunc, SITE_CHAN_SURROUNDING_DATES_KEYS_TIME_RANGE_ERROR, errMessage);
        });
  }

  private static List<SiteChanAndSurroundingDates> buildSiteChanAndSurroundingDatesDelegate(
      EntityManager em, Collection<SiteChanKey> partition, Instant startTime, Instant endTime) {

    var cb = em.getCriteriaBuilder();
    var siteChanQuery = cb.createQuery(SiteChanAndSurroundingDates.class);
    Root<SiteChanDao> fromSiteChan = siteChanQuery.from(SiteChanDao.class);

    var idPath = fromSiteChan.get(ID);

    var predicate =
        cb.and(
            cb.or(
                partition.stream()
                    .map(
                        key ->
                            cb.and(
                                cb.equal(idPath.get(STATION_CODE), key.getStationCode()),
                                cb.equal(idPath.get(CHANNEL_CODE), key.getChannelCode())))
                    .toArray(Predicate[]::new)),
            cb.greaterThanOrEqualTo(fromSiteChan.get(OFF_DATE), startTime),
            cb.lessThanOrEqualTo(idPath.get(ON_DATE), endTime));

    var finalQuery = getStationCodeQuery(predicate, cb, siteChanQuery, fromSiteChan);

    return em.createQuery(finalQuery).getResultList();
  }

  private static CriteriaQuery<SiteChanAndSurroundingDates> getStationCodeQuery(
      Predicate predicate,
      CriteriaBuilder cb,
      CriteriaQuery<SiteChanAndSurroundingDates> siteChanQuery,
      Root<SiteChanDao> fromSiteChan) {

    // previous off date query to return greatest previous off date
    Subquery<Instant> previousOffDateQuery = siteChanQuery.subquery(Instant.class);
    Root<SiteChanDao> subFromSiteChanOffDate = previousOffDateQuery.from(SiteChanDao.class);
    previousOffDateQuery
        .select(subFromSiteChanOffDate.<Instant>get(OFF_DATE))
        .where(
            cb.and(
                cb.equal(
                    subFromSiteChanOffDate.get(ID).get(STATION_CODE),
                    fromSiteChan.get(ID).get(STATION_CODE)),
                cb.equal(
                    subFromSiteChanOffDate.get(ID).get(CHANNEL_CODE),
                    fromSiteChan.get(ID).get(CHANNEL_CODE)),
                cb.equal(subFromSiteChanOffDate.get(OFF_DATE), fromSiteChan.get(ID).get(ON_DATE))));

    // next on date query to return the least next on date
    Subquery<Instant> nextOnDateQuery = siteChanQuery.subquery(Instant.class);
    Root<SiteChanDao> subFromSiteChanOnDate = nextOnDateQuery.from(SiteChanDao.class);
    nextOnDateQuery
        .select(subFromSiteChanOnDate.get(ID).<Instant>get(ON_DATE))
        .where(
            cb.and(
                cb.equal(
                    subFromSiteChanOnDate.get(ID).get(STATION_CODE),
                    fromSiteChan.get(ID).get(STATION_CODE)),
                cb.equal(
                    subFromSiteChanOnDate.get(ID).get(CHANNEL_CODE),
                    fromSiteChan.get(ID).get(CHANNEL_CODE)),
                cb.equal(subFromSiteChanOnDate.get(ID).get(ON_DATE), fromSiteChan.get(OFF_DATE))));

    // main sitechan query select that implements all sub queries
    return siteChanQuery
        .select(
            cb.construct(
                SiteChanAndSurroundingDates.class,
                fromSiteChan,
                previousOffDateQuery,
                nextOnDateQuery))
        .where(predicate);
  }
}
