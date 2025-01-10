package gms.shared.waveform.coi;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.common.collect.Range;
import gms.shared.utilities.test.JsonTestUtilities;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class MissingChannelTimeRangeListPairTest {

  @Test
  void testFromCreator() {
    var channel = CHANNEL.toEntityReference();
    Range<Instant> timeRange1 = Range.closed(Instant.EPOCH, Instant.EPOCH.plusSeconds(60));
    var missingChannelPair = new MissingChannelTimeRangeListPair(channel, List.of(timeRange1));
    JsonTestUtilities.assertSerializes(missingChannelPair, MissingChannelTimeRangeListPair.class);
  }

  @Test
  void testSerialization() throws JsonProcessingException, IOException {
    JsonTestUtilities.assertSerializes(
        createMissingChannelTimeRangeListPair(), MissingChannelTimeRangeListPair.class);
  }

  /**
   * Create the example MissingChannelTimeRangeListPair object
   *
   * @return MissingChannelTimeRangeListPair
   */
  private static MissingChannelTimeRangeListPair createMissingChannelTimeRangeListPair() {
    var channel = CHANNEL.toEntityReference();
    Range<Instant> timeRange1 = Range.closed(Instant.EPOCH, Instant.EPOCH.plusSeconds(60));
    Range<Instant> timeRange2 =
        Range.closed(Instant.EPOCH.plusSeconds(120), Instant.EPOCH.plusSeconds(240));
    return new MissingChannelTimeRangeListPair(channel, List.of(timeRange1, timeRange2));
  }
}
