package gms.shared.event.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

public class OriginDatabaseConnectorType implements DatabaseConnectorType<OriginDatabaseConnector> {
  public Class<OriginDatabaseConnector> getConnectorClass() {
    return OriginDatabaseConnector.class;
  }
}
