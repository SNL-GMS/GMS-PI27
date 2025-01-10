package gms.shared.event.connector;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;

@Tag("component")
abstract class DatabaseConnectorTest<T> {

  private static EntityManagerFactory entityManagerFactory;

  protected T databaseConnector;

  @BeforeAll
  protected static void setUp() {

    final var eventSqlScripts =
        List.of(
            getResource("event_ddl.sql"),
            getResource("data/event.sql"),
            getResource("origerr_ddl.sql"),
            getResource("data/origerr.sql"),
            getResource("origin_ddl.sql"),
            getResource("data/origin.sql"),
            getResource("event_control_ddl.sql"),
            getResource("data/event_control.sql"),
            getResource("ar_info_ddl.sql"),
            getResource("data/ar_info.sql"),
            getResource("netmag_ddl.sql"),
            getResource("data/netmag.sql"),
            getResource("stamag_ddl.sql"),
            getResource("data/stamag.sql"),
            getResource("gatag_ddl.sql"),
            getResource("data/gatag.sql"),
            getResource("assoc_ddl.sql"),
            getResource("data/assoc.sql"),
            getResource("data/signaldetection-assoc.sql"));

    final var jdbcUrl = "jdbc:h2:mem:css_test;USER=GMS_GLOBAL;MODE=Oracle;TIME ZONE=UTC";
    final var initJdbcUrl =
        String.format("%s;INIT=%s", jdbcUrl, getInitScriptRunCommand(eventSqlScripts));

    final var hibernateProperties =
        Map.of(
            "hibernate.connection.driver_class", "org.h2.Driver",
            "hibernate.connection.url", initJdbcUrl,
            "hibernate.default_schema", "GMS_GLOBAL",
            "hibernate.hbm2ddl.auto", "none",
            "hibernate.flushMode", "FLUSH_AUTO",
            "hibernate.jdbc.batch_size", "50",
            "hibernate.order_inserts", "true",
            "hibernate.order_updates", "true",
            "hibernate.jdbc.batch_versioned_data", "true",
            "hibernate.c3p0.max_size", "1");

    entityManagerFactory = Persistence.createEntityManagerFactory("gms_event", hibernateProperties);
  }

  @BeforeEach
  public void testSetup() {
    databaseConnector = getDatabaseConnector(entityManagerFactory);
  }

  @AfterAll
  protected static void tearDown() {
    entityManagerFactory.close();

    assertFalse(entityManagerFactory.isOpen());

    entityManagerFactory = null;
    assertNull(entityManagerFactory);
  }

  protected abstract T getDatabaseConnector(EntityManagerFactory entityManagerFactory);

  private static String getInitScriptRunCommand(List<URL> cssSqlScripts) {
    return cssSqlScripts.stream()
        .map(s -> String.format("runscript from '%s'", s))
        .collect(Collectors.joining("\\;"));
  }

  private static URL getResource(String resourceName) {
    final URL resource = DatabaseConnectorTest.class.getClassLoader().getResource(resourceName);
    if (resource == null) {
      throw new IllegalArgumentException(
          String.format("Requested resource was not found: '%s'", resourceName));
    }
    return resource;
  }
}
