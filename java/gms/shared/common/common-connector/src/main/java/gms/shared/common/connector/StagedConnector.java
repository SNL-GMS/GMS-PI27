package gms.shared.common.connector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.List;
import java.util.Optional;
import java.util.function.BiFunction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Common persistence interface for fetching particular Daos from different stages by the Criteria
 * api. Implementations need to provide the Dao class and access to {@link EntityManager}s for every
 * stage. All base queries require a stage in order to leverage the right {@link EntityManager}.
 *
 * @param <T> The type of Dao this Connector queries for.
 */
public interface StagedConnector<T> {

  Logger logger = LoggerFactory.getLogger(StagedConnector.class);

  /**
   * Accessor method for the Dao type, used to create typed Queries
   *
   * @return type of Dao this Connector queries for.
   */
  Class<T> getDaoClass();

  /**
   * Accessor method for the {@link EntityManager} representing a jpa connection to the database for
   * a given stage.
   *
   * @param stage stage to fetch data from
   * @return the jpa connection to the database, or an empty Optional if no connection exists for
   *     that stage
   */
  Optional<EntityManager> getEntityManager(String stage);

  /**
   * Queries for a single Dao given a stage and Criteria {@link Predicate} generation function.
   *
   * @param stage stage to fetch data from
   * @param whereFunction Criteria Predicate generation function
   * @return An optional containing a Dao value if found, or empty if no result was found
   */
  default Optional<T> queryForSingle(
      String stage, BiFunction<CriteriaBuilder, Root<T>, Predicate> whereFunction) {

    Optional<EntityManager> entityManager = Optional.empty();
    try {
      entityManager = getEntityManager(stage);

      return entityManager
          .map(em -> buildQuery(em, whereFunction))
          .map(TypedQuery::getSingleResult);
    } catch (NoResultException e) {
      logger.debug("No Result Found. Returning empty Optional", e);
      return Optional.empty();
    } finally {
      entityManager.ifPresent(this::handleEntityManager);
    }
  }

  /**
   * Queries for multiple Daos given a stage and Criteria {@link Predicate} generation function.
   *
   * @param stage stage to fetch data from
   * @param whereFunction Criteria Predicate generation function
   * @return A List of result Daos. Can be empty if no values were found.
   */
  default List<T> queryForAll(
      String stage, BiFunction<CriteriaBuilder, Root<T>, Predicate> whereFunction) {

    Optional<EntityManager> entityManager = Optional.empty();
    try {
      entityManager = getEntityManager(stage);

      return entityManager
          .map(em -> buildQuery(em, whereFunction))
          .map(TypedQuery::getResultList)
          .orElseGet(List::of);
    } finally {
      entityManager.ifPresent(this::handleEntityManager);
    }
  }

  /**
   * Handle an {@link EntityManager} once the query ends. Does nothing by default, as the same
   * EntityManager can be reused, and its lifecycle handled elsewhere.
   *
   * @param entityManager The jpa connection for querying data
   */
  default void handleEntityManager(EntityManager entityManager) {}

  private TypedQuery<T> buildQuery(
      EntityManager entityManager, BiFunction<CriteriaBuilder, Root<T>, Predicate> whereFunction) {

    var criteriaBuilder = entityManager.getCriteriaBuilder();
    var criteriaQuery = criteriaBuilder.createQuery(getDaoClass());
    var fromDao = criteriaQuery.from(getDaoClass());

    criteriaQuery.select(fromDao);
    criteriaQuery.where(whereFunction.apply(criteriaBuilder, fromDao));

    return entityManager.createQuery(criteriaQuery);
  }
}
