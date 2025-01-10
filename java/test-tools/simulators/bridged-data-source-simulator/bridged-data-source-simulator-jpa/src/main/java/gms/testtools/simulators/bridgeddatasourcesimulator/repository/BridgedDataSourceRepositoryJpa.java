package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.EntityVoidFunction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.util.List;
import java.util.Objects;

// TODO: The bridged repo tests may need to create the full SystemConfig rather than mocks
public class BridgedDataSourceRepositoryJpa extends DatabaseConnector {

  private static final int BATCH_SIZE = 100;

  protected BridgedDataSourceRepositoryJpa(EntityManagerFactory entityManagerFactory) {
    super(entityManagerFactory);
  }

  /**
   * Initializes a {@link BridgedDataSourceRepositoryJpa} to be used against the simulation schema.
   *
   * @param entityManagerFactory - An {@link EntityManagerFactory} that is configured to connect to
   *     the simulation schema.
   * @return a {@link BridgedDataSourceRepositoryJpa} to be used against the simulation schema.
   */
  public static BridgedDataSourceRepositoryJpa create(EntityManagerFactory entityManagerFactory) {
    Objects.requireNonNull(entityManagerFactory);
    return new BridgedDataSourceRepositoryJpa(entityManagerFactory);
  }

  /**
   * Truncates the specified table qualified by schema and table name
   *
   * @param daoClass the type of dao to delete
   * @param entityManager the entity manager connected to a specific persistence unit
   */
  public void cleanupTable(Class<?> daoClass, EntityManager entityManager) {
    Objects.requireNonNull(entityManager);
    Objects.requireNonNull(daoClass);

    var builder = entityManager.getCriteriaBuilder();
    var deleteQuery = builder.createCriteriaDelete(daoClass);
    deleteQuery.from((Class) daoClass);
    entityManager.createQuery(deleteQuery).executeUpdate();
  }

  /**
   * Store the provided data in the simulation schema
   *
   * @param simulationData - A collection of data of type {@link T} to be stored in the simulation
   *     schema.
   * @param <T> the type of simulation data to store
   */
  public <T> void store(List<T> simulationData) {
    Objects.requireNonNull(simulationData, "Simulation data cannot be null");
    EntityVoidFunction delegateFunc =
        (entityManager) -> {
          entityManager.getTransaction().begin();

          var count = 0;
          for (T data : simulationData) {
            entityManager.persist(data);
            count += 1;
            if (count % BATCH_SIZE == 0) {
              entityManager.flush();
              entityManager.clear();
              entityManager.getTransaction().commit();
              entityManager.getTransaction().begin();
            }
          }
          entityManager.getTransaction().commit();
        };

    var errMessage = this.getClass().getSimpleName() + ".cleanupData() error.";
    runWithEntityManagerVoidFunction(delegateFunc, errMessage);
  }
}
