package gms.shared.fk.control.configuration;

import static gms.shared.fk.testfixtures.FkTestFixtures.DEFINITION;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.List;
import org.junit.jupiter.api.Test;

class FkSpectraParametersTest {

  @Test
  void testSerialization() {
    FkSpectraParameters parameters =
        FkSpectraParameters.from(
            "test",
            List.of(
                Channel.createEntityReference("channel1"),
                Channel.createEntityReference("channel2")),
            DEFINITION);
    JsonTestUtilities.assertSerializes(parameters, FkSpectraParameters.class);
  }
}
