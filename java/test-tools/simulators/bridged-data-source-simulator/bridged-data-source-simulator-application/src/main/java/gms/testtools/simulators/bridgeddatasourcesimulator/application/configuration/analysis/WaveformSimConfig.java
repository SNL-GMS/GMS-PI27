package gms.testtools.simulators.bridgeddatasourcesimulator.application.configuration.analysis;

import gms.shared.stationdefinition.database.connector.BeamDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceRepository;
import gms.testtools.simulators.bridgeddatasourcesimulator.repository.BridgedDataSourceWaveformRepositoryJpa;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WaveformSimConfig {

  /** ********** Station Def Connector Maps ********** */
  @Bean
  @Qualifier("wfdiscDatabaseConnector") public WfdiscDatabaseConnector wfdiscDatabaseConnector(
      @Qualifier("stationDefinitionEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new WfdiscDatabaseConnector(entityManagerFactory);
  }

  @Bean
  @Qualifier("beamDatabaseConnector") public BeamDatabaseConnector beamDatabaseConnector(
      @Qualifier("stationDefinitionEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
    return new BeamDatabaseConnector(entityManagerFactory);
  }

  /** ********** Waveform Repositories ********** */
  @Bean
  @Qualifier("bridgedDataSourceWaveformRepositoryJpa") public BridgedDataSourceRepository bridgedDataSourceWaveformRepositoryJpa(
      @Qualifier("analysisSimEntityManagerFactory") EntityManagerFactory analysisSimEntityManagerFactory) {
    return BridgedDataSourceWaveformRepositoryJpa.create(analysisSimEntityManagerFactory);
  }
}
