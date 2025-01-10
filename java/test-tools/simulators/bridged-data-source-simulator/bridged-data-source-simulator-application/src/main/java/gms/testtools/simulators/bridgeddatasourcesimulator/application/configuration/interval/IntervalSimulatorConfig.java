package gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.interval;

import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SEED_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SIMULATION_SYSTEM_CONFIG_ROOT;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.workflow.repository.IntervalDatabaseConnector;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.factory.BridgedEntityManagerFactoryProvider;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceIntervalRepositoryJpa;
import jakarta.persistence.EntityManagerFactory;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class IntervalSimulatorConfig {

  private static final String WORKFLOW_PERSISTENCE_UNIT = "workflow-dao-seed";
  private static final String WORKFLOW_SIMULATION_PERSISTENCE_UNIT = "workflow-dao-simulation";

  @Bean
  @Qualifier("bridgedDataSourceIntervalRepositoryJpa") public BridgedDataSourceIntervalRepositoryJpa bridgedDataSourceIntervalRepositoryJpa(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    BridgedDataSourceIntervalRepositoryJpa repo =
        BridgedDataSourceIntervalRepositoryJpa.create(
            entityManagerFactoryProvider.getEntityManagerFactory(
                WORKFLOW_SIMULATION_PERSISTENCE_UNIT,
                simulatorSystemConfigMap.get(SIMULATION_SYSTEM_CONFIG_ROOT)));
    return repo;
  }

  @Bean
  @Qualifier("intervalDatabaseConnector") public IntervalDatabaseConnector intervalDatabaseConnector(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            WORKFLOW_PERSISTENCE_UNIT, simulatorSystemConfigMap.get(SEED_SYSTEM_CONFIG_ROOT));

    return new IntervalDatabaseConnector(emf);
  }
}
