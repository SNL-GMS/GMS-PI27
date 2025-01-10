package gms.shared.waveform.qc.mask.connector;

import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import gms.shared.waveform.qc.mask.dao.QcMaskInfoDao;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.apache.commons.lang3.Validate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope(BeanDefinition.SCOPE_PROTOTYPE)
public class QcMaskInfoDatabaseConnector extends DatabaseConnector {

  private static final Logger LOGGER = LoggerFactory.getLogger(QcMaskInfoDatabaseConnector.class);

  private static final String STATION = "station";
  private static final String CHANNEL = "channel";
  private static final String TIME = "startTime";
  private static final String END_TIME = "endTime";
  private static final int PARTITION_SIZE = 250;

  static final String MISSING_START_TIME_ERROR =
      "Request for qcMaskInfo by time " + "range must be given a start time";
  static final String MISSING_END_TIME_ERROR =
      "Request for qcMaskInfo by time " + "range must be given a end time";
  static final String START_NOT_BEFORE_END_TIME_ERROR = "Start time has " + "to be before end time";
  static final String EMPTY_SITECHANKEY_LIST_ERROR =
      "Request for qcMaskInfos must be " + "given a list of station and channel names";
  static final String QCMASKINFO_ERROR = "QcMaskInfo exception";

  static final String TIME_RANGE_MESSAGE = "time range = %s - %s";

  @Autowired
  public QcMaskInfoDatabaseConnector(
      @Qualifier("qcEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  /**
   * Find {@link QcMaskInfoDao}s by site chan keys and time range
   *
   * @param siteChanKeys list of SiteChanKeys
   * @param startTime start instant for time range
   * @param endTime end instant for time range
   * @return list of {@link QcMaskInfoDao}s
   */
  public List<QcMaskInfoDao> findQcMaskInfoDaos(
      Collection<SiteChanKey> siteChanKeys, Instant startTime, Instant endTime) {

    Validate.notNull(siteChanKeys, EMPTY_SITECHANKEY_LIST_ERROR);
    Validate.notNull(startTime, MISSING_START_TIME_ERROR);
    Validate.notNull(endTime, MISSING_END_TIME_ERROR);
    Validate.isTrue(startTime.isBefore(endTime), START_NOT_BEFORE_END_TIME_ERROR);

    var errorMessage = String.format(TIME_RANGE_MESSAGE, startTime, endTime);

    if (siteChanKeys.isEmpty()) {
      LOGGER.debug("Request for QCMASKINFO by siteChanKeys names was given an empty list of keys");
      return new ArrayList<>();
    } else {

      return runPartitionedQuery(
          siteChanKeys,
          PARTITION_SIZE,
          (Collection<SiteChanKey> partitionedSiteChanKeys) -> {
            EntityResultListFunction<QcMaskInfoDao> delegateFunction =
                entityManager ->
                    queryQcMaskInfoDaos(entityManager, partitionedSiteChanKeys, startTime, endTime);

            return runWithEntityManagerResultListFunction(
                delegateFunction, QCMASKINFO_ERROR, errorMessage);
          });
    }
  }

  /**
   * Query for {@link QcMaskInfoDao}s using entity manager
   *
   * @param entityManager entity manager for db connection
   * @param siteChanKeys partitioned list of site chan keys
   * @param startTime start time for query
   * @param endTime end time for query
   * @return list of {@link QcMaskInfoDao}
   */
  private static List<QcMaskInfoDao> queryQcMaskInfoDaos(
      EntityManager entityManager,
      Collection<SiteChanKey> siteChanKeys,
      Instant startTime,
      Instant endTime) {
    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<QcMaskInfoDao> query = cb.createQuery(QcMaskInfoDao.class);
    Root<QcMaskInfoDao> fromQcMaskInfo = query.from(QcMaskInfoDao.class);

    query.select(fromQcMaskInfo);
    query.distinct(true);
    query.where(
        cb.and(
            cb.or(
                siteChanKeys.stream()
                    .map(
                        key ->
                            cb.and(
                                cb.equal(fromQcMaskInfo.get(STATION), key.getStationCode()),
                                cb.equal(fromQcMaskInfo.get(CHANNEL), key.getChannelCode())))
                    .toArray(Predicate[]::new)),
            cb.lessThanOrEqualTo(fromQcMaskInfo.get(TIME), endTime),
            cb.greaterThanOrEqualTo(fromQcMaskInfo.get(END_TIME), startTime)));

    return entityManager.createQuery(query).getResultList();
  }
}
