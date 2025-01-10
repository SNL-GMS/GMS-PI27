package gms.shared.signaldetection.database.connector;

import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityResultListFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.criteria.Predicate;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import org.apache.commons.lang3.Validate;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope(BeanDefinition.SCOPE_PROTOTYPE)
public class AssocDatabaseConnector extends DatabaseConnector {

  private static final String ARRIVAL_ID = "arrivalId";
  private static final String ORIGIN_ID = "originId";
  private static final String ID = "id";

  static final String ASSOC_ARIDS_ERROR = "Assocs by arids exception";
  static final String ASSOC_ORIDS_ERROR = "Assocs by orids exception";
  static final String ASSOC_ARIDS_ORIDS_ERROR = "Assocs by arids and orids exception";
  static final String ARIDS_SIZE_MESSAGE = "arids size = %s";
  static final String ORIDS_SIZE_MESSAGE = "orids size = %s";
  static final String ARIDS_ORIDS_SIZE_MESSAGE = "arid and orid list size = %s";

  @Autowired
  public AssocDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  public List<AssocDao> findAssocsByArids(Collection<Long> arids) {
    Objects.requireNonNull(arids, "Arids cannot be null");

    var errorMessage = String.format(ARIDS_SIZE_MESSAGE, arids.size());
    if (arids.isEmpty()) {
      return List.of();
    } else {
      return runPartitionedQuery(
          arids,
          1000,
          (Collection<Long> partitionedArids) -> {
            EntityResultListFunction<AssocDao> delegateFunction =
                (EntityManager entityManager) -> {
                  var criteriaBuilder = entityManager.getCriteriaBuilder();
                  var query = criteriaBuilder.createQuery(AssocDao.class);
                  var fromAssoc = query.from(AssocDao.class);
                  var idPath = fromAssoc.get(ID);
                  query.select(fromAssoc).where(idPath.get(ARRIVAL_ID).in(partitionedArids));

                  return entityManager.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunction, ASSOC_ARIDS_ERROR, errorMessage);
          });
    }
  }

  /**
   * Retrieves a list of AssocDaos that match the passed in list of ORIDs
   *
   * @param orids the ORIDs to find
   * @return a list of AssocDaos matching the ORIDs passed in
   */
  public List<AssocDao> findAssocsByOrids(Collection<Long> orids) {
    Validate.notNull(orids, "OriginIds cannot be null!");

    var errorMessage = String.format(ORIDS_SIZE_MESSAGE, orids.size());
    if (orids.isEmpty()) {
      return List.of();
    } else {
      return runPartitionedQuery(
          orids,
          1000,
          (Collection<Long> partitionedOrids) -> {
            EntityResultListFunction<AssocDao> delegateFunction =
                (EntityManager entityManager) -> {
                  var criteriaBuilder = entityManager.getCriteriaBuilder();
                  var query = criteriaBuilder.createQuery(AssocDao.class);
                  var fromAssoc = query.from(AssocDao.class);
                  var idPath = fromAssoc.get(ID);
                  query.select(fromAssoc).where(idPath.get(ORIGIN_ID).in(partitionedOrids));

                  return entityManager.createQuery(query).getResultList();
                };

            return runWithEntityManagerResultListFunction(
                delegateFunction, ASSOC_ORIDS_ERROR, errorMessage);
          });
    }
  }

  /**
   * Retrieves a list of AssocDaos that match the passed in list of pairs of arids and orids
   *
   * @param aridOridList the list of pairs of arids and orids
   * @return a list of AssocDaos matching the arids and orids passed in
   */
  public List<AssocDao> findAssocsByAridsAndOrids(Collection<Pair<Long, Long>> aridOridList) {
    Validate.notNull(aridOridList, "Arids and Orids cannot be null!");

    var errorMessage = String.format(ARIDS_ORIDS_SIZE_MESSAGE, aridOridList.size());
    if (aridOridList.isEmpty()) {
      return List.of();
    } else {
      return runPartitionedQuery(
          aridOridList,
          1000,
          (Collection<Pair<Long, Long>> partitionedAridsOrids) -> {
            EntityResultListFunction<AssocDao> delegateFunction =
                (EntityManager entityManager) ->
                    buildDelegateFunction(entityManager, partitionedAridsOrids);

            return runWithEntityManagerResultListFunction(
                delegateFunction, ASSOC_ARIDS_ORIDS_ERROR, errorMessage);
          });
    }
  }

  private static List<AssocDao> buildDelegateFunction(
      EntityManager entityManager, Collection<Pair<Long, Long>> partitionedAridsOrids) {
    var cb = entityManager.getCriteriaBuilder();
    var query = cb.createQuery(AssocDao.class);
    var fromAssoc = query.from(AssocDao.class);
    var idPath = fromAssoc.get(ID);

    // stream through the list of arid/orid pairs and create predicate for primary
    // keys
    query
        .select(fromAssoc)
        .where(
            cb.or(
                partitionedAridsOrids.stream()
                    .map(
                        aridOridPair ->
                            cb.and(
                                cb.equal(idPath.get(ARRIVAL_ID), aridOridPair.getLeft()),
                                cb.equal(idPath.get(ORIGIN_ID), aridOridPair.getRight())))
                    .toArray(Predicate[]::new)));

    return entityManager.createQuery(query).getResultList();
  }
}
