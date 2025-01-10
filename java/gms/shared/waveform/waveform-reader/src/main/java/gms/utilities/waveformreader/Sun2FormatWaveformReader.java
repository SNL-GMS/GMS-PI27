package gms.utilities.waveformreader;

import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

/** Code for reading waveform format 's2', SUN integer (2 bytes). */
public class Sun2FormatWaveformReader implements WaveformReader {

  /**
   * Reads the InputStream as an S3 waveform.
   *
   * @param input the input stream to read from
   * @param skip number of samples to skip
   * @param numSamples number of samples to read
   * @return
   * @throws IOException
   */
  @Override
  public double[] read(InputStream input, int numSamples, int skip) throws IOException {
    Objects.requireNonNull(input);
    int skipBytes = skip * Short.SIZE / Byte.SIZE;
    skipBytes = Math.min(input.available(), skipBytes);
    long skippedBytes = input.skip(skipBytes);

    if (skipBytes != skippedBytes) {
      throw new IOException(
          "Bytes to skip was: " + skipBytes + ", but actual bytes skipped was: " + skippedBytes);
    }

    var dis = new DataInputStream(input);

    var data = new double[numSamples];
    var i = 0;
    for (; i < numSamples && dis.available() > 0; i++) {
      data[i] = dis.readShort();
    }

    // Check if no data could be read
    if (i == 0) {
      return new double[] {};
    }

    return data;
  }
}
