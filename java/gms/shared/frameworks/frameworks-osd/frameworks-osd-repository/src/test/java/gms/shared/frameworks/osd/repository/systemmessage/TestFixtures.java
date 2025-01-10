package gms.shared.frameworks.osd.repository.systemmessage;

import gms.shared.frameworks.osd.coi.systemmessages.SystemMessage;
import gms.shared.frameworks.osd.coi.systemmessages.SystemMessageCategory;
import gms.shared.frameworks.osd.coi.systemmessages.SystemMessageSeverity;
import gms.shared.frameworks.osd.coi.systemmessages.SystemMessageSubCategory;
import gms.shared.frameworks.osd.coi.systemmessages.SystemMessageType;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public class TestFixtures {

  public static Collection<SystemMessage> msgs =
      List.of(
          SystemMessage.create(
              Instant.MIN,
              "this is a test",
              SystemMessageType.STATION_NEEDS_ATTENTION,
              SystemMessageSeverity.WARNING,
              SystemMessageCategory.SOH,
              SystemMessageSubCategory.STATION,
              Map.of()));
}
