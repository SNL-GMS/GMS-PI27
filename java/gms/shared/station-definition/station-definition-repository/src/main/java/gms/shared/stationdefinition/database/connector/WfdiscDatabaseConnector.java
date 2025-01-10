package gms.shared.stationdefinition.database.connector;

import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.StationChannelTimeKey;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.WfTagKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.SegType;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Tuple;
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
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class WfdiscDatabaseConnector extends DatabaseConnector {

  static final String EMPTY_CHANNEL_NAME_LIST_ERROR =
      "Request for Wfdisc by SiteChanKey must be given a list of keys";
  static final String MISSING_START_TIME_ERROR =
      "Request for Wfdisc by time range must be given a start time";
  static final String MISSING_END_TIME_ERROR =
      "Request for Wfdisc by time range must be given a end time";
  static final String START_NOT_BEFORE_END_TIME_ERROR = "Start time has to be before end time";
  static final String EMPTY_WFID_LIST_ERROR =
      "Request for Wftag by ids must be given a list of wfids";
  static final String EMPTY_LIST_OF_KEYS_ERROR =
      "Request for Wfdisc by name was given an empty list of keys";

  private static final String ID = "id";
  private static final String WFTAG_KEY = "wfTagKey";
  private static final String TAGNAME = "tagName";
  private static final String STATION_CODE = "stationCode";
  private static final String CHANNEL_CODE = "channelCode";
  private static final String SEG_TYPE = "segType";
  private static final String TIME = "time";
  private static final String END_TIME = "endTime";
  private static final String LOAD_DATE = "loadDate";
  private static final String CALIB = "calib";
  private static final String CALPER = "calper";
  private static final int PARTITIONS_SIZE = 250;
  private static final int STATION_INDEX = 0;
  private static final int CHANNEL_INDEX = 1;
  private static final int TIME_INDEX = 2;

  private static final Logger LOGGER = LoggerFactory.getLogger(WfdiscDatabaseConnector.class);

  static final String WFDISCS_BY_WFIDS_ERROR = "Wfdiscs by wfids exception";
  static final String WFDISCS_BY_SITECHAN_KEYS_TIME_ERROR =
      "Wfdiscs by sitechan keys and time exception";
  static final String EMPTY_EVID_LIST_ERROR =
      "Request for wfids by ids must be given a list of tagIds";
  static final String WFDISCS_BY_SITECHAN_KEYS_ERROR = "Wfdiscs by sitechan keys exception";
  static final String WFDISCS_BY_TIME_RANGE_ERROR = "Wfdiscs by time range exception";
  static final String WFDISCS_BY_TIME_RANGE_CREATION_TIME_ERROR =
      "Wfdiscs by time range and creation time exception";
  static final String WFDISCS_BY_NAMES_TIME_ERROR = "Wfdiscs by station names and time exception";
  static final String WFDISCS_BY_SITECHAN_KEYS_TIME_RANGE_ERROR =
      "Wfdiscs by sitechan keys and time range exception";

  static final String WFDISCS_WFIDS_MESSAGE = "wfids size %s";
  static final String WFDISCS_EVIDS_MESSAGE = "evids size %s";
  static final String WFDISCS_BY_SITECHAN_KEYS_TIME_MESSAGE = "sitechan keys %s, time %s";
  static final String WFDISCS_BY_SITECHAN_KEYS_MESSAGE = "sitechan keys %s";
  static final String WFDISCS_BY_TIME_RANGE_MESSAGE = "time range %s - %s";
  static final String WFDISCS_BY_TIME_RANGE_CREATION_TIME_MESSAGE =
      "time range %s - %s, creation time %s";
  static final String WFDISCS_BY_NAMES_TIME_MESSAGE = "station names %s, time %s";
  static final String WFDISCS_BY_SITECHAN_KEYS_TIME_RANGE_MESSAGE =
      "sitechan keys %s, time range %s - %s";

  private static final TimerangeQueryBuilder BOUNDED_TIMERANGE_QUERY =
      (CriteriaBuilder cb,
          Collection<SiteChanKey> keySubList,
          Root<WfdiscDao> fromWfdisc,
          CriteriaQuery<WfdiscDao> query,
          EntityManager em,
          Instant effectiveTime) ->
          query.where(
              cb.or(
                  keySubList.stream()
                      .map(
                          k ->
                              cb.and(
                                  cb.equal(fromWfdisc.get(STATION_CODE), k.getStationCode()),
                                  cb.equal(fromWfdisc.get(CHANNEL_CODE), k.getChannelCode()),
                                  cb.lessThanOrEqualTo(fromWfdisc.get(TIME), effectiveTime),
                                  cb.greaterThanOrEqualTo(fromWfdisc.get(END_TIME), effectiveTime)))
                      .toArray(Predicate[]::new)));

  private static final TimerangeQueryBuilder UNBOUNDED_TIMERANGE_QUERY =
      (CriteriaBuilder cb,
          Collection<SiteChanKey> keySubList,
          Root<WfdiscDao> fromWfdisc,
          CriteriaQuery<WfdiscDao> query,
          EntityManager em,
          Instant effectiveTime) ->
          query.where(
              cb.or(
                  keySubList.stream()
                      .map(
                          k ->
                              cb.and(
                                  cb.equal(fromWfdisc.get(STATION_CODE), k.getStationCode()),
                                  cb.equal(fromWfdisc.get(CHANNEL_CODE), k.getChannelCode()),
                                  cb.lessThan(
                                      fromWfdisc.get(TIME),
                                      getNextVersionStartTime(cb, query, k, effectiveTime))))
                      .toArray(Predicate[]::new)));

  @Autowired
  public WfdiscDatabaseConnector(@Qualifier("oracle") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  /**
   * Find all {@link WfdiscDao}s associated with the input list of wfids
   *
   * @param wfids List of wfids to query
   * @return Collection of {@link WfdiscDao}s
   */
  public List<WfdiscDao> findWfdiscsByWfids(Collection<Long> wfids) {
    Validate.notNull(wfids, EMPTY_WFID_LIST_ERROR);

    var errMessage = String.format(WFDISCS_WFIDS_MESSAGE, wfids.size());
    if (wfids.isEmpty()) {
      LOGGER.debug("Request for Wfdiscs by wfids was given an empty list of keys");
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          wfids,
          PARTITIONS_SIZE,
          (Collection<Long> partitionedWfids) -> {
            EntityResultListFunction<WfdiscDao> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<WfdiscDao> query = cb.createQuery(WfdiscDao.class);
                  Root<WfdiscDao> fromWfdisc = query.from(WfdiscDao.class);

                  query.select(fromWfdisc);
                  query.where(
                      cb.or(
                          partitionedWfids.stream()
                              .map(wfid -> cb.equal(fromWfdisc.get(ID), wfid))
                              .toArray(Predicate[]::new)));

                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, WFDISCS_BY_WFIDS_ERROR, errMessage);
          });
    }
  }

  /**
   * Find map of evids to {@link WfdiscDao}s associated with the input list of evids and stations
   *
   * @param evids List of evids to query
   * @param stationCodes List of stations
   * @return Map of evids and {@link WfdiscDao}s
   */
  public Map<Long, List<WfdiscDao>> findWfdiscDaosByEvidMapFilteredByStation(
      Collection<Long> evids, Collection<String> stationCodes) {
    var wfTagDaos = findWftagsByEvIds(evids);

    var filteredWfdiscDaos = filterWfdiscDaosByStations(wfTagDaos, stationCodes);

    return wfTagDaos.stream()
        .filter(
            wfTagDao ->
                filteredWfdiscDaos.stream()
                    .map(WfdiscDao::getId)
                    .anyMatch(wfid -> wfTagDao.getWfTagKey().getWfId() == wfid))
        .map(WfTagDao::getWfTagKey)
        .collect(
            Collectors.groupingBy(
                WfTagKey::getId,
                Collectors.mapping(
                    wfTagKey ->
                        filteredWfdiscDaos.stream()
                            .filter(wfdiscDao -> wfdiscDao.getId() == wfTagKey.getWfId())
                            .toList(),
                    Collectors.mapping(
                        wfdiscDaos ->
                            wfdiscDaos.stream().filter(Objects::nonNull).findFirst().orElseThrow(),
                        Collectors.toList()))));
  }

  /**
   * Find all {@link WfTagDao}s for the given evIds
   *
   * @param evIds Collection of evIds
   * @return list of {@link WfTagDao}s
   */
  private List<WfTagDao> findWftagsByEvIds(Collection<Long> evIds) {
    Validate.notNull(evIds, EMPTY_EVID_LIST_ERROR);

    var errMessage = String.format(WFDISCS_EVIDS_MESSAGE, evIds.size());
    if (evIds.isEmpty()) {
      LOGGER.debug("Request for Wftag by tagIds was given an empty list of keys");
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          evIds,
          PARTITIONS_SIZE,
          (Collection<Long> partitionedTagIds) -> {
            EntityResultListFunction<WfTagDao> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<WfTagDao> query = cb.createQuery(WfTagDao.class);
                  Root<WfTagDao> fromWftag = query.from(WfTagDao.class);

                  final Path<Object> idPath = fromWftag.get(WFTAG_KEY);
                  query.select(fromWftag);
                  query.where(
                      cb.and(
                          cb.equal(idPath.get(TAGNAME), TagName.EVID),
                          cb.or(
                              partitionedTagIds.stream()
                                  .map(evid -> cb.equal(idPath.get(ID), evid))
                                  .toArray(Predicate[]::new))));

                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, "findWftagsByEvIds", errMessage);
          });
    }
  }

  private List<WfdiscDao> filterWfdiscDaosByStations(
      List<WfTagDao> wfTagDaos, Collection<String> stationCodes) {

    var wfids = wfTagDaos.stream().map(wfTagDao -> wfTagDao.getWfTagKey().getWfId()).toList();

    return findWfdiscsByWfids(wfids).stream()
        .filter(wfDiscDao -> stationCodes.contains(wfDiscDao.getStationCode()))
        .toList();
  }

  /**
   * Finds all {@link WfdiscDao}s for siteChanKeys, starting at effectiveTime that have the same
   * Response version info. Response Versions look at calib and calper fields
   *
   * @param siteChanKeys
   * @param effectiveTime
   * @return List of all WfDisc for the supplied siteChanKeys that create a version starting at
   *     effectiveTime
   */
  public List<WfdiscDao> findWfdiscVersionsByNameAndTime(
      Collection<SiteChanKey> siteChanKeys, Instant effectiveTime) {

    Validate.notNull(siteChanKeys, EMPTY_CHANNEL_NAME_LIST_ERROR);
    Validate.notNull(effectiveTime, "Request for Wfdisc by time was must be given a time");

    var errMessage =
        String.format(WFDISCS_BY_SITECHAN_KEYS_TIME_MESSAGE, siteChanKeys.size(), effectiveTime);
    if (siteChanKeys.isEmpty()) {
      LOGGER.debug(EMPTY_LIST_OF_KEYS_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          siteChanKeys,
          500,
          (Collection<SiteChanKey> keySubList) -> {
            EntityResultListFunction<WfdiscDao> delegateFunc =
                (EntityManager em) ->
                    buildTimeRangeDelegate(
                        em, keySubList, effectiveTime, UNBOUNDED_TIMERANGE_QUERY);

            return runWithEntityManagerResultListFunction(
                delegateFunc, WFDISCS_BY_SITECHAN_KEYS_TIME_ERROR, errMessage);
          });
    }
  }

  private static List<WfdiscDao> buildTimeRangeDelegate(
      EntityManager em,
      Collection<SiteChanKey> keySubList,
      Instant effectiveTime,
      TimerangeQueryBuilder queryBuilder) {

    var cb = em.getCriteriaBuilder();
    CriteriaQuery<WfdiscDao> query = cb.createQuery(WfdiscDao.class);
    Root<WfdiscDao> fromWfdisc = query.from(WfdiscDao.class);

    query.select(fromWfdisc);
    queryBuilder.build(cb, keySubList, fromWfdisc, query, em, effectiveTime);

    return em.createQuery(query).getResultList();
  }

  /**
   * subquery to retreive the start time of the next version. For Wfdisc, that is defined as a
   * change in calper or calib values
   *
   * @param cb
   * @param query
   * @param k
   * @param effectiveTime
   * @return subquery to be used in parent query
   */
  private static Subquery<Instant> getNextVersionStartTime(
      CriteriaBuilder cb, CriteriaQuery<WfdiscDao> query, SiteChanKey k, Instant effectiveTime) {
    Subquery<Instant> subquery = query.subquery(Instant.class);
    Root<WfdiscDao> wfdisc = subquery.from(WfdiscDao.class);

    Predicate calibIn =
        wfdisc.get(CALIB).in(getVersionDoubleAttributes(cb, query, k, CALIB, effectiveTime));
    Predicate calperIn =
        wfdisc.get(CALPER).in(getVersionDoubleAttributes(cb, query, k, CALPER, effectiveTime));
    CriteriaBuilder.Coalesce<Instant> coalesce = cb.coalesce();
    coalesce.value(cb.least(wfdisc.<Instant>get(TIME)));
    coalesce.value(Instant.MAX);

    subquery
        .select(coalesce)
        .where(
            cb.equal(wfdisc.get(STATION_CODE), k.getStationCode()),
            cb.equal(wfdisc.get(CHANNEL_CODE), k.getChannelCode()),
            cb.greaterThanOrEqualTo(wfdisc.get(TIME), effectiveTime),
            cb.or(cb.not(calibIn), cb.not(calperIn)));
    return subquery;
  }

  /**
   * subquery to compare specific double attributes (columns) to find changes
   *
   * @param cb
   * @param query
   * @param k
   * @param property
   * @param effectiveTime
   * @return subquery to be used in parent query
   */
  private static Subquery<Double> getVersionDoubleAttributes(
      CriteriaBuilder cb,
      CriteriaQuery<WfdiscDao> query,
      SiteChanKey k,
      String property,
      Instant effectiveTime) {
    Subquery<Double> subquery = query.subquery(Double.class);
    Root<WfdiscDao> wfdisc = subquery.from(WfdiscDao.class);

    subquery
        .select(wfdisc.get(property))
        .where(
            cb.equal(wfdisc.get(STATION_CODE), k.getStationCode()),
            cb.equal(wfdisc.get(CHANNEL_CODE), k.getChannelCode()),
            cb.greaterThanOrEqualTo(wfdisc.get(END_TIME), effectiveTime),
            cb.lessThanOrEqualTo(wfdisc.get(TIME), effectiveTime));

    return subquery;
  }

  /**
   * Finds all {@link WfdiscDao}s for the given station code and channel code pairs at the specified
   * effective time.
   *
   * <p>select * from wfdisc where wfdisc.endtime >= eff_time and wfdisc.time <= eff_time and
   * segtype = 'o' and ((sta = 'AS01' and chan='BHZ') or (sta = 'MK01' and chan = 'SHZ'))
   *
   * <p>AS01/BHZ MK01/SHZ @param siteChanKeys @param effectiveTime @return
   *
   * @param siteChanKeys a collection of {@link SiteChanKey}s
   * @param effectiveTime the Instant of interest
   * @return a list of {@link WfdiscDaos} matching the {@link SiteChanKey}s at the effectiveTime
   */
  public List<WfdiscDao> findWfdiscsByNameAndTime(
      Collection<SiteChanKey> siteChanKeys, Instant effectiveTime) {

    Validate.notNull(siteChanKeys, EMPTY_CHANNEL_NAME_LIST_ERROR);
    Validate.notNull(effectiveTime, "Request for Wfdisc by time was must be given a time");

    var errMessage =
        String.format(WFDISCS_BY_NAMES_TIME_MESSAGE, siteChanKeys.size(), effectiveTime);
    if (siteChanKeys.isEmpty()) {
      LOGGER.debug(EMPTY_LIST_OF_KEYS_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          siteChanKeys,
          500,
          (Collection<SiteChanKey> keySubList) -> {
            EntityResultListFunction<WfdiscDao> delegateFunc =
                (EntityManager em) ->
                    buildTimeRangeDelegate(em, keySubList, effectiveTime, BOUNDED_TIMERANGE_QUERY);

            return runWithEntityManagerResultListFunction(
                delegateFunc, WFDISCS_BY_NAMES_TIME_ERROR, errMessage);
          });
    }
  }

  /**
   * Finds all {@link WfdiscDao}s for the given station code and channel code pairs that have a
   * {@link StationChannelTimeKey#getTime()} and {@link WfdiscDao#getEndTime()} that falls within
   * the queried time range as well as the greatest wfdisc before the query sstart time specified by
   * the inputs such that:
   *
   * <p>{@link StationChannelTimeKey#getTime()} {@literal <=} endTime && {@link
   * WfdiscDao#getEndTime()} {@literal >=} startTime
   *
   * @param siteChanKeys
   * @param startTime
   * @param endTime
   * @return
   */
  public List<WfdiscDao> findWfdiscsByNameAndTimeRange(
      Collection<SiteChanKey> siteChanKeys, Instant startTime, Instant endTime) {

    var errMessage = createErrorMessage(siteChanKeys, startTime, endTime);
    if (siteChanKeys.isEmpty()) {
      LOGGER.debug(EMPTY_LIST_OF_KEYS_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          siteChanKeys,
          PARTITIONS_SIZE,
          (Collection<SiteChanKey> keySubList) -> {
            EntityResultListFunction<WfdiscDao> delegateFunc =
                (EntityManager em) -> buildNameAndTimeDelegate(em, keySubList, startTime, endTime);

            return runWithEntityManagerResultListFunction(
                delegateFunc, WFDISCS_BY_SITECHAN_KEYS_TIME_RANGE_ERROR, errMessage);
          });
    }
  }

  private static List<WfdiscDao> buildNameAndTimeDelegate(
      EntityManager em, Collection<SiteChanKey> keySubList, Instant startTime, Instant endTime) {

    var cb = em.getCriteriaBuilder();
    CriteriaQuery<WfdiscDao> query = cb.createQuery(WfdiscDao.class);
    Root<WfdiscDao> fromWfdisc = query.from(WfdiscDao.class);
    var timeRangePredicate =
        createTimeRangePredicates(cb, keySubList, fromWfdisc, startTime, endTime);
    var segTypePredicate = cb.equal(fromWfdisc.get(SEG_TYPE), SegType.ORIGINAL);
    var buildWfdiscsQuery =
        buildWfdiscsQuery(
            keySubList, timeRangePredicate, segTypePredicate, cb, query, fromWfdisc, startTime);

    return em.createQuery(buildWfdiscsQuery).getResultList();
  }

  private static String createErrorMessage(
      Collection<SiteChanKey> siteChanKeys, Instant startTime, Instant endTime) {
    Validate.notNull(siteChanKeys, EMPTY_CHANNEL_NAME_LIST_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    return String.format(
        WFDISCS_BY_SITECHAN_KEYS_TIME_RANGE_MESSAGE, siteChanKeys.size(), startTime, endTime);
  }

  private static Predicate createTimeRangePredicates(
      CriteriaBuilder cb,
      Collection<SiteChanKey> keySubList,
      Root<WfdiscDao> fromWfdisc,
      Instant startTime,
      Instant endTime) {

    var keyPredicates = createKeyPredicates(keySubList, cb, fromWfdisc);

    // time range predicate for start and end times
    return cb.and(
        cb.or(keyPredicates),
        cb.greaterThanOrEqualTo(fromWfdisc.get(END_TIME), startTime),
        cb.lessThanOrEqualTo(fromWfdisc.get(TIME), endTime));
  }

  /**
   * Build a full time range and subquery for given time range
   *
   * @param keySubList
   * @param timeRangePredicate
   * @param segTypePredicate
   * @param cb
   * @param wfdiscQuery
   * @param fromWfdisc
   * @param startTime
   * @return
   */
  private static CriteriaQuery<WfdiscDao> buildWfdiscsQuery(
      Collection<SiteChanKey> keySubList,
      Predicate timeRangePredicate,
      Predicate segTypePredicate,
      CriteriaBuilder cb,
      CriteriaQuery<WfdiscDao> wfdiscQuery,
      Root<WfdiscDao> fromWfdisc,
      Instant startTime) {

    // subquery for querying wfdiscs that occurr directly before the time range
    Subquery<Instant> prevWfdiscSubQuery = wfdiscQuery.subquery(Instant.class);
    Root<WfdiscDao> subFromWfdisc = prevWfdiscSubQuery.from(WfdiscDao.class);

    var keyPredicates = createKeyPredicates(keySubList, cb, fromWfdisc);

    // find the max time of all wfdisc start times before query start time
    prevWfdiscSubQuery
        .select(cb.greatest(subFromWfdisc.<Instant>get(TIME)))
        .where(cb.and(cb.or(keyPredicates), cb.lessThan(subFromWfdisc.get(TIME), startTime)));

    var maxTimeSubPredicate = cb.equal(fromWfdisc.get(TIME), prevWfdiscSubQuery);

    return wfdiscQuery
        .select(fromWfdisc)
        .where(cb.or(maxTimeSubPredicate, timeRangePredicate), segTypePredicate)
        .orderBy(cb.asc(fromWfdisc.get(TIME)));
  }

  private static Predicate[] createKeyPredicates(
      Collection<SiteChanKey> keySubList, CriteriaBuilder cb, Root<WfdiscDao> fromWfdisc) {

    return keySubList.stream()
        .map(
            k ->
                cb.and(
                    cb.equal(fromWfdisc.get(STATION_CODE), k.getStationCode()),
                    cb.equal(fromWfdisc.get(CHANNEL_CODE), k.getChannelCode())))
        .toArray(Predicate[]::new);
  }

  public List<WfdiscDao> findWfDiscVersionAfterEffectiveTime(Collection<SiteChanKey> siteChanKeys) {

    var errMessage = String.format(WFDISCS_BY_SITECHAN_KEYS_MESSAGE, siteChanKeys.size());
    List<Tuple> resultSet =
        runPartitionedQuery(
            siteChanKeys,
            PARTITIONS_SIZE,
            (Collection<SiteChanKey> partitionedSiteChanKeys) -> {
              EntityResultListFunction<Tuple> delegateFunc =
                  (EntityManager em) -> {
                    var cb = em.getCriteriaBuilder();
                    var query = createTupleQuery(cb, partitionedSiteChanKeys);
                    return em.createQuery(query).getResultList();
                  };
              return runWithEntityManagerResultListFunction(
                  delegateFunc, WFDISCS_BY_SITECHAN_KEYS_ERROR, errMessage);
            });

    return runPartitionedQuery(
        resultSet,
        PARTITIONS_SIZE,
        (Collection<Tuple> partitionedResultSet) -> {
          EntityResultListFunction<WfdiscDao> delegateFunc =
              (EntityManager em) -> {
                var cb = em.getCriteriaBuilder();
                var query = createWfdiscDaoQuery(cb, partitionedResultSet);
                return em.createQuery(query).getResultList();
              };

          return runWithEntityManagerResultListFunction(
              delegateFunc, WFDISCS_BY_SITECHAN_KEYS_ERROR, errMessage);
        });
  }

  private CriteriaQuery<Tuple> createTupleQuery(
      CriteriaBuilder cb, Collection<SiteChanKey> partitionedSiteChanKeys) {
    CriteriaQuery<Tuple> query = cb.createQuery(Tuple.class);
    Root<WfdiscDao> fromWfdisc = query.from(WfdiscDao.class);
    query
        .multiselect(
            fromWfdisc.get(STATION_CODE),
            fromWfdisc.get(CHANNEL_CODE),
            cb.min(fromWfdisc.get(TIME)).alias(TIME))
        .where(
            cb.or(
                partitionedSiteChanKeys.stream()
                    .map(
                        k ->
                            cb.and(
                                cb.equal(fromWfdisc.get(STATION_CODE), k.getStationCode()),
                                cb.equal(fromWfdisc.get(CHANNEL_CODE), k.getChannelCode()),
                                cb.greaterThan(fromWfdisc.get(TIME), k.getOnDate())))
                    .toArray(Predicate[]::new)))
        .groupBy(fromWfdisc.get(STATION_CODE), fromWfdisc.get(CHANNEL_CODE));

    return query;
  }

  private CriteriaQuery<WfdiscDao> createWfdiscDaoQuery(
      CriteriaBuilder cb, Collection<Tuple> partitionedResultSet) {
    CriteriaQuery<WfdiscDao> query = cb.createQuery(WfdiscDao.class);
    Root<WfdiscDao> fromWfdisc = query.from(WfdiscDao.class);
    query
        .select(fromWfdisc)
        .where(
            cb.or(
                partitionedResultSet.stream()
                    .map(
                        k ->
                            cb.and(
                                cb.equal(fromWfdisc.get(STATION_CODE), k.get(STATION_INDEX)),
                                cb.equal(fromWfdisc.get(CHANNEL_CODE), k.get(CHANNEL_INDEX)),
                                cb.equal(fromWfdisc.get(TIME), k.get(TIME_INDEX))))
                    .toArray(Predicate[]::new)))
        .orderBy(cb.asc(fromWfdisc.get(TIME)));
    return query;
  }

  /**
   * Retrieve wfdiscs for a provided time range
   *
   * @param startTime as the start of the desired time range
   * @param endTime as the end of the desired time range
   * @return a {@link List}{@literal <}{@link WfdiscDao}{@literal >}
   */
  public List<WfdiscDao> findWfdiscsByTimeRange(Instant startTime, Instant endTime) {

    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);
    Validate.isTrue(startTime.isBefore(endTime), START_NOT_BEFORE_END_TIME_ERROR);

    var errMessage = String.format(WFDISCS_BY_TIME_RANGE_MESSAGE, startTime, endTime);

    EntityResultListFunction<WfdiscDao> delegateFunction =
        (EntityManager em) -> {
          var cb = em.getCriteriaBuilder();
          CriteriaQuery<WfdiscDao> query = cb.createQuery(WfdiscDao.class);
          Root<WfdiscDao> fromWfdisc = query.from(WfdiscDao.class);

          query.select(fromWfdisc);
          query.where(
              cb.and(
                  cb.greaterThanOrEqualTo(fromWfdisc.get(END_TIME), startTime),
                  cb.lessThanOrEqualTo(fromWfdisc.get(TIME), endTime)));

          return em.createQuery(query).getResultList();
        };

    return runWithEntityManagerResultListFunction(
        delegateFunction, WFDISCS_BY_TIME_RANGE_ERROR, errMessage);
  }

  /**
   * Finds all {@link WfdiscDao}s for the given station code and channel code pairs that have a
   * {@link StationChannelTimeKey#getTime()} and {@link WfdiscDao#getEndTime()} that falls within
   * the queried time range and Segment type specified by the inputs such that:
   *
   * <p>{@link StationChannelTimeKey#getTime()} {@literal <=} endTime && {@link
   * WfdiscDao#getEndTime()} {@literal >=} && {@link WfdiscDao#getLoadDate()} {@literal <=} loadTime
   * && {@link WfdiscDao#getSegType()} {@literal <=} segType
   *
   * @param siteChanKeys siteChans to query related wfdiscs for
   * @param startTime begin time of query range
   * @param endTime end time of query range
   * @param creationTime the maximum creation time (load date) allowed for the wfdisc
   * @return list of matching wfdisc records
   */
  public List<WfdiscDao> findWfdiscsByNameTimeRangeAndCreationTime(
      Collection<SiteChanKey> siteChanKeys,
      Instant startTime,
      Instant endTime,
      Instant creationTime) {

    Validate.notNull(
        siteChanKeys, "Request for Wfdisc by time range must be given a valid siteChane List");
    Validate.notEmpty(
        siteChanKeys, "Request for Wfdisc by time range must be given a valid siteChane List");
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    var errMessage =
        String.format(
            WFDISCS_BY_TIME_RANGE_CREATION_TIME_MESSAGE, startTime, endTime, creationTime);

    EntityResultListFunction<WfdiscDao> delegateFunc =
        (EntityManager em) ->
            buildCreationTimeDelegate(em, siteChanKeys, startTime, endTime, creationTime);

    return runWithEntityManagerResultListFunction(
        delegateFunc, WFDISCS_BY_TIME_RANGE_CREATION_TIME_ERROR, errMessage);
  }

  private List<WfdiscDao> buildCreationTimeDelegate(
      EntityManager em,
      Collection<SiteChanKey> siteChanKeys,
      Instant startTime,
      Instant endTime,
      Instant creationTime) {

    var cb = em.getCriteriaBuilder();
    CriteriaQuery<WfdiscDao> query = cb.createQuery(WfdiscDao.class);
    Root<WfdiscDao> fromWfdisc = query.from(WfdiscDao.class);

    query.select(fromWfdisc);
    query
        .where(
            cb.and(
                cb.greaterThanOrEqualTo(fromWfdisc.get(END_TIME), startTime),
                cb.lessThanOrEqualTo(fromWfdisc.get(TIME), endTime),
                cb.lessThanOrEqualTo(fromWfdisc.get(LOAD_DATE), creationTime),
                cb.or(
                    siteChanKeys.stream()
                        .map(
                            scList ->
                                cb.and(
                                    cb.equal(fromWfdisc.get(STATION_CODE), scList.getStationCode()),
                                    cb.equal(
                                        fromWfdisc.get(CHANNEL_CODE), scList.getChannelCode())))
                        .toArray(Predicate[]::new))))
        .orderBy(cb.asc(fromWfdisc.get(TIME)));

    return em.createQuery(query).getResultList();
  }

  @FunctionalInterface
  private interface TimerangeQueryBuilder {
    void build(
        CriteriaBuilder cb,
        Collection<SiteChanKey> keySubList,
        Root<WfdiscDao> fromWfdisc,
        CriteriaQuery<WfdiscDao> query,
        EntityManager em,
        Instant effectiveTime);
  }
}
