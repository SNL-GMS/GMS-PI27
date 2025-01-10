package gms.shared.stationdefinition.database.connector;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import gms.shared.utilities.bridge.database.connector.EntitySingleResultFunction;
import gms.shared.utilities.bridge.database.converter.NegativeNaInstantToDoubleConverter;
import gms.shared.utilities.bridge.database.converter.PositiveNaInstantToDoubleConverter;
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
public class SensorDatabaseConnector extends DatabaseConnector {

  private static final String SENSOR_KEY = "sensorKey";
  private static final String STATION = "station";
  private static final String CHANNEL = "channel";
  private static final String CHANNEL_ID = "channelId";
  private static final String TIME = "time";
  private static final String END_TIME = "endTime";
  private static final String T_SHIFT = "tShift";

  private static final Logger LOGGER = LoggerFactory.getLogger(SensorDatabaseConnector.class);

  static final String SENSORS_KEY_TIME_ERROR = "Sensors by key and time exception";
  static final String SENSORS_KEY_RANGE_ERROR = "Sensors by key in range exception";
  static final String SENSORS_IDS_TIME_RANGE_ERROR = "Sensors by ids and time range exception";
  static final String SENSORS_IDS_TIME_ERROR = "Sensors by ids and time exception";

  static final String KEY_RANGE_MESSAGE = "%s:%s for %s - %s";
  static final String IDS_TIME_RANGE_MESSAGE = "size %s for %s - %s";
  static final String IDS_TIME_MESSAGE = "size %s for %s";

