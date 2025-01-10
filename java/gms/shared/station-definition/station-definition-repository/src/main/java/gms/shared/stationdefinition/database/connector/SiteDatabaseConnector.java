package gms.shared.stationdefinition.database.connector;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.dao.css.SiteAndSurroundingDates;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
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
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class SiteDatabaseConnector extends DatabaseConnector {

  private static final String ID = "id";
  private static final String STATION_CODE = "stationCode";
  private static final String REF_STATION = "referenceStation";
  private static final String ON_DATE = "onDate";
  private static final String OFF_DATE = "offDate";

  private static final Logger LOGGER = LoggerFactory.getLogger(SiteDatabaseConnector.class);

  static final String MISSING_STATION_NAME_LIST_ERROR =
      "Request for Site given empty list of station names.";
  static final String MISSING_START_TIME_ERROR = "Request for Site given empty start time.";
  private static final String MISSING_END_TIME_ERROR = "Request for Site given empty end time.";

  static final String SITES_BY_CODES_ERROR = "Sites by station codes exception";
  static final String SITES_BY_REF_STATION_ERROR = "Sites by ref stations exception";
  static final String SITES_BY_CODES_AND_TIME_ERROR = "Sites by station codes and time exception";
  static final String SITES_BY_REF_STATION_AND_TIME_ERROR =
      "Sites by ref stations and time exception";
  static final String SITES_BY_REF_STATION_AND_TIME_RANGE_ERROR =
      "Sites by ref stations and time range exception";
  static final String SITES_BY_STATIONS_AND_TIME_RANGE_ERROR =
      "Sites by station names and time range exception";
  static final String SITES_BY_TIME_RANGE_ERROR = "Sites by time range exception";

  static final String SITES_SURROUNDING_DATES_BY_REF_STATION_AND_TIME_ERROR =
      "Sites and surrounding dates by ref stations and time exception";
  static final String SITES_SURROUNDING_DATES_BY_REF_STATION_AND_TIME_RANGE_ERROR =
      "Sites and surrounding dates by ref stations and time range exception";
  static final String SITES_SURROUNDING_DATES_BY_STATIONS_AND_TIME_ERROR =
      "Sites and surrounding dates by stations and time exception";
  static final String SITES_SURROUNDING_DATES_BY_STATIONS_AND_TIME_RANGE_ERROR =
      "Sites and surrounding dates by stations and time range exception";

  static final String SITES_BY_STATION_CODES_MESSAGE = "station codes size %s";
  static final String SITES_BY_REF_STATION_MESSAGE = "ref stations size %s";
  static final String SITES_BY_STATION_CODES_TIME_MESSAGE = "station codes size %s, time %s";
  static final String SITES_BY_REF_STATION_TIME_MESSAGE = "ref stations size %s, time %s";
  static final String SITES_BY_REF_STATION_TIME_RANGE_MESSAGE =
      "ref stations size %s, time range %s - %s";
  static final String SITES_BY_STATIONS_TIME_RANGE_MESSAGE = "stations size %s, time range %s - %s";
  static final String SITES_BY_TIME_RANGE_MESSAGE = "time range %s - %s";

  static final String SITES_SURROUNDING_DATES_BY_REF_STATION_TIME_MESSAGE =
      "ref stations size %s, time %s";
  static final String SITES_SURROUNDING_DATES_BY_REF_STATION_TIME_RANGE_MESSAGE =
      "ref stations size %s, time range %s - %s";
  static final String SITES_SURROUNDING_DATES_BY_STATIONS_TIME_MESSAGE =
      "stations size %s, time %s";
  static final String SITES_SURROUNDING_DATES_BY_STATIONS_TIME_RANGE_MESSAGE =
      "ref stations size %s, time range %s - %s";

  @Autowired
  public SiteDatabaseConnector(@Qualifier("oracle") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public List<SiteDao> findSitesByStationCodes(Collection<String> stationNames) {

    Validate.notNull(stationNames, MISSING_STATION_NAME_LIST_ERROR);

    var errMessage = String.format(SITES_BY_STATION_CODES_MESSAGE, stationNames.size());
    if (stationNames.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          stationNames,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteDao> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
                  Root<SiteDao> fromSite = query.from(SiteDao.class);
                  query.select(fromSite);

                  query.where(fromSite.get(ID).get(STATION_CODE).in(partition));
                  return em.createQuery(query).getResultList();
                };
            return runWithEntityManagerResultListFunction(
                delegateFunc, SITES_BY_CODES_ERROR, errMessage);
          });
    }
  }

  public List<SiteDao> findSitesByRefStation(Collection<String> refStationNames) {

    Validate.notNull(refStationNames, MISSING_STATION_NAME_LIST_ERROR);

    var errMessage = String.format(SITES_BY_REF_STATION_MESSAGE, refStationNames.size());
    if (refStationNames.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          refStationNames,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteDao> delegateFunction =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
                  Root<SiteDao> fromSite = query.from(SiteDao.class);
                  query.select(fromSite);

                  query.where(fromSite.get(REF_STATION).in(partition));
                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunction, SITES_BY_REF_STATION_ERROR, errMessage);
          });
    }
  }

  // this should validate/query for the refStation as well...ie: the refSta could be wrong, but we
  // are only looking at the sta name
  public List<SiteDao> findSitesByStationCodesAndStartTime(
      Collection<String> stationNames, Instant start) {

    Validate.notNull(stationNames, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(start, MISSING_START_TIME_ERROR);

    var errMessage = String.format(SITES_BY_STATION_CODES_TIME_MESSAGE, stationNames.size(), start);
    if (stationNames.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          stationNames,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteDao> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
                  Root<SiteDao> fromSite = query.from(SiteDao.class);
                  query.select(fromSite);

                  query.where(
                      cb.and(
                          fromSite.get(ID).get(STATION_CODE).in(partition),
                          cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), start),
                          cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), start)));
                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITES_BY_CODES_AND_TIME_ERROR, errMessage);
          });
    }
  }

  public List<SiteDao> findSitesByRefStationAndStartTime(
      Collection<String> stationNames, Instant start) {

    Validate.notNull(stationNames, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(start, MISSING_START_TIME_ERROR);

    var errMessage = String.format(SITES_BY_REF_STATION_TIME_MESSAGE, stationNames.size(), start);
    if (stationNames.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          stationNames,
          200,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteDao> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
                  Root<SiteDao> fromSite = query.from(SiteDao.class);
                  query.select(fromSite);

                  query.where(
                      cb.and(
                          fromSite.get(REF_STATION).in(partition),
                          cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), start),
                          cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), start)));
                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITES_BY_REF_STATION_AND_TIME_ERROR, errMessage);
          });
    }
  }

  public List<SiteDao> findMainSitesByRefStaAndTime(
      Collection<String> stationNames, Instant start) {
    Objects.requireNonNull(stationNames);
    Objects.requireNonNull(start);

    var errMessage = String.format(SITES_BY_REF_STATION_TIME_MESSAGE, stationNames.size(), start);
    if (stationNames.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return List.of();
    } else {
      return runPartitionedQuery(
          stationNames,
          200,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteDao> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
                  Root<SiteDao> fromSite = query.from(SiteDao.class);
                  query.select(fromSite);

                  query.where(
                      cb.and(
                          fromSite.get(REF_STATION).in(partition),
                          fromSite.get(ID).get(STATION_CODE).in(partition),
                          cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), start),
                          cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), start)));
                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITES_BY_REF_STATION_AND_TIME_ERROR, errMessage);
          });
    }
  }

  public List<SiteDao> findSitesByReferenceStationAndTimeRange(
      List<String> referenceStations, Instant startTime, Instant endTime) {

    Validate.notNull(referenceStations, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);
    Preconditions.checkState(startTime.isBefore(endTime), "Start time cannot be after end time");

    var errMessage =
        String.format(
            SITES_BY_REF_STATION_TIME_RANGE_MESSAGE, referenceStations.size(), startTime, endTime);
    if (referenceStations.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return List.of();
    } else {
      return runPartitionedQuery(
          referenceStations,
          900,
          (Collection<String> referenceStationsSubList) -> {
            EntityResultListFunction<SiteDao> delegateFunc =
                (EntityManager em) -> {
                  var builder = em.getCriteriaBuilder();
                  CriteriaQuery<SiteDao> query = builder.createQuery(SiteDao.class);
                  Root<SiteDao> fromSite = query.from(SiteDao.class);

                  query
                      .select(fromSite)
                      .where(
                          builder.and(
                              fromSite.get(REF_STATION).in(referenceStationsSubList),
                              builder.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), endTime),
                              builder.greaterThanOrEqualTo(fromSite.get(OFF_DATE), startTime)));

                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITES_BY_REF_STATION_AND_TIME_RANGE_ERROR, errMessage);
          });
    }
  }

  public List<SiteDao> findSitesByNamesAndTimeRange(
      Collection<String> stationNames, Instant startTime, Instant endTime) {

    Validate.notNull(stationNames, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    var errMessage =
        String.format(
            SITES_BY_STATIONS_TIME_RANGE_MESSAGE, stationNames.size(), startTime, endTime);
    if (stationNames.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          stationNames,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteDao> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
                  Root<SiteDao> fromSite = query.from(SiteDao.class);
                  query.select(fromSite);

                  query.where(
                      cb.and(
                          fromSite.get(ID).get(STATION_CODE).in(partition),
                          cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), startTime),
                          cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), endTime)));
                  return em.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITES_BY_STATIONS_AND_TIME_RANGE_ERROR, errMessage);
          });
    }
  }

  public List<SiteDao> findSitesByTimeRange(Instant startTime, Instant endTime) {
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    var errMessage = String.format(SITES_BY_TIME_RANGE_MESSAGE, startTime, endTime);
    EntityResultListFunction<SiteDao> delegateFunc =
        (EntityManager em) -> {
          var cb = em.getCriteriaBuilder();
          CriteriaQuery<SiteDao> query = cb.createQuery(SiteDao.class);
          Root<SiteDao> fromSite = query.from(SiteDao.class);
          query.select(fromSite);

          query.where(
              cb.and(
                  cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), startTime),
                  cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), endTime)));
          return em.createQuery(query).getResultList();
        };

    return runWithEntityManagerResultListFunction(
        delegateFunc, SITES_BY_TIME_RANGE_ERROR, errMessage);
  }

  public List<SiteAndSurroundingDates> findSitesAndSurroundingDatesByRefStaAndTime(
      Collection<String> refStas, Instant effectiveAt) {

    Validate.notNull(refStas, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(effectiveAt, MISSING_START_TIME_ERROR);

    var errMessage =
        String.format(
            SITES_SURROUNDING_DATES_BY_REF_STATION_TIME_MESSAGE, refStas.size(), effectiveAt);
    if (refStas.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          refStas,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteAndSurroundingDates> delegateFunc =
                (EntityManager em) -> {
                  var cb = em.getCriteriaBuilder();
                  CriteriaQuery<SiteAndSurroundingDates> siteQuery =
                      cb.createQuery(SiteAndSurroundingDates.class);

                  // site dao query from the main site and surrounding dates
                  Root<SiteDao> fromSite = siteQuery.from(SiteDao.class);
                  Path<String> staCodePath = fromSite.get(REF_STATION);

                  var predicate =
                      cb.and(
                          staCodePath.in(partition),
                          cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), effectiveAt),
                          cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), effectiveAt));

                  var finalQuery =
                      getSiteAndSurroundingDatesQuery(predicate, cb, siteQuery, fromSite);

                  return em.createQuery(finalQuery).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITES_SURROUNDING_DATES_BY_REF_STATION_AND_TIME_ERROR, errMessage);
          });
    }
  }

  public List<SiteAndSurroundingDates> findSitesAndSurroundingDatesByRefStaAndTimeRange(
      Collection<String> refStas, Instant startTime, Instant endTime) {

    Validate.notNull(refStas, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    var errMessage =
        String.format(
            SITES_SURROUNDING_DATES_BY_REF_STATION_TIME_RANGE_MESSAGE,
            refStas.size(),
            startTime,
            endTime);
    if (refStas.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          refStas,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteAndSurroundingDates> delegateFunc =
                (EntityManager em) ->
                    buildDelegateFunction(em, partition, startTime, endTime, true);

            return runWithEntityManagerResultListFunction(
                delegateFunc,
                SITES_SURROUNDING_DATES_BY_REF_STATION_AND_TIME_RANGE_ERROR,
                errMessage);
          });
    }
  }

  public List<SiteAndSurroundingDates> findSitesAndSurroundingDatesByStaCodeAndTime(
      Collection<String> stationCodes, Instant effectiveAt) {

    Validate.notNull(stationCodes, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(effectiveAt, MISSING_START_TIME_ERROR);

    var errMessage =
        String.format(
            SITES_SURROUNDING_DATES_BY_STATIONS_TIME_MESSAGE, stationCodes.size(), effectiveAt);
    if (stationCodes.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          stationCodes,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteAndSurroundingDates> delegateFunc =
                (EntityManager em) ->
                    buildDelegateFunction(em, partition, effectiveAt, effectiveAt, false);

            return runWithEntityManagerResultListFunction(
                delegateFunc, SITES_SURROUNDING_DATES_BY_STATIONS_AND_TIME_ERROR, errMessage);
          });
    }
  }

  public List<SiteAndSurroundingDates> findSitesAndSurroundingDatesByStaCodeAndTimeRange(
      Collection<String> stationCodes, Instant startTime, Instant endTime) {

    Validate.notNull(stationCodes, MISSING_STATION_NAME_LIST_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);

    var errMessage =
        String.format(
            SITES_SURROUNDING_DATES_BY_STATIONS_TIME_RANGE_MESSAGE,
            stationCodes.size(),
            startTime,
            endTime);
    if (stationCodes.isEmpty()) {
      LOGGER.debug(MISSING_STATION_NAME_LIST_ERROR);
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          stationCodes,
          950,
          (Collection<String> partition) -> {
            EntityResultListFunction<SiteAndSurroundingDates> delegateFunc =
                (EntityManager em) ->
                    buildDelegateFunction(em, partition, startTime, endTime, false);

            return runWithEntityManagerResultListFunction(
                delegateFunc,
                SITES_SURROUNDING_DATES_BY_REF_STATION_AND_TIME_RANGE_ERROR,
                errMessage);
          });
    }
  }

  private static List<SiteAndSurroundingDates> buildDelegateFunction(
      EntityManager em,
      Collection<String> partition,
      Instant startTime,
      Instant endTime,
      boolean useRefStation) {
    var cb = em.getCriteriaBuilder();
    CriteriaQuery<SiteAndSurroundingDates> siteQuery =
        cb.createQuery(SiteAndSurroundingDates.class);

    // site dao query from the main site and surrounding dates
    Root<SiteDao> fromSite = siteQuery.from(SiteDao.class);
    Path<String> staCodePath;

    if (useRefStation) {
      staCodePath = fromSite.get(REF_STATION);
    } else {
      staCodePath = fromSite.get(ID).get(STATION_CODE);
    }

    var predicate =
        cb.and(
            staCodePath.in(partition),
            cb.greaterThanOrEqualTo(fromSite.get(OFF_DATE), startTime),
            cb.lessThanOrEqualTo(fromSite.get(ID).get(ON_DATE), endTime));

    var finalQuery = getSiteAndSurroundingDatesQuery(predicate, cb, siteQuery, fromSite);

    return em.createQuery(finalQuery).getResultList();
  }

  private static CriteriaQuery<SiteAndSurroundingDates> getSiteAndSurroundingDatesQuery(
      Predicate predicate,
      CriteriaBuilder cb,
      CriteriaQuery<SiteAndSurroundingDates> siteQuery,
      Root<SiteDao> fromSite) {

    // previous off date query to return the greatest previous off date
    Subquery<Instant> previousOffDateQuery = siteQuery.subquery(Instant.class);
    Root<SiteDao> subFromSiteOffDate = previousOffDateQuery.from(SiteDao.class);
    previousOffDateQuery
        .select(subFromSiteOffDate.<Instant>get(OFF_DATE))
        .where(
            cb.and(
                cb.equal(subFromSiteOffDate.get(REF_STATION), fromSite.get(REF_STATION)),
                cb.equal(
                    subFromSiteOffDate.get(ID).get(STATION_CODE),
                    fromSite.get(ID).get(STATION_CODE)),
                cb.equal(subFromSiteOffDate.get(OFF_DATE), fromSite.get(ID).get(ON_DATE))));

    // next on date query to return the least next on date
    Subquery<Instant> nextOnDateQuery = siteQuery.subquery(Instant.class);
    Root<SiteDao> subFromSiteOnDate = nextOnDateQuery.from(SiteDao.class);
    nextOnDateQuery
        .select(subFromSiteOnDate.get(ID).<Instant>get(ON_DATE))
        .where(
            cb.and(
                cb.equal(subFromSiteOnDate.get(REF_STATION), fromSite.get(REF_STATION)),
                cb.equal(
                    subFromSiteOnDate.get(ID).get(STATION_CODE),
                    fromSite.get(ID).get(STATION_CODE)),
                cb.equal(subFromSiteOnDate.get(ID).get(ON_DATE), fromSite.get(OFF_DATE))));

    // main site query select that implements all sub queries
    return siteQuery
        .select(
            cb.construct(
                SiteAndSurroundingDates.class, fromSite, previousOffDateQuery, nextOnDateQuery))
        .where(predicate);
  }
}
