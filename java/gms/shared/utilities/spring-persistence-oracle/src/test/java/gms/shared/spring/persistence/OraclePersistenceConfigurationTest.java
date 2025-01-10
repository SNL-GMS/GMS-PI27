package gms.shared.spring.persistence;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

class OraclePersistenceConfigurationTest {

  static final int VALIDATION_TIMEOUT_SECONDS = 120;
  OraclePersistenceConfiguration configuration;

  @BeforeEach
  void startup() {
    this.configuration = new OraclePersistenceConfiguration();
  }

  @Test
  void testDataSource() {
    assertDoesNotThrow(() -> configuration.oracleDataSource(new OracleDataSourceFactory(), "TEST"));
  }

  @Test
  void testOracleSingleDataSourceStartupValidator() {
    assertDoesNotThrow(
        () ->
            configuration.oracleSingleDataSourceStartupValidator(
                new DriverManagerDataSource("test"), VALIDATION_TIMEOUT_SECONDS));
  }
}
