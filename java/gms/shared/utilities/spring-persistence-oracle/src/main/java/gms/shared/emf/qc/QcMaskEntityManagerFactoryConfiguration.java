package gms.shared.emf.qc;

import static com.google.common.base.Preconditions.checkNotNull;

import com.mchange.v2.c3p0.DataSources;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.spring.persistence.EmfFactory;
import jakarta.persistence.EntityManagerFactory;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

/** Provides new {@link jakarta.persistence.EntityManagerFactory} instances */
@Configuration
@ComponentScan(basePackages = "gms.shared.spring")
public class QcMaskEntityManagerFactoryConfiguration {

  /**
   * QcMask DataSource that reads jdbc connection parameters from system configuration
   *
   * @return jdbc DataSource
   */
  @Bean
  @Qualifier("qc") @Scope(BeanDefinition.SCOPE_PROTOTYPE)
  public DataSource qcDataSource(
      SystemConfig systemConfig, @Value("${qcMaskJdbcUrlConfig}") String qcMaskJdbcUrlConfig) {
    String qcMaskJdbcUrl = systemConfig.getValue(qcMaskJdbcUrlConfig);
    checkNotNull(qcMaskJdbcUrl, "jdbc_url cannot be null.");

    try {
      var unpooledDataSource = DataSources.unpooledDataSource(qcMaskJdbcUrl);

      return DataSources.pooledDataSource(unpooledDataSource);
    } catch (SQLException e) {
      throw new IllegalStateException(e);
    }
  }

  /**
   * Provides new {@link jakarta.persistence.EntityManagerFactory}s using the
   *
   * @param qcMaskPersistenceUnitName autowired persistence unit name
   * @param connectionPoolSize autowired connection pool size
   * @param dataSource DataSource for QC-related connections
   * @param emfFactory Factory bean to help create EntityManagerFactories
   * @return new EntityManagerFactory using the provided schema
   */
  @Bean(name = "qcEntityManagerFactory")
  @Scope(BeanDefinition.SCOPE_PROTOTYPE)
  public EntityManagerFactory entityManagerFactory(
      @Value("${qcMaskPersistenceUnitName}") String qcMaskPersistenceUnitName,
      @Value("${gms.persistence.connection_pool_size:2}") int connectionPoolSize,
      @Qualifier("qc") DataSource dataSource,
      EmfFactory emfFactory) {

    return emfFactory.create(dataSource, qcMaskPersistenceUnitName, connectionPoolSize);
  }
}
