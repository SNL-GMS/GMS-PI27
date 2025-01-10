package gms.utilities.waveformreader;

import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Code for reading waveform E1 compressed format. */
public class E1FormatWaveformReader implements WaveformReader {

  private static final Logger LOGGER = LoggerFactory.getLogger(E1FormatWaveformReader.class);
  private static final int BITS_TO_READ = 1024;
  private static final int COMP_SIZE_BITS = 16;
  private static final int SAMPLE_BITS = 16;
  private static final int DIFFERENCE_BITS = 8;
  private static final int CHECK_VALUE_BITS = 24;
  private static final int COMPRESSION_RATIO = 4;
  private static final int COMPRESSION_OVERHEAD = 2;
  private static final int SAMPLE_SIZE_7 = 7;
  private static final int BIT_LENGTH_9 = 9;
  private static final int SAMPLE_SIZE_3 = 3;
  private static final int BIT_LENGTH_10 = 10;
  private static final int SAMPLE_SIZE_4 = 4;
  private static final int BIT_LENGTH_7 = 7;
  private static final int SAMPLE_SIZE_5 = 5;
  private static final int BIT_LENGTH_12 = 12;
  private static final int BIT_LENGTH_15 = 15;
  private static final int BIT_LENGTH_28 = 28;
  private static final int BIT_LENGTH_2 = 2;
  private static final int SETS_DATA_TYPE = 0;
  private static final int DOES_NOT_SET_DATA_TYPE = 1;
  private static final int FOUR_7_BIT_SAMPLES = 0;
  private static final int FIVE_12_BIT_SAMPLES = 1;
  private static final int FOUR_15_BIT_SAMPLES = 2;
  private static final int ONE_28_BIT_SAMPLE = 3;
  private static final double TOLERANCE = 1E-8;

  /**
   * Reads the InputStream as an E1 waveform.
   *
   * @param is the input data stream
   * @param numSamples the number of samples in the stream
   * @param skip the number of skipped samples in the stream
   * @return the array representing the E1 waveform
   */
  @Override
  public double[] read(InputStream is, int numSamples, int skip) throws IOException {
    Objects.requireNonNull(is);

    if (numSamples <= 0) {
      return new double[0];
    }

    var bis = new BitInputStream(is, BITS_TO_READ);

    int totalSamples = numSamples + skip;
    var data = new double[numSamples];

    // Loop over each record
    var recNum = 0;
    while (recNum < totalSamples && bis.available() > 0) {
      // Get the size of compressed data
      int compSize = bis.readUnsigned(COMP_SIZE_BITS);
      if (compSize < 0) {
        break;
      }

      // Get the length of compressed data
      int compLength = (compSize / COMPRESSION_RATIO) - COMPRESSION_OVERHEAD;

      // Get the number of data samples
      int numSamp = bis.readUnsigned(SAMPLE_BITS);
      if (numSamp < 0) {
        break;
      }

      // Get the number of differences
      int numDiff = bis.readUnsigned(DIFFERENCE_BITS);
      if (numDiff < 0) {
        break;
      }

      // Get the check value
      int check = bis.readSigned(CHECK_VALUE_BITS);

      // Allocate memory for the uncompressed data
      var dataFrame = new double[numSamp];

      // Demap the data
      demapData(compLength, numSamp, dataFrame, bis);

      // Integrate the data
      for (var i = 0; i < numDiff; i++) {
        WaveformReaderUtil.integrate(dataFrame, 0, numSamp);
      }

      // Check decompression
      logDecompressionError(numSamp, check, dataFrame);

      // Skip records as necessary, incrementing recNum as records are processed
      recNum = skipRecords(recNum, totalSamples, skip, dataFrame, data);
    }

    return data;
  }

  private static void demapData(int compLength, int numSamp, double[] dataFrame, BitInputStream bis)
      throws IOException {
    var bitCount = 0;
    var sampleCount = 0;
    while ((bitCount < compLength) && (sampleCount < numSamp)) {
      int code1 = bis.readUnsigned(1);
      sampleCount = processCode1(code1, sampleCount, numSamp, dataFrame, bis);
      bitCount++;
      // Note: sampleCount is incremented as necessary in the processCode methods
    }
  }

