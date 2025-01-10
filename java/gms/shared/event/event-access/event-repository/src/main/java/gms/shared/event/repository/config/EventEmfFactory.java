package gms.shared.event.repository.config;

import gms.shared.spring.persistence.EmfFactory;
import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Component;

@Component
/**
 * Simple Factory Wrapper of {@link EmfFactory}, adding opinionated means of declaring DataSources
 * and connection pool size
 */
public class EventEmfFactory {

  private static final Logger logger = LoggerFactory.getLogger(EventEmfFactory.class);

  private final EmfFactory delegate;
  private final int connectionPoolSize;

  @Autowired
  public EventEmfFactory(
      @Qualifier("oracle") EmfFactory delegate,
      @Value("${gms.persistence.connection_pool_size:2}") int connectionPoolSize) {
    this.delegate = delegate;
    this.connectionPoolSize = connectionPoolSize;
  }

  /**
   * Create an {@link EntityManagerFactory} from an input jdbc url and persistence unit name.
   * DataSources are created internally for the returned EntityManagerFactory
   *
   * @param jdbcUrl JDBC url for the connecting account.
   * @param persistenceUnit Name for the JPA persistence unit containing persistence properties and
   *     Dao classes
   * @return An EntityManagerFactory ready for use by a Repository/Connector
   */
  public EntityManagerFactory createEmf(String jdbcUrl, String persistenceUnit) {
    var dataSource = createDataSource(jdbcUrl);
    return delegate.create(dataSource, persistenceUnit, connectionPoolSize);
  }

  private static DataSource createDataSource(String jdbcUrl) {
    logger.debug("Loading event dataSource with jdbcUrl [{}]", jdbcUrl);

    var dataSource = new DriverManagerDataSource();

    dataSource.setDriverClassName("oracle.jdbc.OracleDriver");
    dataSource.setUrl(jdbcUrl);

    return dataSource;
  }
}
