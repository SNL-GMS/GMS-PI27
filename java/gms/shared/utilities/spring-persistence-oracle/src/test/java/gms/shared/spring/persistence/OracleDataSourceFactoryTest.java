package gms.shared.spring.persistence;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OracleDataSourceFactoryTest {

  OracleDataSourceFactory dataSourceFactory;

  @BeforeEach
  void startup() {
    this.dataSourceFactory = new OracleDataSourceFactory();
  }

  @Test
  void testDataSource() {
    assertDoesNotThrow(() -> dataSourceFactory.getDataSource("TEST"));
  }
}
