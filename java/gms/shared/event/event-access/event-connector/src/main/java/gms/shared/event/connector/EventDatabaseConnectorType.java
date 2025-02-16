package gms.shared.event.connector;

import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;

public class EventDatabaseConnectorType implements DatabaseConnectorType<EventDatabaseConnector> {
  @Override
  public Class<EventDatabaseConnector> getConnectorClass() {
    return EventDatabaseConnector.class;
  }
}
