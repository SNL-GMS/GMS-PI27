package gms.shared.utilities.bridge.database.connector;

/** Database connector exception for connector runtime errors */
public class DatabaseConnectorException extends RuntimeException {
  public DatabaseConnectorException(String message, Exception e) {
    super(message, e);
  }
}
