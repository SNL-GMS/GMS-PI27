package gms.shared.utilities.signalprocessing.normalization;

import java.util.Arrays;

public final class MaxAmplitudeNormalizer {

  private MaxAmplitudeNormalizer() {
    // Hide implicit public constructor
  }

  /**
   * Normalizes a set of waveform data by the maximum amplitude of the waveform
   *
   * @param waveformData the waveform data to normalize
   * @return the normalized waveform data
   */
  public static double[] normalize(double[] waveformData) {
    var possibleMaxAmp = Arrays.stream(waveformData).map(Math::abs).max();

    if (possibleMaxAmp.isPresent()) {
      var maxAmp = possibleMaxAmp.getAsDouble();

      return Arrays.stream(waveformData).map(value -> value / maxAmp).toArray();
    } else {
      throw new IllegalArgumentException(
          "Cannot normalize data when a maximum amplitude cannot be calculated");
    }
  }
}
