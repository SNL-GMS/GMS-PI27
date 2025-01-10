package gms.shared.common.connector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.util.Optional;

/**
 * Extension of {@link StagedConnector} that leverages an {@link EntityManagerFactory}, retrieving a
 * database connection with every query
 *
 * @param <T> The type of Dao this Connector queries for.
 */
public interface PooledStagedConnector<T> extends StagedConnector<T> {

  Optional<EntityManagerFactory> getEntityManagerFactory(String stage);

  @Override
  default Optional<EntityManager> getEntityManager(String stage) {
    return getEntityManagerFactory(stage).map(EntityManagerFactory::createEntityManager);
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
