package gms.shared.spring.persistence;

import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.support.DatabaseStartupValidator;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;

/**
 * This class represents a Spring Configuration collection of important beans used in establishing
 * connections to our Oracle database.
 */
@Configuration
@ConditionalOnProperty(prefix = "gms.persistence.oracle", name = "account")
public class OraclePersistenceConfiguration {

  private static final int SECONDS_BETWEEN_RUNS = 30;

  @Bean
  @Qualifier("oracle") public DataSource oracleDataSource(
      OracleDataSourceFactory dataSourceFactory,
      @Value("${gms.persistence.oracle.account}") String account) {
    return dataSourceFactory.getDataSource(account);
  }

  @Bean
  @Qualifier("oracle") public DatabaseStartupValidator oracleSingleDataSourceStartupValidator(
      @Qualifier("oracle") DataSource dataSource,
      @Value("${gms.persistence.oracle.validation_timeout_seconds:300}")
          int validationTimeoutSeconds) {

    var dsv = new DatabaseStartupValidator();
    dsv.setDataSource(dataSource);
    dsv.setTimeout(validationTimeoutSeconds);
    dsv.setInterval(SECONDS_BETWEEN_RUNS);
    return dsv;
  }

  @Bean
  @DependsOn("oracleSingleDataSourceStartupValidator")
  @ConditionalOnProperty(prefix = "gms.persistence.oracle", name = "unit")
  @Qualifier("oracle") public LocalContainerEntityManagerFactoryBean oracleEntityManagerFactory(
      @Qualifier("oracle") EmfFactory emfFactory,
      @Qualifier("oracle") DataSource dataSource,
      @Value("${gms.persistence.oracle.unit}") String persistenceName,
      @Value("${gms.persistence.oracle.connection_pool_size:2}") int connectionPoolSize) {
    return emfFactory.createBean(dataSource, persistenceName, connectionPoolSize);
  }
}
