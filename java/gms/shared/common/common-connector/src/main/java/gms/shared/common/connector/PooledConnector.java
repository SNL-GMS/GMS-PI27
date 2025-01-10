package gms.shared.common.connector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;

/**
 * Extension of {@link Connector} that leverages an {@link EntityManagerFactory}, retrieving a
 * database connection with every query
 *
 * @param <T> The type of Dao this Connector queries for.
 */
public interface PooledConnector<T> extends Connector<T> {

  EntityManagerFactory getEntityManagerFactory();

  @Override
  default EntityManager getEntityManager() {
    return getEntityManagerFactory().createEntityManager();
  }

  /**
   * {@inheritDoc } As {@link EntityManager}s are now being retrieved from a connection pool, that
   * connection needs to be freed once the query is finished.
   */
  @Override
  default void handleEntityManager(EntityManager entityManager) {
    entityManager.close();
  }
}
