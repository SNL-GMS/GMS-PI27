package gms.shared.stationdefinition.repository.util;

import static com.google.common.base.Preconditions.checkState;

import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.regex.Pattern;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.math3.complex.Complex;

/** Implements {@link InstrumentResponseBlockParser} for PAZ data blocks. */
public class PazBlockParser implements InstrumentResponseBlockParser {

  private static final int INDEX_OF_NUM_POLES = 2;
  private static final int INDEX_OF_POLE_DATA_START = 3;
  private static final int GROUP_OF_REAL_PART = 1;
  private static final int GROUP_OF_IMAGINARY_PART = 2;
  private static final int NUM_OF_OVERHEAD_ROWS = 5;
  private static final int MIN_NUM_OF_ROWS = 6;
  private static final Pattern FOUR_COLUMNS =
      Pattern.compile("^(\\S+)\\s+(\\S+)\\s+(\\S+)\\s+(\\S+)$", Pattern.UNICODE_CHARACTER_CLASS);

  /**
   * Converts a block of PAZ data into a list of (frequency, instrument response) pairs. For each
   * freq f, the associated instrument response is (the product over m of (i * 2pi * f - zm))
   * divided by (the product over n of (i * 2pi * f - pn)), where pn and zm are the poles and zeros,
   * respectively, read from the PAZ data block.
   *
   * @param block the block of PAZ data with an ignored header row, an ignored row with a
   *     normalization constant, a row containing the number of poles N, N rows of pole data, a row
   *     containing the number of zeros M, and M rows of zero data. The pole and zero data rows are
   *     in the format real_part imaginary_part real_error imaginary_error, space-delimited.
   * @param freqs the list of frequencies f at which the instrument response will be calculated
   * @return the list of (frequency, instrument response) pairs
   * @throws IllegalArgumentException if an error is encountered while parsing the data block
   */
  @Override
  public List<Pair<Double, Complex>> parseBlock(String[] block, List<Double> freqs)
      throws IllegalArgumentException {

    List<Complex> poles;
    List<Complex> zeros;

    try {
      poles = parsePolesFromBlock(block);
      zeros = parseZerosFromBlock(block, poles.size());
    } catch (NumberFormatException | IllegalStateException | NoSuchElementException e) {
      throw new IllegalArgumentException("The data block is not the in the proper PAZ format. ", e);
    }

    return freqs.stream().map(freq -> Pair.of(freq, calculateH(freq, poles, zeros))).toList();
  }

  private static List<Complex> parsePolesFromBlock(String[] block) {
    checkState(block.length >= MIN_NUM_OF_ROWS);

    var numPoles = Integer.parseInt(block[INDEX_OF_NUM_POLES].trim());

    checkState(numPoles > 0);
    checkState(block.length >= NUM_OF_OVERHEAD_ROWS + numPoles);

    return Arrays.stream(block)
        .skip(INDEX_OF_POLE_DATA_START)
        .limit(numPoles)
        .map(PazBlockParser::parseLine)
        .toList();
  }

  private static List<Complex> parseZerosFromBlock(String[] block, int numPoles) {
    var indexNumZeros = INDEX_OF_POLE_DATA_START + numPoles;
    var indexZeroDataStart = indexNumZeros + 1;
    var numZeros = Integer.parseInt(block[indexNumZeros].trim());

    checkState(numZeros > 0);
    checkState(block.length == indexZeroDataStart + numZeros);

    return Arrays.stream(block)
        .skip(indexZeroDataStart)
        .limit(numZeros)
        .map(PazBlockParser::parseLine)
        .toList();
  }

  private static Complex parseLine(String line) {
    var m = FOUR_COLUMNS.matcher(line.trim());
    if (m.matches()) {
      return Complex.valueOf(
          Double.parseDouble(m.group(GROUP_OF_REAL_PART)),
          Double.parseDouble(m.group(GROUP_OF_IMAGINARY_PART)));
    } else {
      throw new IllegalStateException(
          "The PAZ data was not in the format `real img real_err img_err`");
    }
  }

  /**
   * H(f) = (the product over m of (i * 2pi * f - zm)) / (the product over n of (i * 2pi * f - pn))
   */
  private static Complex calculateH(double freq, List<Complex> poles, List<Complex> zeros) {

    var iFreqRadiansPerSecond = Complex.I.multiply(2.0 * Math.PI * freq);
    var numerator =
        zeros.stream().map(iFreqRadiansPerSecond::subtract).reduce(Complex::multiply).orElseThrow();
    var denominator =
        poles.stream().map(iFreqRadiansPerSecond::subtract).reduce(Complex::multiply).orElseThrow();

    return numerator.divide(denominator);
  }
}
