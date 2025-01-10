package gms.utilities.waveformreader;

import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class I4FormatWaveformReader implements WaveformReader {

  private static final long BYTES_PER_SAMPLE = 4L;

  private static final Logger LOGGER = LoggerFactory.getLogger(I4FormatWaveformReader.class);

  /**
   * Reads the InputStream as an S4 waveform.
   *
   * @param input the input stream to read from
   * @param numSamples number of samples to read
   * @param skip number of samples to skip
   * @return int[] of digitizer counts from the waveform
   */
  @Override
  public double[] read(InputStream input, int numSamples, int skip) throws IOException {
    Objects.requireNonNull(input);

    var data = new double[numSamples];
    if (input.skip(skip * BYTES_PER_SAMPLE) != skip * BYTES_PER_SAMPLE) {
      LOGGER.error("The skip method returned an invalid number of bytes skipped.");
      throw new IOException("Skip resulted in error");
    } else {
      var dis = new DataInputStream(input);

      var i = 0;
      for (; i < numSamples && dis.available() > 0; i++) {
        data[i] = Integer.reverseBytes(dis.readInt());
      }
    }
    return data;
  }
}
