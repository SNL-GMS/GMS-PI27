package gms.shared.frameworks.configuration.repository;

import static java.util.Map.entry;
import static java.util.stream.Collectors.joining;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import java.net.URL;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;

@Tag("component")
public abstract class H2Test {

  private static final String JDBC_URL_BASE = "jdbc:h2:mem:h2_test";

  private static final ClassLoader classLoader = H2Test.class.getClassLoader();
  protected EntityManagerFactory entityManagerFactory;

  protected abstract Stream<URL> sqlScripts();

  protected abstract String getUser();

  /**
   * Override to add extra h2 options to the conneciton url
   *
   * @return Extra options like compatibility mode (MODE) to be appended to the connection url
   */
  protected Stream<String> extraOptions() {
    return Stream.empty();
  }

  protected abstract String getPersistenceUnitName();

  @BeforeEach
  void initializeH2AndEmf() {

    var jdbcUrl =
        JDBC_URL_BASE.concat(
            Stream.concat(commonOptions(), extraOptions())
                .collect(Collectors.joining(";", ";", "")));

    /*
     * if debugging is needed add the properties:
     * "hibernate.generate_statistics" "hibernate.show_sql" each with a value of
     * "true"
     */
    Map<String, String> hibernateProperties =
        Map.ofEntries(
            entry("hibernate.connection.driver_class", "org.h2.Driver"),
            entry("hibernate.connection.url", jdbcUrl),
            entry("hibernate.dialect", "org.hibernate.dialect.H2Dialect"),
            entry("hibernate.default_schema", getUser()),
            entry("hibernate.jdbc.time_zone", "UTC"),
            entry("hibernate.type.preferred_instant_jdbc_type", "TIMESTAMP"),
            entry("hibernate.hbm2ddl.auto", "none"),
            entry("hibernate.flushMode", "FLUSH_AUTO"),
            entry("hibernate.jdbc.batch_size", "50"),
            entry("hibernate.order_inserts", "true"),
            entry("hibernate.order_updates", "true"),
            entry("hibernate.jdbc.batch_versioned_data", "true"),
            entry("hibernate.c3p0.min_size", "1"),
            entry("hibernate.c3p0.max_size", "1"),
            entry("hibernate.c3p0.acquire_increment", "0"),
            entry("hibernate.c3p0.timeout", "300"),
            entry("hibernate.c3p0.unreturnedConnectionTimeout", "300"),
            entry("hibernate.c3p0.debugUnreturnedConnectionStackTraces", "true"),
            entry("hibernate.generate_statistics", "false"),
            entry("hibernate.show_sql", "false"),
            entry("hibernate.format_sql", "false"));

    entityManagerFactory =
        Persistence.createEntityManagerFactory(getPersistenceUnitName(), hibernateProperties);
    assertTrue(entityManagerFactory.isOpen());
  }

  @AfterEach
  void tearDownEmf() {
    entityManagerFactory.close();
    assertFalse(entityManagerFactory.isOpen());

    entityManagerFactory = null;
  }

  private Stream<String> commonOptions() {
    return Stream.of(
        "USER=".concat(getUser()), "TIME ZONE=UTC", "INIT=".concat(getInitScriptRunCommand()));
  }

  private String getInitScriptRunCommand() {
    return sqlScripts().map(s -> String.format("runscript from '%s'", s)).collect(joining("\\;"));
  }

  protected static URL getResource(String resourceName) {
    final URL resource = classLoader.getResource(resourceName);
    if (resource == null) {
      throw new IllegalArgumentException(
          String.format("Requested resource was not found: '%s'", resourceName));
    }
    return resource;
  }
}
