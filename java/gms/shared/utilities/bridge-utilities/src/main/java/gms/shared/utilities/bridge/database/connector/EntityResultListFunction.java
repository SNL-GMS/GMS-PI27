package gms.shared.utilities.bridge.database.connector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import java.util.List;

/**
 * Entity manager function that returns a list of results
 *
 * @param <T> output object type
 */
@FunctionalInterface
public interface EntityResultListFunction<T> {
  List<T> apply(EntityManager entityManager)
      throws PersistenceException, IllegalStateException, DatabaseConnectorException;
}
