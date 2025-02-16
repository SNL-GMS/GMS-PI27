package gms.shared.event.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

public class StaMagDatabaseConnectorType implements DatabaseConnectorType<StaMagDatabaseConnector> {
  @Override
  public Class<StaMagDatabaseConnector> getConnectorClass() {
    return StaMagDatabaseConnector.class;
  }
}
