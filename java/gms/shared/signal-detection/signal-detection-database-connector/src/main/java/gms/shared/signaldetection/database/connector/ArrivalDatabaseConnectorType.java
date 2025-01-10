package gms.shared.signaldetection.database.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

/**
 * @see DatabaseConnectorType
 */
public class ArrivalDatabaseConnectorType
    implements DatabaseConnectorType<ArrivalDatabaseConnector> {
  @Override
  public Class<ArrivalDatabaseConnector> getConnectorClass() {
    return ArrivalDatabaseConnector.class;
  }
}
