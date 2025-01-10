package gms.shared.utilities.bridge.database.connector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;

/**
 * Entity manager function that returns a single result
 *
 * @param <T> output object type
 */
@FunctionalInterface
public interface EntitySingleResultFunction<T> {
  T apply(EntityManager entityManager)
      throws PersistenceException, IllegalStateException, DatabaseConnectorException;
}
