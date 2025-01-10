package gms.shared.signaldetection.database.connector;

/** Initializes all individual Signal Detection Database Connector Type classes */
public final class SignalDetectionDatabaseConnectorTypes {

  public static final AmplitudeDatabaseConnectorType AMPLITUDE_CONNECTOR_TYPE =
      new AmplitudeDatabaseConnectorType();

  public static final ArrivalDatabaseConnectorType ARRIVAL_CONNECTOR_TYPE =
      new ArrivalDatabaseConnectorType();

  public static final ArrivalDynParsIntDatabaseConnectorType ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE =
      new ArrivalDynParsIntDatabaseConnectorType();

  public static final AmplitudeDynParsIntDatabaseConnectorType
      AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE = new AmplitudeDynParsIntDatabaseConnectorType();

  public static final AssocDatabaseConnectorType ASSOC_CONNECTOR_TYPE =
      new AssocDatabaseConnectorType();

  private SignalDetectionDatabaseConnectorTypes() {
    // Hide implicit public constructor
  }
}
