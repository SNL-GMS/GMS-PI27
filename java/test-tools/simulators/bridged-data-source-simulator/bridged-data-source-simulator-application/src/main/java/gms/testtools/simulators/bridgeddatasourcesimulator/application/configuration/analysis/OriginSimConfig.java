package gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.analysis;

import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SEED_AL1_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SEED_AL2_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SEED_SOCCPRO_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SIMULATION_AL1_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SIMULATION_AL2_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SIMULATION_SOCCPRO_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.analysis.AnalysisSimulatorConfig.AL1_KEY;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.analysis.AnalysisSimulatorConfig.AL2_KEY;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.analysis.AnalysisSimulatorConfig.SOCCPRO_KEY;

import gms.shared.event.connector.EventDatabaseConnector;
import gms.shared.event.connector.OriginErrDatabaseConnector;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.testtools.simulators.bridgeddatasourceanalysissimulator.connector.OriginSimulatorDatabaseConnector;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.factory.BridgedEntityManagerFactoryProvider;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceOriginRepositoryJpa;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceRepository;
import jakarta.persistence.EntityManagerFactory;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OriginSimConfig {
  private static final String ORIGIN_PERSISTENCE_UNIT = "gms_origin_seed";
  private static final String ORIGIN_SIMULATION_PERSISTENCE_UNIT = "gms_origin_simulation";

  /** ********* Origin Connector Maps ********** */
  @Bean
  @Qualifier("originSimulatorDatabaseConnectorMap") public Map<String, OriginSimulatorDatabaseConnector> originSimulatorDatabaseConnectorMap(
      @Qualifier("seedSoccproOriginSimulatorDatabaseConnector") OriginSimulatorDatabaseConnector seedSoccproOriginSimulatorDatabaseConnector,
      @Qualifier("seedAl1OriginSimulatorDatabaseConnector") OriginSimulatorDatabaseConnector seedAl1OriginSimulatorDatabaseConnector,
      @Qualifier("seedAl2OriginSimulatorDatabaseConnector") OriginSimulatorDatabaseConnector seedAl2OriginSimulatorDatabaseConnector) {

    return Map.of(
        SOCCPRO_KEY,
        seedSoccproOriginSimulatorDatabaseConnector,
        AL1_KEY,
        seedAl1OriginSimulatorDatabaseConnector,
        AL2_KEY,
        seedAl2OriginSimulatorDatabaseConnector);
  }

  @Bean
  @Qualifier("eventDatabaseConnectorMap") public Map<String, EventDatabaseConnector> eventDatabaseConnectorMap(
      @Qualifier("seedSoccproEventDatabaseConnector") EventDatabaseConnector seedSoccproEventDatabaseConnector,
      @Qualifier("seedAl1EventDatabaseConnector") EventDatabaseConnector seedAl1EventDatabaseConnector,
      @Qualifier("seedAl2EventDatabaseConnector") EventDatabaseConnector seedAl2EventDatabaseConnector) {
    return Map.of(
        SOCCPRO_KEY,
        seedSoccproEventDatabaseConnector,
        AL1_KEY,
        seedAl1EventDatabaseConnector,
        AL2_KEY,
        seedAl2EventDatabaseConnector);
  }

  @Bean
  @Qualifier("originErrDatabaseConnectorMap") public Map<String, OriginErrDatabaseConnector> originErrDatabaseConnectorMap(
      @Qualifier("seedSoccproOriginErrDatabaseConnector") OriginErrDatabaseConnector seedSoccproOriginErrDatabaseConnector,
      @Qualifier("seedAl1OriginErrDatabaseConnector") OriginErrDatabaseConnector seedAl1OriginErrDatabaseConnector,
      @Qualifier("seedAl2OriginErrDatabaseConnector") OriginErrDatabaseConnector seedAl2OriginErrDatabaseConnector) {

    return Map.of(
        SOCCPRO_KEY,
        seedSoccproOriginErrDatabaseConnector,
        AL1_KEY,
        seedAl1OriginErrDatabaseConnector,
        AL2_KEY,
        seedAl2OriginErrDatabaseConnector);
  }

  @Bean
  @Qualifier("originBridgedDataSourceRepositoryMap") public Map<String, BridgedDataSourceRepository> originBridgedDataSourceRepositoryMap(
      @Qualifier("originSimSoccproEntityManagerFactory") EntityManagerFactory originSimSoccproEntityManagerFactory,
      @Qualifier("originSimAl1EntityManagerFactory") EntityManagerFactory originSimAl1EntityManagerFactory,
      @Qualifier("originSimAl2EntityManagerFactory") EntityManagerFactory originSimAl2EntityManagerFactory) {

    return Map.of(
        SOCCPRO_KEY,
        BridgedDataSourceOriginRepositoryJpa.create(originSimSoccproEntityManagerFactory),
        AL1_KEY,
        BridgedDataSourceOriginRepositoryJpa.create(originSimAl1EntityManagerFactory),
        AL2_KEY,
        BridgedDataSourceOriginRepositoryJpa.create(originSimAl2EntityManagerFactory));
  }

  /** ********* Origin EMFs ********** */
  @Bean
  @Qualifier("seedSoccproEntityManagerFactory") public EntityManagerFactory seedSoccproEntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    System.out.println("***seedSoccproEntityManagerFactory");
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            ORIGIN_PERSISTENCE_UNIT, simulatorSystemConfigMap.get(SEED_SOCCPRO_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  @Bean
  @Qualifier("seedAl1EntityManagerFactory") public EntityManagerFactory seedAl1EntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            ORIGIN_PERSISTENCE_UNIT, simulatorSystemConfigMap.get(SEED_AL1_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  @Bean
  @Qualifier("seedAl2EntityManagerFactory") public EntityManagerFactory seedAl2EntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            ORIGIN_PERSISTENCE_UNIT, simulatorSystemConfigMap.get(SEED_AL2_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  /** ********* Origin Sim EMFs ********** */
  @Bean
  @Qualifier("originSimSoccproEntityManagerFactory") public EntityManagerFactory originSimSoccproEntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            ORIGIN_SIMULATION_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SIMULATION_SOCCPRO_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  @Bean
  @Qualifier("originSimAl1EntityManagerFactory") public EntityManagerFactory originSimAl1EntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            ORIGIN_SIMULATION_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SIMULATION_AL1_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  @Bean
  @Qualifier("originSimAl2EntityManagerFactory") public EntityManagerFactory originSimAl2EntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            ORIGIN_SIMULATION_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SIMULATION_AL2_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  /** ********** Origin Seed Connectors ********** */
  @Bean
  @Qualifier("seedSoccproEventDatabaseConnector") public EventDatabaseConnector seedSoccproEventDatabaseConnector(
      @Qualifier("seedSoccproEntityManagerFactory") EntityManagerFactory seedSoccproEntityManagerFactory) {
    return new EventDatabaseConnector(seedSoccproEntityManagerFactory);
  }

  @Bean
  @Qualifier("seedAl1EventDatabaseConnector") public EventDatabaseConnector seedAl1EventDatabaseConnector(
      @Qualifier("seedAl1EntityManagerFactory") EntityManagerFactory seedAl1EntityManagerFactory) {
    return new EventDatabaseConnector(seedAl1EntityManagerFactory);
  }

  @Bean
  @Qualifier("seedAl2EventDatabaseConnector") public EventDatabaseConnector seedAl2EventDatabaseConnector(
      @Qualifier("seedAl2EntityManagerFactory") EntityManagerFactory seedAl2EntityManagerFactory) {
    return new EventDatabaseConnector(seedAl2EntityManagerFactory);
  }

  @Bean
  @Qualifier("seedAl1OriginErrDatabaseConnector") public OriginErrDatabaseConnector seedAl1OriginErrDatabaseConnector(
      @Qualifier("seedAl1EntityManagerFactory") EntityManagerFactory seedAl1EntityManagerFactory) {
    return new OriginErrDatabaseConnector(seedAl1EntityManagerFactory);
  }

  @Bean
  @Qualifier("seedAl2OriginErrDatabaseConnector") public OriginErrDatabaseConnector seedAl2OriginErrDatabaseConnector(
      @Qualifier("seedAl2EntityManagerFactory") EntityManagerFactory seedAl2EntityManagerFactory) {
    return new OriginErrDatabaseConnector(seedAl2EntityManagerFactory);
  }

  @Bean
  @Qualifier("seedSoccproOriginSimulatorDatabaseConnector") public OriginSimulatorDatabaseConnector seedSoccproOriginSimulatorDatabaseConnector(
      @Qualifier("seedSoccproEntityManagerFactory") EntityManagerFactory seedSoccproEntityManagerFactory) {
    return new OriginSimulatorDatabaseConnector(seedSoccproEntityManagerFactory);
  }

  @Bean
  @Qualifier("seedSoccproOriginErrDatabaseConnector") public OriginErrDatabaseConnector seedSoccproOriginErrDatabaseConnector(
      @Qualifier("seedSoccproEntityManagerFactory") EntityManagerFactory seedSoccproEntityManagerFactory) {
    return new OriginErrDatabaseConnector(seedSoccproEntityManagerFactory);
  }

  @Bean
  @Qualifier("seedAl1OriginErrDatabaseConnector") public OriginSimulatorDatabaseConnector seedAl1OriginSimulatorDatabaseConnector(
      @Qualifier("seedAl1EntityManagerFactory") EntityManagerFactory seedAl1EntityManagerFactory) {
    return new OriginSimulatorDatabaseConnector(seedAl1EntityManagerFactory);
  }

  @Bean
  @Qualifier("seedAl2OriginErrDatabaseConnector") public OriginSimulatorDatabaseConnector seedAl2OriginSimulatorDatabaseConnector(
      @Qualifier("seedAl2EntityManagerFactory") EntityManagerFactory seedAl2EntityManagerFactory) {
    return new OriginSimulatorDatabaseConnector(seedAl2EntityManagerFactory);
  }
}
