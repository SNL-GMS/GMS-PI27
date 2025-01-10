package gms.shared.utilities.bridge.database;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PrefixNamingStrategyTest {

  @Mock JdbcEnvironment jdbcEnvironment;

  @Test
  void testApplyNamingStrategy() {
    var prefix = "TEST_";
    var prefixNamingStrategy = new PrefixNamingStrategy(prefix);

    var id = "ID";
    var identifier = new Identifier(id, false);

    var expectedIdentifier = new Identifier(prefix + id, false);

    assertEquals(
        identifier, prefixNamingStrategy.toPhysicalCatalogName(identifier, jdbcEnvironment));
    assertEquals(
        identifier, prefixNamingStrategy.toPhysicalColumnName(identifier, jdbcEnvironment));
    assertEquals(
        expectedIdentifier, prefixNamingStrategy.toPhysicalTableName(identifier, jdbcEnvironment));
    assertEquals(
        identifier, prefixNamingStrategy.toPhysicalSchemaName(identifier, jdbcEnvironment));
    assertEquals(
        identifier, prefixNamingStrategy.toPhysicalSequenceName(identifier, jdbcEnvironment));
  }
}
