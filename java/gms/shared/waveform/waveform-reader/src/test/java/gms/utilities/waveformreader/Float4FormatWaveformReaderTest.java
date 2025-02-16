package gms.utilities.waveformreader;

import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import org.junit.jupiter.api.Test;

class Float4FormatWaveformReaderTest {
  private final WaveformReader reader = new Float4FormatWaveformReader();
  private final String WFE1_FILE = "/css/WFS4/F4Test.w";
  private final int SAMPLES_TO_READ = 10;
  private final int SAMPLES_TO_SKIP = 0;
  private final double[] REF_SAMPLES = {
    -1.7115830573727316E38,
    -1.7115828545486355E38,
    -1.7115828545486355E38,
    -1.7115828545486355E38,
    -1.7115830573727316E38,
    -1.7115834630209236E38,
    -1.7115834630209236E38,
    -1.7115834630209236E38,
    -1.7115826517245395E38,
    -1.7115824489004434E38
  };

  @Test
  void testReadTestData() throws Exception {
    WaveformReaderTestUtil.testReadTestData(
        reader,
        this.getClass().getResourceAsStream(WFE1_FILE),
        SAMPLES_TO_READ,
        SAMPLES_TO_SKIP,
        REF_SAMPLES);
  }

  @Test
  void testReadTestDataSkipError() throws Exception {
    assertThrows(
        IOException.class,
        () ->
            WaveformReaderTestUtil.testReadTestData(
                reader,
                this.getClass().getResourceAsStream(WFE1_FILE),
                SAMPLES_TO_READ,
                -2,
                new double[] {}));
  }
}
