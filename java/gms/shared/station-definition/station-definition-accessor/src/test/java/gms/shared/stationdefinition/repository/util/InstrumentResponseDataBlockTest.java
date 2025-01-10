package gms.shared.stationdefinition.repository.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import org.junit.jupiter.api.Test;

class InstrumentResponseDataBlockTest {

  @Test
  void testParseHeaderTheoretical() throws IOException {
    String[] headerBlock = {"theoretical	1	instrument	fap	texthere"};
    var block = new InstrumentResponseDataBlock(headerBlock);
    assertEquals(InstrumentResponseType.FAP, block.getFormat());
  }

  @Test
  void testParseHeaderMeasured() throws IOException {
    String[] headerBlock = {"measured	1	instrument	fap	texthere"};
    var block = new InstrumentResponseDataBlock(headerBlock);
    assertEquals(InstrumentResponseType.FAP, block.getFormat());
  }

  @Test
  void testParseHeaderultipleWhitespace1() throws IOException {
    String[] headerBlock = {"measured	1	  \t\t  instrument fir	texthere    "};
    var block = new InstrumentResponseDataBlock(headerBlock);
    assertEquals(InstrumentResponseType.FIR, block.getFormat());
  }

  @Test
  void testParseHeaderultipleWhitespace2() throws IOException {
    String[] headerBlock = {"       measured     1     instrument     paz\t\t  \ttexthere"};
    var block = new InstrumentResponseDataBlock(headerBlock);
    assertEquals(InstrumentResponseType.PAZ, block.getFormat());
  }

  @Test
  void testParseHeaderEmptyBlock() throws IOException {
    String[] headerBlock = {};
    var block = new InstrumentResponseDataBlock(headerBlock);
    assertThrows(IllegalStateException.class, () -> block.getFormat());
  }

  @Test
  void testParseHeaderInvalidCase1() throws IOException {
    String[] headerBlock = {"measured	1"};
    var block = new InstrumentResponseDataBlock(headerBlock);
    assertThrows(IllegalStateException.class, () -> block.getFormat());
  }
}
