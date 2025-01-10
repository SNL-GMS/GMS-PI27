package gms.shared.event.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

public class EventControlDatabaseConnectorType
    implements DatabaseConnectorType<EventControlDatabaseConnector> {
  @Override
  public Class<EventControlDatabaseConnector> getConnectorClass() {
    return EventControlDatabaseConnector.class;
  }
}
