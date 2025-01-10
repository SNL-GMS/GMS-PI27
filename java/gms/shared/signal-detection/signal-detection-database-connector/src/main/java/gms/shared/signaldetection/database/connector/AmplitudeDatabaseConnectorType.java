package gms.shared.signaldetection.database.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

/**
 * @see DatabaseConnectorType
 */
public class AmplitudeDatabaseConnectorType
    implements DatabaseConnectorType<AmplitudeDatabaseConnector> {
  @Override
  public Class<AmplitudeDatabaseConnector> getConnectorClass() {
    return AmplitudeDatabaseConnector.class;
  }
}
