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
 * Common persistence interface for fetching particular Daos by the Criteria api. Implementations
 * need to provide the Dao class and access to an {@link EntityManager}
 *
 * @param <T> The type of Dao this Connector queries for.
 */
public interface Connector<T> {

  Logger logger = LoggerFactory.getLogger(Connector.class);

  /**
   * Accessor method for the Dao type, used to create typed Queries
   *
   * @return type of Dao this Connector queries for.
   */
  Class<T> getDaoClass();

  /**
   * Accessor method for the {@link EntityManager} representing a jpa connection to the database.
   *
   * @return the jpa connection to the database
   */
  EntityManager getEntityManager();

  /**
   * Queries for a single Dao given a Criteria {@link Predicate} generation function.
   *
   * @param whereFunction Criteria Predicate generation function
   * @return An optional containing a Dao value if found, or empty if no result was found
   */
  default Optional<T> queryForSingle(
      BiFunction<CriteriaBuilder, Root<T>, Predicate> whereFunction) {

    EntityManager entityManager = null;
    try {
      entityManager = getEntityManager();
      TypedQuery<T> query = buildQuery(entityManager, whereFunction);
      return Optional.of(query.getSingleResult());
    } catch (NoResultException e) {
      logger.debug("No Result Found. Returning empty Optional", e);
      return Optional.empty();
    } finally {
      if (entityManager != null) {
        handleEntityManager(entityManager);
      }
    }
  }

  /**
   * Queries for multiple Daos given a Criteria {@link Predicate} generation function.
   *
   * @param whereFunction Criteria Predicate generation function
   * @return A List of result Daos. Can be empty if no values were found.
   */
  default List<T> queryForAll(BiFunction<CriteriaBuilder, Root<T>, Predicate> whereFunction) {
    EntityManager entityManager = null;
    try {
      entityManager = getEntityManager();
      TypedQuery<T> query = buildQuery(entityManager, whereFunction);
      return query.getResultList();
    } finally {
      if (entityManager != null) {
        handleEntityManager(entityManager);
      }
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