  @Autowired
  public SensorDatabaseConnector(@Qualifier("oracle") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public Optional<SensorDao> findSensorByKeyInRange(
      String station, String channel, Instant startTime, Instant endTime) {

    Objects.requireNonNull(station, "Station cannot be null");
    Objects.requireNonNull(channel, "Channel cannot be null");
    Objects.requireNonNull(startTime, "Start time cannot be null");
    Objects.requireNonNull(endTime, "End time cannot be null");
    Preconditions.checkState(!startTime.isAfter(endTime), "Start time cannot be after end time");

    var errMessage = String.format(KEY_RANGE_MESSAGE, station, channel, startTime, endTime);
    EntitySingleResultFunction<SensorDao> delegateFunc =
        (EntityManager em) -> {
          var builder = em.getCriteriaBuilder();
          var query = builder.createQuery(SensorDao.class);
          var fromSensor = query.from(SensorDao.class);
          var sensorKey = fromSensor.get(SENSOR_KEY);
          query
              .select(fromSensor)
              .where(
                  builder.and(
                      builder.equal(sensorKey.get(STATION), station),
                      builder.equal(sensorKey.get(CHANNEL), channel),
                      builder.lessThanOrEqualTo(sensorKey.get(TIME), endTime),
                      builder.greaterThanOrEqualTo(sensorKey.get(END_TIME), startTime)));
          query.orderBy(builder.desc(sensorKey.get(TIME)));

          return em.createQuery(query).setMaxResults(1).getSingleResult();
        };

    return runWithEntityManagerSingleResultFunction(
        delegateFunc, SENSORS_KEY_RANGE_ERROR, errMessage);
  }

  public List<SensorDao> findSensorsByChannelIdAndTimeRange(
      Collection<Long> channelIds, Instant startTime, Instant endTime) {
    Objects.requireNonNull(channelIds);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Preconditions.checkState(startTime.isBefore(endTime));

    var errMessage = String.format(IDS_TIME_RANGE_MESSAGE, channelIds.size(), startTime, endTime);
    if (channelIds.isEmpty()) {
      LOGGER.debug("Request for Sensor by name was given an empty list of channel ids");
      return List.of();
    } else {
      return runPartitionedQuery(
          channelIds,
          950,
          (Collection<Long> channelIdSublist) -> {
            EntityResultListFunction<SensorDao> delegateFunc =
                (EntityManager em) -> {
                  var builder = em.getCriteriaBuilder();
                  CriteriaQuery<SensorDao> query = builder.createQuery(SensorDao.class);
                  Root<SensorDao> fromSensor = query.from(SensorDao.class);
                  query
                      .select(fromSensor)
                      .where(
                          builder.and(fromSensor.get(CHANNEL_ID).in(channelIdSublist)),
                          builder.lessThanOrEqualTo(fromSensor.get(SENSOR_KEY).get(TIME), endTime),
                          builder.greaterThanOrEqualTo(
                              fromSensor.get(SENSOR_KEY).get(END_TIME), startTime));

                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SENSORS_IDS_TIME_RANGE_ERROR, errMessage);
          });
    }
  }

  /**
   * Finds all {@link SensorDao}s for siteChanKeys, starting at effectiveTime that have the same
   * Response version info. Response Versions look at calib and calper fields
   *
   * @param siteChanKeys
   * @param effectiveTime
   * @return List of all Sensor for the supplied siteChanKeys that create a version starting at
   *     effectiveTime
   */
  public List<SensorDao> findSensorVersionsByNameAndTime(
      List<SiteChanKey> siteChanKeys, Instant effectiveTime) {
    Objects.requireNonNull(siteChanKeys);
    Objects.requireNonNull(effectiveTime);

    var errMessage = String.format(IDS_TIME_MESSAGE, siteChanKeys.size(), effectiveTime);
    if (siteChanKeys.isEmpty()) {
      LOGGER.debug("findNextSensorVersionByNameAndTime was given an empty list of SiteChanKeys");
      return List.of();
    } else {
      return runPartitionedQuery(
          siteChanKeys,
          500,
          keySubList ->
              runWithEntityManagerResultListFunction(
                  entityManager ->
                      findSensorVersionsByNameAndTime(entityManager, keySubList, effectiveTime),
                  SENSORS_IDS_TIME_ERROR,
                  errMessage));
    }
  }

  private static List<SensorDao> findSensorVersionsByNameAndTime(
      EntityManager entityManager, Collection<SiteChanKey> siteChanKeys, Instant effectiveTime) {
    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<SensorDao> query = cb.createQuery(SensorDao.class);
    Root<SensorDao> from = query.from(SensorDao.class);

    query
        .select(from)
        .where(
            cb.and(
                in(cb, from, siteChanKeys),
                cb.greaterThanOrEqualTo(
                    from.get(SENSOR_KEY).get(TIME).as(Double.class),
                    floorEndTime(cb, query, from, effectiveTime)),
                cb.lessThanOrEqualTo(
                    from.get(SENSOR_KEY).get(END_TIME).as(Double.class),
                    ceilTime(cb, query, from, effectiveTime))));

    return entityManager.createQuery(query).getResultList();
  }

  private static Predicate in(
      CriteriaBuilder cb, Root<SensorDao> from, Collection<SiteChanKey> siteChanKeys) {
    return cb.or(
        siteChanKeys.stream()
            .map(
                siteChanKey ->
                    cb.and(
                        cb.equal(from.get(SENSOR_KEY).get(STATION), siteChanKey.getStationCode()),
                        cb.equal(from.get(SENSOR_KEY).get(CHANNEL), siteChanKey.getChannelCode())))
            .toArray(Predicate[]::new));
  }

  private static Subquery<Double> floorEndTime(
      CriteriaBuilder cb,
      CriteriaQuery<SensorDao> query,
      Root<SensorDao> from,
      Instant effectiveTime) {
    Subquery<Double> subquery = query.subquery(Double.class);
    Root<SensorDao> subFrom = subquery.from(SensorDao.class);

    var coalesce = cb.<Double>coalesce();
    coalesce.value(cb.greatest(subFrom.get(SENSOR_KEY).<Instant>get(END_TIME)).as(Double.class));
    coalesce.value(NegativeNaInstantToDoubleConverter.NA_VALUE);

    subquery
        .select(coalesce)
        .where(
            cb.and(
                cb.equal(subFrom.get(SENSOR_KEY).get(STATION), from.get(SENSOR_KEY).get(STATION)),
                cb.equal(subFrom.get(SENSOR_KEY).get(CHANNEL), from.get(SENSOR_KEY).get(CHANNEL)),
                cb.lessThanOrEqualTo(subFrom.get(SENSOR_KEY).get(TIME), effectiveTime),
                cb.notEqual(subFrom.get(T_SHIFT), from.get(T_SHIFT))));

    return subquery;
  }

  private static Subquery<Double> ceilTime(
      CriteriaBuilder cb,
      CriteriaQuery<SensorDao> query,
      Root<SensorDao> from,
      Instant effectiveTime) {
    Subquery<Double> subquery = query.subquery(Double.class);
    Root<SensorDao> subFrom = subquery.from(SensorDao.class);

    var coalesce = cb.<Double>coalesce();
    coalesce.value(cb.least(subFrom.get(SENSOR_KEY).<Instant>get(TIME)).as(Double.class));
    coalesce.value(PositiveNaInstantToDoubleConverter.NA_VALUE);

    subquery
        .select(coalesce)
        .where(
            cb.and(
                cb.equal(subFrom.get(SENSOR_KEY).get(STATION), from.get(SENSOR_KEY).get(STATION)),
                cb.equal(subFrom.get(SENSOR_KEY).get(CHANNEL), from.get(SENSOR_KEY).get(CHANNEL)),
                cb.greaterThanOrEqualTo(subFrom.get(SENSOR_KEY).get(END_TIME), effectiveTime),
                cb.notEqual(subFrom.get(T_SHIFT), from.get(T_SHIFT))));

    return subquery;
  }

  public List<SensorDao> findSensorsByKeyAndTime(
      List<SiteChanKey> siteChanKeys, Instant effectiveAt) {

    Objects.requireNonNull(siteChanKeys);
    Objects.requireNonNull(effectiveAt);

    if (siteChanKeys.isEmpty()) {
      LOGGER.debug(
          "Request for Sensor by SiteChanKeys and effective at time "
              + "was given an empty list of SiteChanKeys");
      return List.of();
    }

    var errMessage = String.format(IDS_TIME_MESSAGE, siteChanKeys.size(), effectiveAt);
    return runPartitionedQuery(
        siteChanKeys,
        500,
        (Collection<SiteChanKey> keySubList) -> {
          EntityResultListFunction<SensorDao> delegateFunc =
              (EntityManager em) -> buildDelegateFunction(em, keySubList, effectiveAt, effectiveAt);

          return runWithEntityManagerResultListFunction(
              delegateFunc, SENSORS_KEY_TIME_ERROR, errMessage);
        });
  }

  public List<SensorDao> findSensorsByKeyAndTimeRange(
      List<SiteChanKey> siteChanKeys, Instant startTime, Instant endTime) {

    Validate.notNull(
        siteChanKeys, "Request for Sensors by time range must be given list of SiteChanKeys");
    Validate.notNull(startTime, "Request for Sensors by time range was must be given a start time");
    Validate.notNull(endTime, "Request for Sensors by time range was must be given a end time");

    var errMessage = String.format(IDS_TIME_RANGE_MESSAGE, siteChanKeys.size(), startTime, endTime);
    if (siteChanKeys.isEmpty()) {
      LOGGER.debug("Request for Sensors by key and timer range was given an empty list of keys");
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          siteChanKeys,
          250,
          (Collection<SiteChanKey> keySubList) -> {
            EntityResultListFunction<SensorDao> delegateFunc =
                (EntityManager em) -> buildDelegateFunction(em, keySubList, startTime, endTime);
            return runWithEntityManagerResultListFunction(
                delegateFunc, SENSORS_IDS_TIME_RANGE_ERROR, errMessage);
          });
    }
  }

