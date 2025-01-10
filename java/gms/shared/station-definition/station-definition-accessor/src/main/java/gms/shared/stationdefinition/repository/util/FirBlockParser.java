package gms.shared.stationdefinition.repository.util;

import static com.google.common.base.Preconditions.checkState;

import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.regex.Pattern;
import java.util.stream.IntStream;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.math3.complex.Complex;

/** Implements {@link InstrumentResponseBlockParser} for FIR data blocks. */
public class FirBlockParser implements InstrumentResponseBlockParser {

  private static final int GROUP_OF_COEFFICIENT = 1;
  private static final int INDEX_OF_SAMPLE_FREQ = 1;
  private static final int INDEX_OF_NUM_COEFFICIENTS = 2;
  private static final int INDEX_OF_DATA_START = 3;
  private static final int NUM_OF_OVERHEAD_ROWS = 4;
  private static final Pattern TWO_COLUMNS =
      Pattern.compile("^(\\S+)\\s+(\\S+)$", Pattern.UNICODE_CHARACTER_CLASS);

  /**
   * Converts a block of FIR data into a list of (frequency, instrument response) pairs. For each
   * freq f, the associated instrument response is the sum over n of bn * exp(-i * 2pi * f * n /
   * fs), where fs is the sampling frequency and bn are the coefficients parsed from the FIR data
   * block. The phase of H(f) is then set to zero to remove the time shift from the FIR impulse
   * response, while maintaining the same amplitude.
   *
   * @param block the block of FIR data with an ignored header rows, a row containing the sample
   *     frequency, a row containing the number of coefficients N, N rows of coefficient data, and a
   *     final row containing 0
   * @param freqs the list of frequencies f at which the instrument response will be calculated
   * @return the list of (frequency, instrument response) pairs
   * @throws IllegalArgumentException if an error is encountered while parsing the data block
   */
  @Override
  public List<Pair<Double, Complex>> parseBlock(String[] block, List<Double> freqs)
      throws IllegalArgumentException {

    List<Double> coefficients;
    double sampFreq;
    try {
      coefficients = parseCoefficientsFromBlock(block);
      sampFreq = parseSampleFrequencyFromBlock(block);
    } catch (NumberFormatException | IllegalStateException | NoSuchElementException e) {
      throw new IllegalArgumentException("The data block is not the in the proper FIR format. ", e);
    }

    return freqs.stream()
        .map(freq -> Pair.of(freq, calculateH(freq, coefficients, sampFreq)))
        .map(pair -> Pair.of(pair.getLeft(), Complex.valueOf(pair.getRight().abs(), 0.0)))
        .toList();
  }

  private static List<Double> parseCoefficientsFromBlock(String[] block) {
    checkState(block.length > NUM_OF_OVERHEAD_ROWS);

    var numCoefficients = Integer.parseInt(block[INDEX_OF_NUM_COEFFICIENTS].trim());
    checkState(block.length == numCoefficients + NUM_OF_OVERHEAD_ROWS);

    // Data starts on the 4th line and goes through the next-to-last line
    return Arrays.stream(block)
        .skip(INDEX_OF_DATA_START)
        .limit(numCoefficients)
        .map(
            (String line) -> {
              var m = TWO_COLUMNS.matcher(line.trim());
              if (m.matches()) {
                return Double.valueOf(m.group(GROUP_OF_COEFFICIENT));
              } else {
                throw new IllegalStateException(
                    "The FIR data was not in the format `coeff coeff_err`");
              }
            })
        .toList();
  }

  private static double parseSampleFrequencyFromBlock(String[] block) {
    return Integer.parseInt(block[INDEX_OF_SAMPLE_FREQ].trim());
  }

  /** H(f) = the sum over n of b-sub-n * exp(-i * 2pi * f * n / sampFreq) */
  private static Complex calculateH(double freq, List<Double> coefficients, double sampFreq) {

    var relativeFreqInRadians = Complex.I.multiply(-2.0 * Math.PI * freq / sampFreq);

    return IntStream.range(0, coefficients.size())
        .mapToObj(n -> relativeFreqInRadians.multiply(n).exp().multiply(coefficients.get(n)))
        .reduce(Complex::add)
        .orElseThrow();
  }
}
