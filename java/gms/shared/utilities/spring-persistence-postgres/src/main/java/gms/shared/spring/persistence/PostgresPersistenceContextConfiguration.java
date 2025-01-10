package gms.shared.spring.persistence;

import com.mchange.v2.c3p0.DataSources;
import gms.shared.frameworks.systemconfig.SystemConfig;
import java.sql.SQLException;
import java.util.Properties;
import javax.sql.DataSource;
import org.hibernate.jpa.HibernatePersistenceProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.support.DatabaseStartupValidator;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;

@Configuration
public class PostgresPersistenceContextConfiguration {

  private static final int SECONDS_BETWEEN_RUNS = 30;

  public static final String HIBERNATE_CONNECTION_DRIVER_CLASS =
      "hibernate.connection.driver_class";
  public static final String HIBERNATE_C3P0_POOL_MIN_SIZE_KEY = "hibernate.c3p0.min_size";
  public static final String HIBERNATE_C3P0_POOL_MAX_SIZE_KEY = "hibernate.c3p0.max_size";
  public static final String HIBERNATE_C3P0_ACQUIRE_INCREMENT = "hibernate.c3p0.acquire_increment";
  public static final String HIBERNATE_C3P0_TIMEOUT = "hibernate.c3p0.timeout";
  public static final String HIBERNATE_AUTO = "hibernate.hbm2ddl.auto";
  public static final String HIBERNATE_TIMEZONE = "hibernate.jdbc.time_zone";
  private static final String HIBERNATE_PREFERRED_INSTANT_JDBC_TYPE =
      "hibernate.type.preferred_instant_jdbc_type";
  public static final String HIBERNATE_UNRETURNED_CONNECTION_TIMEOUT =
      "hibernate.c3p0.unreturnedConnectionTimeout";
  public static final String HIBERNATE_DEBUG_UNRETURNED_CONNECTION_STACK_TRACES =
      "hibernate.c3p0.debugUnreturnedConnectionStackTraces";
  public static final String HIBERNATE_SHOW_SQL = "hibernate.show_sql";
  public static final String HIBERNATE_CONNECTION_AUTOCOMMIT = "hibernate.connection.autocommit";
  public static final String HIBERNATE_FLUSHMODE = "hibernate.flushmode";

  // Postgres system configuration keys
  public static final String CONNECTION_POOL_SIZE_CONFIG_KEY = "c3p0_connection_pool_size";
  private static final String POSTGRES_URL_CONFIG_KEY = "sql_url";
  private static final String POSTGRES_SQL_USER_KEY = "sql_user";
  private static final String POSTGRES_SQL_PW_KEY = "sql_password";

  // Postgres driver
  private static final String POSTGRES_DRIVER_CLASS = "org.postgresql.Driver";

  // Values
  private static final int MIN_SIZE_KEY = 1;
  private static final int ACQUIRE_INCREMENT = 2;
  private static final int TIMEOUT = 30;

  @Value("${persistenceUnitName}")
  private String persistenceUnitName;

  // https://stackoverflow.com/questions/18882683/how-to-mention-persistenceunitname-when-packagestoscan-property
  @Bean
  @Qualifier("postgres") public DataSource postgresDataSource(SystemConfig systemConfig) {
    try {
      var unpooledDataSource =
          DataSources.unpooledDataSource(
              systemConfig.getValue(POSTGRES_URL_CONFIG_KEY),
              systemConfig.getValue(POSTGRES_SQL_USER_KEY),
              systemConfig.getValue(POSTGRES_SQL_PW_KEY));

      return DataSources.pooledDataSource(unpooledDataSource);
    } catch (SQLException e) {
      throw new IllegalStateException(e);
    }
  }

  @Bean
  @Qualifier("postgres") public DatabaseStartupValidator postgresDataSourceStartupValidator(
      @Qualifier("postgres") DataSource dataSource,
      @Value("${gms.persistence.postgres.validation_timeout_seconds:300}")
          int validationTimeoutSeconds) {

    var dsv = new DatabaseStartupValidator();
    dsv.setDataSource(dataSource);
    dsv.setTimeout(validationTimeoutSeconds);
    dsv.setInterval(SECONDS_BETWEEN_RUNS);
    return dsv;
  }

  @Bean
  @DependsOn("postgresDataSourceStartupValidator")
  @Qualifier("postgres") public LocalContainerEntityManagerFactoryBean postgresEntityManagerFactory(
      SystemConfig systemConfig, @Qualifier("postgres") DataSource dataSource) {
    var emf = new LocalContainerEntityManagerFactoryBean();

    emf.setPersistenceUnitName(persistenceUnitName);
    emf.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
    emf.setDataSource(dataSource);
    emf.setPersistenceProviderClass(HibernatePersistenceProvider.class);
    emf.setJpaProperties(jpaHibernateProperties(systemConfig));

    return emf;
  }

  private static Properties jpaHibernateProperties(SystemConfig systemConfig) {
    var properties = new Properties();
    properties.put(HIBERNATE_CONNECTION_DRIVER_CLASS, POSTGRES_DRIVER_CLASS);
    properties.put(HIBERNATE_C3P0_POOL_MIN_SIZE_KEY, MIN_SIZE_KEY);
    properties.put(
        HIBERNATE_C3P0_POOL_MAX_SIZE_KEY, systemConfig.getValue(CONNECTION_POOL_SIZE_CONFIG_KEY));
    properties.put(HIBERNATE_C3P0_ACQUIRE_INCREMENT, ACQUIRE_INCREMENT);
    properties.put(HIBERNATE_C3P0_TIMEOUT, TIMEOUT);
    properties.put(HIBERNATE_AUTO, "none");
    properties.put(HIBERNATE_TIMEZONE, "UTC");
    properties.put(HIBERNATE_PREFERRED_INSTANT_JDBC_TYPE, "TIMESTAMP");
    properties.put(HIBERNATE_UNRETURNED_CONNECTION_TIMEOUT, TIMEOUT);
    properties.put(HIBERNATE_DEBUG_UNRETURNED_CONNECTION_STACK_TRACES, "true");
    properties.put(HIBERNATE_SHOW_SQL, "false");
    properties.put(HIBERNATE_CONNECTION_AUTOCOMMIT, "false");
    properties.put(HIBERNATE_FLUSHMODE, "FLUSH_AUTO");

    return properties;
  }
}
