package gms.shared.utilities.bridge.database;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InPrefixNamingStrategyTest {

  @Mock JdbcEnvironment jdbcEnvironment;

  @Test
  void testApplyNamingStrategy() {
    var inPrefixNamingStrategy = new InPrefixNamingStrategy();

    var id = "ID";
    var identifier = new Identifier(id, false);

    var expectedIdentifier = new Identifier(InPrefixNamingStrategy.IN_PREFIX + id, false);

    assertEquals(
        identifier, inPrefixNamingStrategy.toPhysicalCatalogName(identifier, jdbcEnvironment));
    assertEquals(
        identifier, inPrefixNamingStrategy.toPhysicalColumnName(identifier, jdbcEnvironment));
    assertEquals(
        expectedIdentifier,
        inPrefixNamingStrategy.toPhysicalTableName(identifier, jdbcEnvironment));
    assertEquals(
        identifier, inPrefixNamingStrategy.toPhysicalSchemaName(identifier, jdbcEnvironment));
    assertEquals(
        identifier, inPrefixNamingStrategy.toPhysicalSequenceName(identifier, jdbcEnvironment));
  }
}
