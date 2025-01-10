package gms.shared.stationdefinition.repository.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.File;
import java.io.IOException;
import org.junit.jupiter.api.Test;

class InstrumentResponseDataReaderTest {

  @Test
  void testReadEmptyFile() throws IOException {

    var file = File.createTempFile("temp", null);
    var blocks = InstrumentResponseDataReader.parseFile(file.getAbsolutePath()).stream().toList();
    assertEquals(0, blocks.size());
    file.deleteOnExit();
  }

  @Test
  void testReadWhitespaceFile() throws IOException {
    String fileLocation = "responseWhitespaceTestFile.fap";
    var url = this.getClass().getClassLoader().getResource(fileLocation);
    var file = new File(url.getFile());
    var blocks = InstrumentResponseDataReader.parseFile(file.getAbsolutePath()).stream().toList();
    assertEquals(1, blocks.size());
    var blockReview = blocks.get(0);
    var blockText = blockReview.getBlock();
    assertEquals(InstrumentResponseType.FAP, blockReview.getFormat());
    assertEquals(6, blockReview.getBlock().length);

    String[] expectedBlockText = {
      "theoretical 1 instrument fap texthere",
      "4",
      "1.000000e-01 1.000000e-01 101.01 0.0 0.0",
      "2.000000e-02 2.000000e-02 202.02 0.0 0.0",
      "3.000000e-03 3.000000e-03 303.03 0.0 0.0",
      "4.000000e-04 4.000000e-04 404.04 0.0 0.0"
    };
    assertEquals(expectedBlockText[0], blockText[0]);
    assertEquals(expectedBlockText[1], blockText[1]);
    assertEquals(expectedBlockText[2], blockText[2]);
    assertEquals(expectedBlockText[3], blockText[3]);
    assertEquals(expectedBlockText[4], blockText[4]);
    assertEquals(expectedBlockText[5], blockText[5]);
  }

  @Test
  void testSingleBlockFileString() throws IOException {

    String fileLocation = "responseTestFile1.fap";
    var url = this.getClass().getClassLoader().getResource(fileLocation);
    var file = new File(url.getFile());
    var blocks = InstrumentResponseDataReader.parseFile(file.getAbsolutePath()).stream().toList();
    assertEquals(1, blocks.size());

    assertEquals(InstrumentResponseType.FAP, blocks.get(0).getFormat());
    assertEquals(6, blocks.get(0).getBlock().length);
  }

  @Test
  void testSingleBlockFileResource() throws IOException {

    String fileLocation = "responseTestFile1.fap";
    var url = this.getClass().getClassLoader().getResource(fileLocation);
    var file = new File(url.getFile());
    var blocks = InstrumentResponseDataReader.parseFile(file).stream().toList();
    assertEquals(1, blocks.size());

    assertEquals(InstrumentResponseType.FAP, blocks.get(0).getFormat());
    assertEquals(6, blocks.get(0).getBlock().length);
  }

  @Test
  void testMultipleBlockStringResource() throws IOException {

    String fileLocation = "responseTestFile2.fap";
    var url = this.getClass().getClassLoader().getResource(fileLocation);
    var file = new File(url.getFile());
    var blocks = InstrumentResponseDataReader.parseFile(file.getAbsolutePath()).stream().toList();
    assertEquals(3, blocks.size());

    assertEquals(InstrumentResponseType.FAP, blocks.get(0).getFormat());
    assertEquals(6, blocks.get(0).getBlock().length);

    assertEquals(InstrumentResponseType.FAP, blocks.get(1).getFormat());
    assertEquals(7, blocks.get(1).getBlock().length);

    assertEquals(InstrumentResponseType.PAZ, blocks.get(2).getFormat());
    assertEquals(15, blocks.get(2).getBlock().length);
  }

  @Test
  void testMultipleBlockFileResource() throws IOException {

    String fileLocation = "responseTestFile2.fap";
    var url = this.getClass().getClassLoader().getResource(fileLocation);
    var file = new File(url.getFile());
    var blocks = InstrumentResponseDataReader.parseFile(file).stream().toList();
    assertEquals(3, blocks.size());

    assertEquals(InstrumentResponseType.FAP, blocks.get(0).getFormat());
    assertEquals(6, blocks.get(0).getBlock().length);

    assertEquals(InstrumentResponseType.FAP, blocks.get(1).getFormat());
    assertEquals(7, blocks.get(1).getBlock().length);

    assertEquals(InstrumentResponseType.PAZ, blocks.get(2).getFormat());
    assertEquals(15, blocks.get(2).getBlock().length);
  }
}