  private List<SensorDao> buildDelegateFunction(
      EntityManager em, Collection<SiteChanKey> keySubList, Instant startTime, Instant endTime) {
    var cb = em.getCriteriaBuilder();
    CriteriaQuery<SensorDao> query = cb.createQuery(SensorDao.class);
    Root<SensorDao> fromSensor = query.from(SensorDao.class);

    final Path<Object> id = fromSensor.get(SENSOR_KEY);
    query.select(fromSensor);
    query
        .where(
            cb.and(
                cb.greaterThanOrEqualTo(id.get(END_TIME), startTime),
                cb.lessThanOrEqualTo(id.get(TIME), endTime),
                cb.or(
                    keySubList.stream()
                        .map(
                            k ->
                                cb.and(
                                    cb.equal(id.get(STATION), k.getStationCode()),
                                    cb.equal(id.get(CHANNEL), k.getChannelCode())))
                        .toArray(Predicate[]::new))))
        .orderBy(cb.asc(fromSensor.get(SENSOR_KEY).get(TIME)));

    return em.createQuery(query).getResultList();
  }

  /**
   * subquery to compare specific attributes (columns) to find changes
   *
   * @param cb
   * @param query
   * @param k
   * @param property
   * @param effectiveTime
   * @return subquery to be used in parent query
   */
  private static Subquery<Float> getVersionAttributes(
      CriteriaBuilder cb,
      CriteriaQuery<SensorDao> query,
      SiteChanKey k,
      String property,
      Instant effectiveTime) {
    Subquery<Float> subquery = query.subquery(Float.class);
    Root<SensorDao> sensor = subquery.from(SensorDao.class);

    subquery
        .select(sensor.get(property))
        .where(
            cb.equal(sensor.get(SENSOR_KEY).get(STATION), k.getStationCode()),
            cb.equal(sensor.get(SENSOR_KEY).get(CHANNEL), k.getChannelCode()),
            cb.greaterThanOrEqualTo(sensor.get(SENSOR_KEY).get(END_TIME), effectiveTime),
            cb.lessThanOrEqualTo(sensor.get(SENSOR_KEY).get(TIME), effectiveTime));

    return subquery;
  }
}
