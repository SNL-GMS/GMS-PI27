package gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.analysis;

import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SEED_AL1_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SEED_AL2_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SEED_SOCCPRO_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SIMULATION_AL1_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SIMULATION_AL2_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SIMULATION_SOCCPRO_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SIMULATION_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.analysis.AnalysisSimulatorConfig.AL1_KEY;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.analysis.AnalysisSimulatorConfig.AL2_KEY;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.analysis.AnalysisSimulatorConfig.SOCCPRO_KEY;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.signaldetection.database.connector.AmplitudeDatabaseConnector;
import gms.shared.signaldetection.database.connector.ArrivalDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WftagDatabaseConnector;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.factory.BridgedEntityManagerFactoryProvider;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceRepository;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceSignalDetectionRepositoryJpa;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceWftagRepositoryJpa;
import jakarta.persistence.EntityManagerFactory;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ArrivalSimConfig {

  private static final String SIGNAL_SIMULATION_PERSISTENCE_UNIT = "gms_signal_simulation";
  private static final String ANALYSIS_SIMULATION_PERSISTENCE_UNIT = "gms_analysis_simulation";
  private static final String SIGNAL_SEED_PERSISTENCE_UNIT = "gms_signal_seed";

  /** ********* Arrival Connector Maps ********** */
  @Bean
  @Qualifier("arrivalDatabaseConnectorMap") public Map<String, ArrivalDatabaseConnector> arrivalDatabaseConnectorMap(
      @Qualifier("signalSoccproArrivalDatabaseConnector") ArrivalDatabaseConnector signalSoccproArrivalDatabaseConnector,
      @Qualifier("signalAl1ArrivalDatabaseConnector") ArrivalDatabaseConnector signalAl1ArrivalDatabaseConnector,
      @Qualifier("signalAl2ArrivalDatabaseConnector") ArrivalDatabaseConnector signalAl2ArrivalDatabaseConnector) {

    return Map.of(
        SOCCPRO_KEY,
        signalSoccproArrivalDatabaseConnector,
        AL1_KEY,
        signalAl1ArrivalDatabaseConnector,
        AL2_KEY,
        signalAl2ArrivalDatabaseConnector);
  }

  @Bean
  @Qualifier("amplitudeDatabaseConnectorMap") public Map<String, AmplitudeDatabaseConnector> amplitudeDatabaseConnectorMap(
      @Qualifier("signalSoccproAmplitudeDatabaseConnector") AmplitudeDatabaseConnector signalSoccproAmplitudeDatabaseConnector,
      @Qualifier("signalAl1AmplitudeDatabaseConnector") AmplitudeDatabaseConnector signalAl1AmplitudeDatabaseConnector,
      @Qualifier("signalAl2AmplitudeDatabaseConnector") AmplitudeDatabaseConnector signalAl2AmplitudeDatabaseConnector) {

    return Map.of(
        SOCCPRO_KEY,
        signalSoccproAmplitudeDatabaseConnector,
        AL1_KEY,
        signalAl1AmplitudeDatabaseConnector,
        AL2_KEY,
        signalAl2AmplitudeDatabaseConnector);
  }

  @Bean
  @Qualifier("signalDetectionBridgedDataSourceRepositoryMap") public Map<String, BridgedDataSourceRepository> signalDetectionBridgedDataSourceRepositoryMap(
      @Qualifier("signalSimSoccproEntityManagerFactory") EntityManagerFactory signalSimSoccproEntityManagerFactory,
      @Qualifier("signalSimAl1EntityManagerFactory") EntityManagerFactory signalSimAl1EntityManagerFactory,
      @Qualifier("signalSimAl2EntityManagerFactory") EntityManagerFactory signalSimAl2EntityManagerFactory) {

    return Map.of(
        SOCCPRO_KEY,
        BridgedDataSourceSignalDetectionRepositoryJpa.create(signalSimSoccproEntityManagerFactory),
        AL1_KEY,
        BridgedDataSourceSignalDetectionRepositoryJpa.create(signalSimAl1EntityManagerFactory),
        AL2_KEY,
        BridgedDataSourceSignalDetectionRepositoryJpa.create(signalSimAl2EntityManagerFactory));
  }

  /** ********* SIGNAL_SIMULATION_PERSISTENCE_UNIT EMFs ********** */
  @Bean
  @Qualifier("signalSimSoccproEntityManagerFactory") public EntityManagerFactory signalSimSoccproEntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            SIGNAL_SIMULATION_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SIMULATION_SOCCPRO_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  @Bean
  @Qualifier("signalSimAl1EntityManagerFactory") public EntityManagerFactory signalSimAl1EntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            SIGNAL_SIMULATION_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SIMULATION_AL1_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  @Bean
  @Qualifier("signalSimAl2EntityManagerFactory") public EntityManagerFactory signalSimAl2EntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            SIGNAL_SIMULATION_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SIMULATION_AL2_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  /** ********* ANALYSIS_SIMULATION_PERSISTENCE_UNIT EMFs ********** */
  @Bean
  @Qualifier("analysisSimEntityManagerFactory") public EntityManagerFactory analysisSimEntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            ANALYSIS_SIMULATION_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SIMULATION_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  /** ********* SIGNAL_SEED_PERSISTENCE_UNIT EMFs ********** */
  @Bean
  @Qualifier("signalSoccproEntityManagerFactory") public EntityManagerFactory signalSoccproEntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            SIGNAL_SEED_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SEED_SOCCPRO_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  @Bean
  @Qualifier("signalAl1EntityManagerFactory") public EntityManagerFactory signalAl1EntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            SIGNAL_SEED_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SEED_AL1_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  @Bean
  @Qualifier("signalAl2EntityManagerFactory") public EntityManagerFactory signalAl2EntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    EntityManagerFactory emf =
        entityManagerFactoryProvider.getEntityManagerFactory(
            SIGNAL_SEED_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SEED_AL2_SYSTEM_CONFIG_ROOT));
    return emf;
  }

  /** ********* Signal Arrival Connectors ********** */
  @Bean
  @Qualifier("signalSoccproArrivalDatabaseConnector") public ArrivalDatabaseConnector signalSoccproArrivalDatabaseConnector(
      @Qualifier("signalSoccproEntityManagerFactory") EntityManagerFactory signalSoccproEntityManagerFactory) {
    return new ArrivalDatabaseConnector(signalSoccproEntityManagerFactory);
  }

  @Bean
  @Qualifier("signalAl1ArrivalDatabaseConnector") public ArrivalDatabaseConnector signalAl1EventDatabaseConnector(
      @Qualifier("signalAl1EntityManagerFactory") EntityManagerFactory signalAl1EntityManagerFactory) {
    return new ArrivalDatabaseConnector(signalAl1EntityManagerFactory);
  }

  @Bean
  @Qualifier("signalAl2ArrivalDatabaseConnector") public ArrivalDatabaseConnector signalAl2EventDatabaseConnector(
      @Qualifier("signalAl2EntityManagerFactory") EntityManagerFactory signalAl2EntityManagerFactory) {
    return new ArrivalDatabaseConnector(signalAl2EntityManagerFactory);
  }

  /** ********* Signal Amplitude Connectors ********** */
  @Bean
  @Qualifier("signalSoccproAmplitudeDatabaseConnector") public AmplitudeDatabaseConnector signalSoccproAmplitudeDatabaseConnector(
      @Qualifier("signalSoccproEntityManagerFactory") EntityManagerFactory signalSoccproEntityManagerFactory) {
    return new AmplitudeDatabaseConnector(signalSoccproEntityManagerFactory);
  }

  @Bean
  @Qualifier("signalAl1AmplitudeDatabaseConnector") public AmplitudeDatabaseConnector signalAl1AmplitudeDatabaseConnector(
      @Qualifier("signalAl1EntityManagerFactory") EntityManagerFactory signalAl1EntityManagerFactory) {
    return new AmplitudeDatabaseConnector(signalAl1EntityManagerFactory);
  }

  @Bean
  @Qualifier("signalAl2AmplitudeDatabaseConnector") public AmplitudeDatabaseConnector signalAl2AmplitudeDatabaseConnector(
      @Qualifier("signalAl2EntityManagerFactory") EntityManagerFactory signalAl2EntityManagerFactory) {
    return new AmplitudeDatabaseConnector(signalAl2EntityManagerFactory);
  }

  /** ********** Station Def Connector Maps ********** */
  @Bean
  @Qualifier("wfTagDatabaseConnector") public WftagDatabaseConnector wfTagDatabaseConnector(
      @Qualifier("stationDefinitionEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new WftagDatabaseConnector(entityManagerFactory);
  }

  /** ********** Analysis Sim Repositories ********** */
  @Bean
  @Qualifier("bridgedDataSourceWftagRepositoryJpa") public BridgedDataSourceRepository bridgedDataSourceWftagRepositoryJpa(
      @Qualifier("analysisSimEntityManagerFactory") EntityManagerFactory analysisSimEntityManagerFactory) {
    return BridgedDataSourceWftagRepositoryJpa.create(analysisSimEntityManagerFactory);
  }
}
