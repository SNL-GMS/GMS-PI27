package gms.shared.stationdefinition.cache.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import org.junit.jupiter.api.Test;

class ChannelInstrumentPairTest {

  @Test
  void testEquals() {

    var first = new ChannelInstrumentPair("first", 1L);
    var copy = new ChannelInstrumentPair("first", 1L);
    var bothDifferent = new ChannelInstrumentPair("second", 2L);
    var nameDifferent = new ChannelInstrumentPair("third", 1L);
    var idDifferent = new ChannelInstrumentPair("first", 3L);
    ChannelInstrumentPair nullPair = null;
    var notAPair = "I'm not a pair";

    assertEquals(first, first);
    assertEquals(first, copy);
    assertNotEquals(first, bothDifferent);
    assertNotEquals(first, nameDifferent);
    assertNotEquals(first, idDifferent);
    assertNotEquals(first, notAPair);
    assertNotEquals(first, nullPair);

    first.setChannelName(null);
    assertNotEquals(first, copy);

    copy.setChannelName(null);
    assertEquals(first, copy);

    first.setInstrumentId(null);
    assertNotEquals(first, copy);

    copy.setInstrumentId(null);
    assertEquals(first, copy);
  }
}
