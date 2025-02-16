package gms.utilities.waveformreader;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class DefaultWaveformReader {

  private static final Logger LOGGER = LoggerFactory.getLogger(DefaultWaveformReader.class);

  // Mapping from Format to DefaultWaveformReader.  This gives a DefaultWaveformReader that can be
  // used to
  // read
  // a particular Format of waveform.
  private static final Map<FormatCode, WaveformReader> formatReaders =
      Map.of(
          FormatCode.F4, new Float4FormatWaveformReader(),
          FormatCode.S3, new Sun3FormatWaveformReader(),
          FormatCode.S4, new Sun4FormatWaveformReader(),
          FormatCode.I4, new I4FormatWaveformReader(),
          FormatCode.CD, new CanadianCompressedWaveformReader(),
          FormatCode.CC, new CanadianCompressedWaveformReader(),
          FormatCode.E1, new E1FormatWaveformReader(),
          FormatCode.CM6, new Cm6WaveformReader(),
          FormatCode.T4, new SunSinglePrecisionReal(),
          FormatCode.S2, new Sun2FormatWaveformReader());

  private DefaultWaveformReader() {}

  /**
   * Calls the proper waveform reader and reads the data bytes
   *
   * @param input data bytes
   * @param format the format code, e.g. 's4' or 'b#'.
   * @param samplesToRead number of samples to read
   * @param skip number of samples to skip
   * @return DefaultWaveformReader for the given format code, or null if the format code is unknown
   *     or there is no DefaultWaveformReader for it.
   */
  public static double[] readSamples(InputStream input, String format, int samplesToRead, int skip)
      throws IOException {
    WaveformReader reader = readerFor(format);
    return reader.read(input, samplesToRead, skip);
  }

  public static double[] readSamples(InputStream input, String format) throws IOException {
    WaveformReader reader = readerFor(format);
    return reader.read(input, input.available(), 0);
  }

  public static double[] readSamples(
      InputStream input, String format, int samplesToRead, long fOff, int skip) throws IOException {

    if (fOff > input.available()) {
      throw new IOException("Number of bytes from input stream of file less than foff.");
    }
    long skipped = input.skip(fOff);

    if (skipped != fOff) {
      throw new IOException("Skipped bytes of file not equal to foff.");
    }

    WaveformReader reader = readerFor(format);

    return reader.read(input, samplesToRead, skip);
  }

  /**
   * Looks up a DefaultWaveformReader corresponding to the given format code (CSS 3.0).
   *
   * @param fc the format code, e.g. 's4' or 'b#'.
   * @return DefaultWaveformReader for the given format code, or null if the format code is unknown
   *     or there is no DefaultWaveformReader for it.
   */
  public static WaveformReader readerFor(String fc) {
    var format = FormatCode.fcFromString(fc);
    if (format == null || !formatReaders.containsKey(format)) {
      String error = "Unsupported format: " + fc;
      LOGGER.error(error);
      throw new IllegalArgumentException(error);
    }
    return formatReaders.get(format);
  }
}
