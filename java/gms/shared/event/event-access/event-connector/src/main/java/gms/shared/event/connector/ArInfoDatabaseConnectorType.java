package gms.shared.event.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

public class ArInfoDatabaseConnectorType implements DatabaseConnectorType<ArInfoDatabaseConnector> {
  @Override
  public Class<ArInfoDatabaseConnector> getConnectorClass() {
    return ArInfoDatabaseConnector.class;
  }
}
