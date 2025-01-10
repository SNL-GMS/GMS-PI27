package gms.shared.event.repository;

import gms.shared.event.connector.ArInfoDatabaseConnectorType;
import gms.shared.event.connector.AssocDatabaseConnectorType;
import gms.shared.event.connector.EventControlDatabaseConnectorType;
import gms.shared.event.connector.EventDatabaseConnectorType;
import gms.shared.event.connector.GaTagDatabaseConnectorType;
import gms.shared.event.connector.NetMagDatabaseConnectorType;
import gms.shared.event.connector.OriginDatabaseConnectorType;
import gms.shared.event.connector.OriginErrDatabaseConnectorType;
import gms.shared.event.connector.StaMagDatabaseConnectorType;

public final class EventBridgeDatabaseConnectorTypes {

  public static final ArInfoDatabaseConnectorType AR_INFO_CONNECTOR_TYPE =
      new ArInfoDatabaseConnectorType();

  public static final EventDatabaseConnectorType EVENT_CONNECTOR_TYPE =
      new EventDatabaseConnectorType();

  public static final EventControlDatabaseConnectorType EVENT_CONTROL_CONNECTOR_TYPE =
      new EventControlDatabaseConnectorType();

  public static final GaTagDatabaseConnectorType GA_TAG_CONNECTOR_TYPE =
      new GaTagDatabaseConnectorType();

  public static final NetMagDatabaseConnectorType NETMAG_CONNECTOR_TYPE =
      new NetMagDatabaseConnectorType();

  public static final OriginDatabaseConnectorType ORIGIN_CONNECTOR_TYPE =
      new OriginDatabaseConnectorType();

  public static final OriginErrDatabaseConnectorType ORIGERR_CONNECTOR_TYPE =
      new OriginErrDatabaseConnectorType();

  public static final StaMagDatabaseConnectorType STAMAG_CONNECTOR_TYPE =
      new StaMagDatabaseConnectorType();

  public static final AssocDatabaseConnectorType ASSOC_CONNECTOR_TYPE =
      new AssocDatabaseConnectorType();

  private EventBridgeDatabaseConnectorTypes() {
    // Hide implicit public constructor
  }
}
