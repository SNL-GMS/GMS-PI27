package gms.shared.spring.persistence;

import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

class MultiAccountOraclePersistenceConfigurationTest {

  static final int VALIDATION_TIMEOUT_SECONDS = 120;
  MultiAccountOraclePersistenceConfiguration configuration;

  @BeforeEach
  void startup() {
    this.configuration = new MultiAccountOraclePersistenceConfiguration();
  }

  @Test
  void testDataSourcesByAccount() {
    assertDoesNotThrow(
        () ->
            configuration.oracleDataSourcesByAccount(
                new OracleDataSourceFactory(), new String[] {"TEST1", "TEST2", "TEST3"}));
  }

  @Test
  void testMultiDataSourceStartupValidator() {
    assertDoesNotThrow(
        () ->
            configuration.oracleMultiDataSourceStartupValidator(
                new DataSourcesByAccount(Map.of("test", new DriverManagerDataSource("test"))),
                VALIDATION_TIMEOUT_SECONDS));
  }

  @Test
  void testMultiDataSourceStartupValidatorNoDataSourcesThrows() {
    assertThatIllegalStateException()
        .isThrownBy(
            () ->
                configuration.oracleMultiDataSourceStartupValidator(
                    new DataSourcesByAccount(Map.of()), VALIDATION_TIMEOUT_SECONDS))
        .withMessage("No DataSources Found");
  }
}