  private static int processCode1(
      int code1, int sampleCount, int numSamp, double[] dataFrame, BitInputStream bis)
      throws IOException {
    switch (code1) {
      case SETS_DATA_TYPE -> {
        /*
         * 7 9-bit samples Bit map format:
         * 0AAAAAAA|AABBBBBB|BBBCCCCC|CCCCDDDD
         * DDDDDEEE|EEEEEEFF|FFFFFFFG|GGGGGGGG
         */
        for (var k = 0; k < SAMPLE_SIZE_7 && sampleCount < numSamp; k++, sampleCount++) {
          dataFrame[sampleCount] = bis.readSigned(BIT_LENGTH_9);
        }
      }
      case DOES_NOT_SET_DATA_TYPE -> {
        int code2 = bis.readUnsigned(1);
        sampleCount = processCode2(code2, sampleCount, numSamp, dataFrame, bis);
      }
      default -> {
        // there are no other valid code1 values; take no action
      }
    }
    return sampleCount;
  }

  private static int processCode2(
      int code2, int sampleCount, int numSamp, double[] dataFrame, BitInputStream bis)
      throws IOException {
    switch (code2) {
      case SETS_DATA_TYPE -> {
        /*
         * 3 10-bit samples Bit map format:
         * 10AAAAAA|AAAABBBB|BBBBBBCC|CCCCCCCC
         */
        for (var k = 0;
            readAnotherSample(k, SAMPLE_SIZE_3, sampleCount, numSamp);
            k++, sampleCount++) {
          dataFrame[sampleCount] = bis.readSigned(BIT_LENGTH_10);
        }
      }
      case DOES_NOT_SET_DATA_TYPE -> {
        int code3 = bis.readUnsigned(BIT_LENGTH_2);
        sampleCount = processCode3(code3, sampleCount, numSamp, dataFrame, bis);
      }
      default -> {
        // there are no other valid code2 values; take no action
      }
    }
    return sampleCount;
  }

  private static int processCode3(
      int code3, int sampleCount, int numSamp, double[] dataFrame, BitInputStream bis)
      throws IOException {
    switch (code3) {
      case FOUR_7_BIT_SAMPLES -> {
        /*
         * 4 7-bit samples Bit map format:
         * 1100AAAA|AAABBBBB|BBCCCCCC|CDDDDDDD
         */
        for (var k = 0;
            readAnotherSample(k, SAMPLE_SIZE_4, sampleCount, numSamp);
            k++, sampleCount++) {
          dataFrame[sampleCount] = bis.readSigned(BIT_LENGTH_7);
        }
      }
      case FIVE_12_BIT_SAMPLES -> {
        /*
         * 5 12-bit samples Bit map format:
         * 1101AAAA|AAAAAAAA|BBBBBBBB|BBBBCCCC
         * CCCCCCCC|DDDDDDDD|DDDDEEEE|EEEEEEEE
         */
        for (var k = 0;
            readAnotherSample(k, SAMPLE_SIZE_5, sampleCount, numSamp);
            k++, sampleCount++) {
          dataFrame[sampleCount] = bis.readSigned(BIT_LENGTH_12);
        }
      }
      case FOUR_15_BIT_SAMPLES -> {
        /*
         * 4 15-bit samples Bit map format:
         * 1110AAAA|AAAAAAAA|AAABBBBB|BBBBBBBB
         * BBCCCCCC|CCCCCCCC|CDDDDDDD|DDDDDDDD
         */
        for (var k = 0;
            readAnotherSample(k, SAMPLE_SIZE_4, sampleCount, numSamp);
            k++, sampleCount++) {
          dataFrame[sampleCount] = bis.readSigned(BIT_LENGTH_15);
        }
      }
      case ONE_28_BIT_SAMPLE -> {
        /*
         * 1 28-bit sample Bit map format:
         * 1111AAAA|AAAAAAAA|AAAAAAAA|AAAAAAAA
         */
        dataFrame[sampleCount] = bis.readSigned(BIT_LENGTH_28);
        sampleCount++;
      }
      default -> {
        // there are no other valid code3 values; take no action
      }
    }
    return sampleCount;
  }

  private static boolean readAnotherSample(
      int sampleCountInRecord, int samplesInThisRecord, int sampleCount, int numSamp) {
    return (sampleCountInRecord < samplesInThisRecord) && (sampleCount < numSamp);
  }

  private static void logDecompressionError(int numSamp, int check, double[] dataFrame) {
    if ((numSamp > 0) && (Math.abs(check - dataFrame[numSamp - 1]) > TOLERANCE)) {
      LOGGER.error(
          "Error decompressing, check value ({}) does not match last value ({}).",
          check,
          dataFrame[numSamp - 1]);
    }
  }

  private static int skipRecords(
      int recNum, int totalSamples, int skip, double[] dataFrame, double[] data) {
    for (var j = 0; j < dataFrame.length && recNum < totalSamples; j++, recNum++) {
      if (recNum >= skip) {
        data[recNum - skip] = dataFrame[j];
      }
    }
    return recNum;
  }
}
