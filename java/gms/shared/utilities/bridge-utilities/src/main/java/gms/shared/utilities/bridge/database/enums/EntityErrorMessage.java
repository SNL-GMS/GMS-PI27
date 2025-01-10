package gms.shared.utilities.bridge.database.enums;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorException;
import jakarta.persistence.NoResultException;
import jakarta.persistence.NonUniqueResultException;
import jakarta.persistence.PersistenceException;
import jakarta.persistence.QueryTimeoutException;

/**
 * Custom entity error messages for entity manager queries. This enum takes in a main query message
 * along with message arguments to construct an error message.
 */
public enum EntityErrorMessage {
  ILLEGAL_STATE_EXCEPTION(
      IllegalStateException.class.getSimpleName(),
      "Illegal State Exception: %s occurred for %s. Main error message: %s."),
  DATABASE_CONNECTOR_EXCEPTION(
      DatabaseConnectorException.class.getSimpleName(),
      "DB Connector Exception: %s occurred for %s. Main error message: %s."),
  NO_RESULT(NoResultException.class.getSimpleName(), "No %s found for %s. Main error message: %s."),
  NON_UNIQUE_RESULT(
      NonUniqueResultException.class.getSimpleName(),
      "No unique %s found for %s. Main error message: %s."),
  PERSISTENCE_EXCEPTION(
      PersistenceException.class.getSimpleName(), "%s occurred for %s. Main error message: %s."),
  QUERY_TIMEOUT_EXCEPTION(
      QueryTimeoutException.class.getSimpleName(),
      "Query Timeout Exception: %s occurred for %s. Main error message: %s."),
  UNCHECKED_EXCEPTION(
      Exception.class.getSimpleName(), "%s occurred for %s. Main error message: %s.");

  private final String errorClass;
  private final String errorMessage;

  EntityErrorMessage(String errorClass, String errorMessage) {
    this.errorClass = errorClass;
    this.errorMessage = errorMessage;
  }

  public static EntityErrorMessage get(String classType) {
    for (EntityErrorMessage eem : values()) {
      if (eem.getErrorClass().equals(classType)) {
        return eem;
      }
    }
    return null;
  }

  public String getErrorClass() {
    return errorClass;
  }

  public String getMessage(String queryMessage, String messageArgs, String mainErrorMessage) {
    return String.format(errorMessage, queryMessage, messageArgs, mainErrorMessage);
  }
}
