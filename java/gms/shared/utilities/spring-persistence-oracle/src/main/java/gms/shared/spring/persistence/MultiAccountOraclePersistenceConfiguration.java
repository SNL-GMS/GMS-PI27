package gms.shared.spring.persistence;

import static com.google.common.base.Preconditions.checkState;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.support.DatabaseStartupValidator;

/**
 * Configuration class representing situations where more than one Oracle account is required by an
 * application.
 */
@Configuration
@ConditionalOnProperty(prefix = "gms.persistence.oracle", name = "accounts")
public class MultiAccountOraclePersistenceConfiguration {

  private static final int SECONDS_BETWEEN_RUNS = 30;

  @Bean
  @Qualifier("oracle") public DataSourcesByAccount oracleDataSourcesByAccount(
      OracleDataSourceFactory dataSourceFactory,
      @Value("${gms.persistence.oracle.accounts}") String[] accounts) {
    checkState(accounts.length > 0, "No persistence accounts configured");
    var delegate =
        Arrays.stream(accounts).collect(toMap(identity(), dataSourceFactory::getDataSource));

    return new DataSourcesByAccount(delegate);
  }

  @Bean
  @Qualifier("oracle") public DatabaseStartupValidator oracleMultiDataSourceStartupValidator(
      @Qualifier("oracle") DataSourcesByAccount dataSourcesByAccount,
      @Value("${gms.persistence.oracle.validation_timeout_seconds:300}")
          int validationTimeoutSeconds) {

    var anyDataSource =
        dataSourcesByAccount
            .dataSources()
            .findAny()
            .orElseThrow(() -> new IllegalStateException("No DataSources Found"));

    var dsv = new DatabaseStartupValidator();
    dsv.setDataSource(anyDataSource);
    dsv.setTimeout(validationTimeoutSeconds);
    dsv.setInterval(SECONDS_BETWEEN_RUNS);
    return dsv;
  }

  @Bean
  @Qualifier("oracle") @DependsOn("oracleMultiDataSourceStartupValidator")
  @ConditionalOnProperty(prefix = "gms.persistence.oracle", name = "unit")
  public EntityManagerFactoriesByAccount oracleEntityManagerFactoriesByAccount(
      @Qualifier("oracle") EmfFactory emfFactory,
      @Qualifier("oracle") DataSourcesByAccount dataSourcesByAccount,
      @Value("${gms.persistence.oracle.unit}") String persistenceName,
      @Value("${gms.persistence.oracle.connection_pool_size:2}") int connectionPoolSize) {
    return emfFactory.createForAccounts(dataSourcesByAccount, persistenceName, connectionPoolSize);
  }
}
