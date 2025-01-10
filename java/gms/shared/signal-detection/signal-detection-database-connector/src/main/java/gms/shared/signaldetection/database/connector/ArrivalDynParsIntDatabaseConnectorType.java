package gms.shared.signaldetection.database.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

/**
 * @see DatabaseConnectorType
 */
public class ArrivalDynParsIntDatabaseConnectorType
    implements DatabaseConnectorType<ArrivalDynParsIntDatabaseConnector> {

  @Override
  public Class<ArrivalDynParsIntDatabaseConnector> getConnectorClass() {
    return ArrivalDynParsIntDatabaseConnector.class;
  }
}
