package gms.shared.utilities.bridge.database.connector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.RollbackException;

@FunctionalInterface
public interface EntityVoidFunction {
  void apply(EntityManager entityManager) throws IllegalStateException, RollbackException;
}
