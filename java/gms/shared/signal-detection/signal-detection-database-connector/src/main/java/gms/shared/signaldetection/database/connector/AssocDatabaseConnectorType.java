package gms.shared.signaldetection.database.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

/**
 * @see DatabaseConnectorType
 */
public class AssocDatabaseConnectorType implements DatabaseConnectorType<AssocDatabaseConnector> {
  @Override
  public Class<AssocDatabaseConnector> getConnectorClass() {
    return AssocDatabaseConnector.class;
  }
}
