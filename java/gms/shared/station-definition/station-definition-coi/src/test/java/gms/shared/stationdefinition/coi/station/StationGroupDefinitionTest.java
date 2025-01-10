package gms.shared.stationdefinition.coi.station;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class StationGroupDefinitionTest {

  private static final Logger LOGGER = LoggerFactory.getLogger(StationGroupDefinitionTest.class);

  @Test
  void testStationFromFacetedChannelGroupsSerializeToAndFrom() throws JsonProcessingException {
    final StationGroupDefinition stationGroupDefinition =
        StationGroupDefinition.from(
            "test", "test description", Instant.now(), List.of("station 1", "station 2"));
    JsonTestUtilities.assertSerializes(stationGroupDefinition, StationGroupDefinition.class);
  }
}
