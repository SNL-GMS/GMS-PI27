package gms.shared.stationdefinition.repository.util;

import java.util.List;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.commons.math3.complex.Complex;

/**
 * Interface to describe the operation of the parser that will read a block of instrument response
 * data. The blocks contain data in formats such as FAP, PAZ, and FIR.
 */
public interface InstrumentResponseBlockParser {

  /**
   * Converts the instrument response data block into a list of frequency-response pairs
   * representing the complex instrument response function H(f)
   *
   * @param block the data from one block of an instrument response file
   * @param freqs the list of frequencies
   * @return a list of (freq, response) pairs representing the complex instrument response function
   * @throws IllegalArgumentException if the block data cannot be parsed as expected
   */
  List<Pair<Double, Complex>> parseBlock(String[] block, List<Double> freqs)
      throws IllegalArgumentException;
}
