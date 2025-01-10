package gms.testtools.simulators.bridgeddatasourcesimulator.application.factory;

import gms.shared.frameworks.systemconfig.SystemConfig;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import jakarta.persistence.PersistenceException;
import java.util.HashMap;
import java.util.Map;
import java.util.MissingResourceException;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Component;

/**
 * Utility for creating EntityManagerFactory's for JPA. These know about all of the core Data Access
 * Objects for GMS.
 */
@Component
@DependsOn("oracleSingleDataSourceStartupValidator")
public class BridgedEntityManagerFactoryProvider {

  private static final Logger logger =
      LoggerFactory.getLogger(BridgedEntityManagerFactoryProvider.class);

  public static final String JAVAX_PERSISTENCE_JDBC_URL = "jakarta.persistence.jdbc.url";
  public static final String HIBERNATE_C3P0_POOL_SIZE_KEY = "hibernate.c3p0.max_size";
  public static final String HIBERNATE_DEFAULT_SCHEMA_KEY = "hibernate.default_schema";
  public static final String HIBERNATE_FLUSH_MODE = "hibernate.flushMode";

  public static final String CONNECTION_POOL_SIZE_CONFIG_KEY = "c3p0_connection_pool_size";
  public static final String JDBC_URL_CONFIG_KEY = "jdbc_url";
  public static final String SCHEMA = "schema";

  /**
   * Creates an EntityManagerFactory using system configuration.
   *
   * @param unitName persistence unit name
   * @param config system configuration
   * @return EntityManagerFactory
   */
  public EntityManagerFactory getEntityManagerFactory(String unitName, SystemConfig config) {
    Objects.requireNonNull(config, "SystemConfig cannot be null.");

    final Map<String, String> propertiesOverrides = new HashMap<>();
    try {
      propertiesOverrides.put(JAVAX_PERSISTENCE_JDBC_URL, config.getValue(JDBC_URL_CONFIG_KEY));
      logger.info("Connecting with URL {}", config.getValue(JDBC_URL_CONFIG_KEY));
    } catch (MissingResourceException e) {
      logger.warn(
          "Could not load property for "
              + JDBC_URL_CONFIG_KEY
              + ". Ensure it is defined in the persistence.xml");
    }
    propertiesOverrides.put(
        HIBERNATE_C3P0_POOL_SIZE_KEY, config.getValue(CONNECTION_POOL_SIZE_CONFIG_KEY));
    propertiesOverrides.put(HIBERNATE_FLUSH_MODE, "FLUSH_AUTO");

    try {
      final String schemaName = config.getValue(SCHEMA);
      if (schemaName != null && !schemaName.isBlank()) {
        propertiesOverrides.put(HIBERNATE_DEFAULT_SCHEMA_KEY, schemaName);
        logger.info("Overriding default schema with {}", schemaName);
      }
    } catch (MissingResourceException e) {
      logger.warn("No default schema name found.");
    }
    return getEntityManagerFactory(unitName, propertiesOverrides);
  }

  /**
   * Creates an EntityManagerFactory with the specified property overrides. These are given directly
   * to the JPA provider; they can be used to override things like the URL of the database.
   *
   * @param unitName Persistence unit name
   * @param propertiesOverrides a map of properties to override and their values
   * @return EntityManagerFactory
   */
  private static EntityManagerFactory getEntityManagerFactory(
      String unitName, Map<String, String> propertiesOverrides) {
    Objects.requireNonNull(propertiesOverrides, "Property overrides cannot be null");
    try {
      return Persistence.createEntityManagerFactory(unitName, propertiesOverrides);
    } catch (PersistenceException e) {
      throw new IllegalArgumentException("Could not create persistence unit " + unitName, e);
    }
  }
}
