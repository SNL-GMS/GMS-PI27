package gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.stationdefinition;

import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SEED_SYSTEM_CONFIG_ROOT;
import static gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.BridgedDataSourceSimulatorConfiguration.SIMULATION_SYSTEM_CONFIG_ROOT;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.database.connector.AffiliationDatabaseConnector;
import gms.shared.stationdefinition.database.connector.InstrumentDatabaseConnector;
import gms.shared.stationdefinition.database.connector.NetworkDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.testtools.simulators.bridgeddatasourcesimulator.application.factory.BridgedEntityManagerFactoryProvider;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceStationRepositoryJpa;
import jakarta.persistence.EntityManagerFactory;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StationDefinitionSimulatorConfig {

  public static final String STATION_DEFINITION_PERSISTENCE_UNIT = "gms_station_definition_seed";
  public static final String STATION_DEFINITION_SIMULATION_PERSISTENCE_UNIT =
      "gms_station_definition_simulation";

  @Bean
  @Qualifier("bridgedDataSourceStationRepositoryJpa") public BridgedDataSourceStationRepositoryJpa bridgedDataSourceStationRepositoryJpa(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    return new BridgedDataSourceStationRepositoryJpa(
        entityManagerFactoryProvider.getEntityManagerFactory(
            STATION_DEFINITION_SIMULATION_PERSISTENCE_UNIT,
            simulatorSystemConfigMap.get(SIMULATION_SYSTEM_CONFIG_ROOT)));
  }

  @Bean
  @Qualifier("stationDefinitionEntityManagerFactory") public EntityManagerFactory stationDefinitionEntityManagerFactory(
      BridgedEntityManagerFactoryProvider entityManagerFactoryProvider,
      @Qualifier("simulatorSystemConfigMap") Map<String, SystemConfig> simulatorSystemConfigMap) {
    return entityManagerFactoryProvider.getEntityManagerFactory(
        STATION_DEFINITION_PERSISTENCE_UNIT, simulatorSystemConfigMap.get(SEED_SYSTEM_CONFIG_ROOT));
  }

  @Bean
  @Qualifier("networkDatabaseConnector") public NetworkDatabaseConnector networkDatabaseConnector(
      @Qualifier("stationDefinitionEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new NetworkDatabaseConnector(entityManagerFactory);
  }

  @Bean
  @Qualifier("affiliationDatabaseConnector") public AffiliationDatabaseConnector affiliationDatabaseConnector(
      @Qualifier("stationDefinitionEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new AffiliationDatabaseConnector(entityManagerFactory);
  }

  @Bean
  @Qualifier("siteDatabaseConnector") public SiteDatabaseConnector siteDatabaseConnector(
      @Qualifier("stationDefinitionEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new SiteDatabaseConnector(entityManagerFactory);
  }

  @Bean
  @Qualifier("siteChanDatabaseConnector") public SiteChanDatabaseConnector siteChanDatabaseConnector(
      @Qualifier("stationDefinitionEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new SiteChanDatabaseConnector(entityManagerFactory);
  }

  @Bean
  @Qualifier("sensorDatabaseConnector") public SensorDatabaseConnector sensorDatabaseConnector(
      @Qualifier("stationDefinitionEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new SensorDatabaseConnector(entityManagerFactory);
  }

  @Bean
  @Qualifier("instrumentDatabaseConnector") public InstrumentDatabaseConnector instrumentDatabaseConnector(
      @Qualifier("stationDefinitionEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new InstrumentDatabaseConnector(entityManagerFactory);
  }
}
