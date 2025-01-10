package gms.utilities.waveformreader;

import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

/** Code for reading waveform format 's3', SUN integer (3 bytes). */
public class Sun3FormatWaveformReader implements WaveformReader {

  private static final int BITS_PER_DATUM = 24;
  private static final long BYTES_PER_SAMPLE = 3;
  private static final int INPUT_STREAM_BIT_LENGTH = 1024;

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

    long skipBytes = skip * BYTES_PER_SAMPLE / Byte.SIZE;
    skipBytes = Math.min(input.available(), skipBytes);
    long skippedBytes = input.skip(skipBytes);
    if (skipBytes != skippedBytes) {
      throw new IOException(
          "Bytes to skip was: " + skipBytes + ", but actual bytes skipped was: " + skippedBytes);
    }

    var bis = new BitInputStream(input, INPUT_STREAM_BIT_LENGTH);

    var data = new double[numSamples];
    var i = 0;
    for (; i < numSamples && bis.available() > 0; i++) {
      data[i] = bis.readSigned(BITS_PER_DATUM);
    }

    // Check if no data could be read
    if (i == 0) {
      return new double[] {};
    }

    return data;
  }
}
