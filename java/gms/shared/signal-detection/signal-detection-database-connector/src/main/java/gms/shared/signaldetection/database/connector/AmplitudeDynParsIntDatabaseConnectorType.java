package gms.shared.signaldetection.database.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

/**
 * @see DatabaseConnectorType
 */
public class AmplitudeDynParsIntDatabaseConnectorType
    implements DatabaseConnectorType<AmplitudeDynParsIntDatabaseConnector> {

  @Override
  public Class<AmplitudeDynParsIntDatabaseConnector> getConnectorClass() {
    return AmplitudeDynParsIntDatabaseConnector.class;
  }
}
