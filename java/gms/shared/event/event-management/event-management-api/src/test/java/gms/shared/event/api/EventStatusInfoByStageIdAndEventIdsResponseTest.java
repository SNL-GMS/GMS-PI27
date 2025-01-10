package gms.shared.event.api;

import gms.shared.event.coi.EventStatus;
import gms.shared.event.coi.EventStatusInfo;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.io.IOException;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class EventStatusInfoByStageIdAndEventIdsResponseTest {

  @Test
  void testSerialization() throws IOException {

    var stageId = WorkflowDefinitionId.from("test");
    var eventId = UUID.fromString("10000000-100-0000-1000-100000000006");
    var eventStatusInfo = EventStatusInfo.from(EventStatus.COMPLETE, Arrays.asList("analyst1"));
    var eventStatusInfos = Map.of(eventId, eventStatusInfo);

    var eventStatusInfoByStageIdAndEventIdsResponse =
        EventStatusInfoByStageIdAndEventIdsResponse.builder()
            .setStageId(stageId)
            .setEventStatusInfoMap(eventStatusInfos)
            .build();
    JsonTestUtilities.assertSerializes(
        eventStatusInfoByStageIdAndEventIdsResponse,
        EventStatusInfoByStageIdAndEventIdsResponse.class);
  }
}
