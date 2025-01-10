package gms.shared.stationdefinition.repository.util;

import static com.google.common.base.Preconditions.checkState;

import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.regex.Pattern;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.math3.analysis.interpolation.LinearInterpolator;
import org.apache.commons.math3.complex.Complex;

/** Implements {@link InstrumentResponseBlockParser} for FAP data blocks. */
public class FapBlockParser implements InstrumentResponseBlockParser {

  private static final int INDEX_OF_NUM_DATA_ROWS = 1;
  private static final int INDEX_OF_DATA_START = 2;
  private static final int GROUP_OF_FREQUENCY = 1;
  private static final int GROUP_OF_AMPLITUDE = 2;
  private static final int GROUP_OF_PHASE = 3;
  private static final int NUM_OF_OVERHEAD_ROWS = 2;
  private static final int MIN_NUM_OF_ROWS = 4;
  private static final Pattern FIVE_COLUMNS =
      Pattern.compile(
          "^(\\S+)\\s+(\\S+)\\s+(\\S+)\\s+(\\S+)\\s+(\\S+)$", Pattern.UNICODE_CHARACTER_CLASS);

  /**
   * Converts a block of FAP data into a list of (frequency, instrument response) pairs. For each
   * freq f, the associated instrument response is the interpolation of the two responses for the
   * two bounding frequencies in the FAP data. If freq f is outside of the range of FAP frequencies,
   * Complex.NaN is returned instead.
   *
   * @param block the block of FAP data with an ignored header row, a row containing the number of
   *     data rows N, and N rows of data. The data rows are in the format frequency amplitude phase
   *     amplitude_error phase_error.
   * @param freqs the list of frequencies f at which the instrument response will be calculated
   * @return the list of (frequency, instrument response) pairs
   * @throws IllegalArgumentException if an error is encountered while parsing the data block
   */
  @Override
  public List<Pair<Double, Complex>> parseBlock(String[] block, List<Double> freqs)
      throws IllegalArgumentException {

    List<Pair<Double, Pair<Double, Double>>> fapData;
    try {
      fapData = parseFapDataFromBlock(block);
    } catch (NumberFormatException | IllegalStateException | NoSuchElementException e) {
      throw new IllegalArgumentException("The data block is not the in the proper FAP format. ", e);
    }

    return interpolateFrequencies(fapData, freqs);
  }

  private static List<Pair<Double, Pair<Double, Double>>> parseFapDataFromBlock(String[] block) {
    checkState(block.length >= MIN_NUM_OF_ROWS);

    var numDataRows = Integer.parseInt(block[INDEX_OF_NUM_DATA_ROWS].trim());

    checkState(numDataRows > 1);
    checkState(block.length == NUM_OF_OVERHEAD_ROWS + numDataRows);

    return Arrays.stream(block)
        .skip(INDEX_OF_DATA_START)
        .limit(numDataRows)
        .map(
            (String line) -> {
              var m = FIVE_COLUMNS.matcher(line.trim());
              if (m.matches()) {
                var freq = Double.parseDouble(m.group(GROUP_OF_FREQUENCY));
                var amp = Double.parseDouble(m.group(GROUP_OF_AMPLITUDE));
                var phase = Double.parseDouble(m.group(GROUP_OF_PHASE));
                return Pair.of(freq, Pair.of(amp, phase));
              } else {
                throw new IllegalStateException(
                    "The FAP data was not in the format `freq amp phase amp_err phase_err`");
              }
            })
        .toList();
  }

  /** Amplitudes are interpolated in log-space; phases are interpolated in linear-space */
  private static List<Pair<Double, Complex>> interpolateFrequencies(
      List<Pair<Double, Pair<Double, Double>>> fapData, List<Double> freqs) {

    return freqs.stream().map(f -> interpolate(f, fapData)).toList();
  }

  /** Extrapolation evaluates to Complex.NaN */
  private static Pair<Double, Complex> interpolate(
      double freq, List<Pair<Double, Pair<Double, Double>>> fapData) {

    var minFreq = fapData.get(0).getLeft();
    var maxFreq = fapData.get(fapData.size() - 1).getLeft();

    // Return Complex.NaN if freq is out of bounds
    if (freq < minFreq || freq > maxFreq) {
      return Pair.of(freq, Complex.NaN);
    }

    var lowerBound =
        fapData.stream()
            .filter(pair -> pair.getLeft() <= freq)
            .reduce((first, second) -> second)
            .orElseThrow();

    var upperBound =
        fapData.stream().filter(pair -> pair.getLeft() >= freq).findFirst().orElseThrow();

    // Return the fapData response if freq is in fapData
    if (lowerBound.equals(upperBound)) {
      return Pair.of(
          freq, convert(lowerBound.getRight().getLeft(), lowerBound.getRight().getRight()));
    }

    // Otherwise, interpolate between lowerBound and upperBound
    var logFreq = new double[] {Math.log10(lowerBound.getLeft()), Math.log10(upperBound.getLeft())};
    var logAmp =
        new double[] {
          Math.log10(lowerBound.getRight().getLeft()), Math.log10(upperBound.getRight().getLeft())
        };
    var ampInterpolator = new LinearInterpolator().interpolate(logFreq, logAmp);
    var amplitude = Math.pow(10.0, ampInterpolator.value(Math.log10(freq)));

    var linearFreq = new double[] {lowerBound.getLeft(), upperBound.getLeft()};
    var linearPhase =
        new double[] {lowerBound.getRight().getRight(), upperBound.getRight().getRight()};
    var phaseInterpolator = new LinearInterpolator().interpolate(linearFreq, linearPhase);
    var phase = phaseInterpolator.value(freq);

    return Pair.of(freq, convert(amplitude, phase));
  }

  /** Converts polar form to rectangular form */
  private static Complex convert(double amplitude, double phase) {
    return Complex.valueOf(Math.cos(Math.toRadians(phase)), Math.sin(Math.toRadians(phase)))
        .multiply(amplitude);
  }
}
