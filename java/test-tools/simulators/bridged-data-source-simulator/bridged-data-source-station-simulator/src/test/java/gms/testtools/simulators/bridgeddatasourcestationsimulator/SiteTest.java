package gms.testtools.simulators.bridgeddatasourcestationsimulator;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SiteTest {

  private Site.Builder builder;

  @BeforeEach
  void testSetup() {
    builder = Site.builder();
  }

  @Test
  void testSerializationDeserialization() throws JsonProcessingException {
    Site site =
        builder
            .setStationCode("TST")
            .setOnDate(Instant.EPOCH)
            .setOffDate(Instant.MAX)
            .setLatitude(0)
            .setLongitude(1)
            .setElevation(2)
            .setStationName("TEST_STA")
            .setStationType(StaType.SINGLE_STATION)
            .setDegreesNorth(56)
            .setDegreesEast(72)
            .setReferenceStation("MRTST")
            .setLoadDate(Instant.EPOCH)
            .build();

    JsonTestUtilities.assertSerializes(site, Site.class);
  }
}
