package gms.shared.stationdefinition.repository.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;
import org.junit.jupiter.api.Test;

class InstrumentResponseTypeTest {

  @Test
  void testGetBlockParserFap() throws IOException {

    var blockParser = InstrumentResponseType.FAP.getBlockParser();
    assertEquals(FapBlockParser.class, blockParser.getClass());
    var blockParser2 = InstrumentResponseType.valueOf("fap".toUpperCase()).getBlockParser();
    assertEquals(FapBlockParser.class, blockParser2.getClass());
  }

  @Test
  void testGetBlockParserFir() throws IOException {

    var blockParser = InstrumentResponseType.FIR.getBlockParser();
    assertEquals(FirBlockParser.class, blockParser.getClass());

    var blockParser2 = InstrumentResponseType.valueOf("fir".toUpperCase()).getBlockParser();
    assertEquals(FirBlockParser.class, blockParser2.getClass());
  }

  @Test
  void testGetBlockParserPaz() {

    var blockParser = InstrumentResponseType.PAZ.getBlockParser();
    assertEquals(PazBlockParser.class, blockParser.getClass());

    var blockParser2 = InstrumentResponseType.valueOf("paz".toUpperCase()).getBlockParser();
    assertEquals(PazBlockParser.class, blockParser2.getClass());
  }
}
