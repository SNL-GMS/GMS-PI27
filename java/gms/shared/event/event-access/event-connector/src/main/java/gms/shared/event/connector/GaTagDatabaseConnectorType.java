package gms.shared.event.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

public class GaTagDatabaseConnectorType implements DatabaseConnectorType<GaTagDatabaseConnector> {
  @Override
  public Class<GaTagDatabaseConnector> getConnectorClass() {
    return GaTagDatabaseConnector.class;
  }
}
