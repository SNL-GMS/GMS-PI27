package gms.shared.waveform.qc.mask.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import gms.shared.waveform.qc.mask.dao.QcMaskSegDao;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
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
public class QcMaskSegDatabaseConnector extends DatabaseConnector {

  private static final Logger LOGGER = LoggerFactory.getLogger(QcMaskSegDatabaseConnector.class);

  private static final String QC_MASK_ID = "qcMaskId";
  private static final String QC_MASK_SEG_KEY = "qcMaskSegKey";
  private static final int PARTITION_SIZE = 250;

  static final String EMPTY_QC_MASK_ID =
      "Request for qcMaskSegDao must be " + "given a list of qcMaskId's";
  static final String QCMASKSEG_ERROR = "QcMaskSeg by qcMaskIds exception";

  static final String QCMASKID_SIZE_MESSAGE = "qcMaskIds size = %s";

  @Autowired
  public QcMaskSegDatabaseConnector(
      @Qualifier("qcEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  /**
   * Find {@link QcMaskSegDao}s by qc mask ids
   *
   * @param qcMaskIds list of qc mask ids
   * @return list of {@link QcMaskSegDao}
   */
  public List<QcMaskSegDao> findQcMaskSegDaos(Collection<Long> qcMaskIds) {
    Validate.notNull(qcMaskIds, EMPTY_QC_MASK_ID);

    var errorMessage = String.format(QCMASKID_SIZE_MESSAGE, qcMaskIds.size());

    if (qcMaskIds.isEmpty()) {
      LOGGER.debug("Request for QcMaskDaos by qcMaskIds was given an empty list of ids");
      return new ArrayList<>();
    } else {
      return runPartitionedQuery(
          qcMaskIds,
          PARTITION_SIZE,
          (Collection<Long> partitionedQcMaskIds) -> {
            EntityResultListFunction<QcMaskSegDao> delegateFunction =
                entityManager -> queryQcMaskSegDaos(entityManager, partitionedQcMaskIds);

            return runWithEntityManagerResultListFunction(
                delegateFunction, QCMASKSEG_ERROR, errorMessage);
          });
    }
  }

  /**
   * Query for {@link QcMaskSegDao}s using entity manager
   *
   * @param entityManager entity manager for db connection
   * @param qcMaskIds list of qc mask ids
   * @return list of qc mask ids
   */
  private static List<QcMaskSegDao> queryQcMaskSegDaos(
      EntityManager entityManager, Collection<Long> qcMaskIds) {
    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<QcMaskSegDao> query = cb.createQuery(QcMaskSegDao.class);
    Root<QcMaskSegDao> fromQcMaskSeg = query.from(QcMaskSegDao.class);

    final Path<Object> idPath = fromQcMaskSeg.get(QC_MASK_SEG_KEY);
    query.select(fromQcMaskSeg);
    query.where(idPath.get(QC_MASK_ID).in(qcMaskIds));

    return entityManager.createQuery(query).getResultList().stream().distinct().toList();
  }
}
