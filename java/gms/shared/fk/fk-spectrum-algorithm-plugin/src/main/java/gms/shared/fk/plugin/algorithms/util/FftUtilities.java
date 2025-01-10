package gms.shared.fk.plugin.algorithms.util;

import gms.shared.waveform.coi.Waveform;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.apache.commons.math3.complex.Complex;
import org.jtransforms.fft.DoubleFFT_1D;

public final class FftUtilities {

  private static final int TWO_RESULTS_PER_WAVEFORM = 2;
  private static final int ONLY_EVENS = 2;
  private static final int RANGE_WIDTH_FACTOR = 2;

  private FftUtilities() {
    // Hide implicit public constructor
  }

  /**
   * Calculate the FFT for a {@link List} of {@link Waveform}s. Return a {@link List} of the FFTs.
   *
   * @param waveformList list of {@link Waveform}s
   * @return list of 1-D arrays of complex FFT of waveforms.
   *     <p>For each array, a[2*k]=Re[k], a[2*k+1]=Im[k] for k greater than or equal to zero, and k
   *     less than n where n is sample count of waveform.
   */
  public static List<double[]> computeFft(List<Waveform> waveformList) {
    ArrayList<double[]> fftList = new ArrayList<>();

    for (Waveform waveform : waveformList) {
      var doubleFft1D = new DoubleFFT_1D(waveform.getSampleCount());
      var result = new double[waveform.getSampleCount()];
      System.arraycopy(waveform.getSamples(), 0, result, 0, waveform.getSamples().length);
      doubleFft1D.realForward(result);
      fftList.add(result);
    }

    return fftList;
  }

  /**
   * Calculate the FFT for a {@link Waveform}
   *
   * @param waveform list of {@link Waveform}s
   * @return 1-D arrays of complex FFT of waveforms.
   *     <p>a[2*k]=Re[k], a[2*k+1]=Im[k] for k greater than or equal to zero, and k less than n,
   *     where n is sample count of waveform.
   */
  public static double[] computeFftWindow(Waveform waveform) {
    int waveformLength = waveform.getSamples().length;
    var doubleFFT = new DoubleFFT_1D(waveformLength);
    var result = new double[waveformLength * TWO_RESULTS_PER_WAVEFORM];
    System.arraycopy(waveform.getSamples(), 0, result, 0, waveformLength);

    doubleFFT.realForwardFull(result);

    return result;
  }

  /**
   * @param freq (Hz) - the frequency at which to calculate the corresponding bin
   * @param samplesPerSec (Hz) - the sample rate of the associated waveform
   * @param sampleCount - The number of samples included in the FFT
   * @return (int) - the bin corresponding with the given frequency, sampleRate, and sampleSize
   */
  private static int getLowBinFromFreq(double freq, double samplesPerSec, long sampleCount) {
    return (int) Math.ceil(freq * sampleCount / samplesPerSec);
  }

  /**
   * @param freq (Hz) - the frequency at which to calculate the corresponding bin
   * @param samplesPerSec (Hz) - the sample rate of the associated waveform
   * @param sampleCount - The number of samples included in the FFT
   * @return (int) - the bin corresponding with the given frequency, sampleRate, and sampleSize
   */
  private static int getHighBinFromFreq(double freq, double samplesPerSec, long sampleCount) {
    return (int) Math.floor(freq * sampleCount / samplesPerSec);
  }

  /**
   * @param fft - the FFT array the band pass filter should be applied to
   * @param lowFreq (Hz) - in the resulting FFT array, return zero values in all bins less than
   *     lowFreq
   * @param highFreq (Hz) - in the resulting FFT array, return zero values in all bins greater than
   *     highFreq
   * @return (double[]) A new FFT array that is the result of the pass band filter defined by
   *     lowFreq and highFreq applied to fft
   */
  public static double[] freqBandPassFilter(
      double[] fft, double sampleRate, double lowFreq, double highFreq) {
    Objects.requireNonNull(fft, "freqBandPassFilter requires non-null fft");

    var filteredFft = new double[fft.length];
    System.arraycopy(fft, 0, filteredFft, 0, fft.length);

    int lowBin = getLowBinFromFreq((float) lowFreq, (float) sampleRate, fft.length);
    int highBin = getHighBinFromFreq((float) highFreq, (float) sampleRate, fft.length);

    for (var i = 0; i < filteredFft.length - 1; i += ONLY_EVENS) {
      if (i != 1 && (i < lowBin * RANGE_WIDTH_FACTOR - 1 || i > highBin * RANGE_WIDTH_FACTOR)) {
        filteredFft[i] = 0.0;
        if (i != 0) {
          filteredFft[i + 1] = 0.0;
        }
      }
    }

    if (isEven(filteredFft.length)) {
      if (highBin < filteredFft.length / RANGE_WIDTH_FACTOR) {
        filteredFft[1] = 0.0;
      }
    } else {
      if (highBin < (filteredFft.length - 1) / RANGE_WIDTH_FACTOR) {
        filteredFft[1] = 0.0;
        filteredFft[filteredFft.length - 1] = 0.0;
      }
    }

    return filteredFft;
  }

  /**
   * Calculates the squared magnitude of the value at each frequency in each of the FFT arrays in
   * the provided List
   *
   * @param ffts - List of FFT arrays in JTransform format
   * @return List of arrays of the squared magnitudes calculated for each complex number in the
   *     provided FFT arrays, returned in real FFT format, not JTransform format
   */
  public static List<double[]> getRealPartOfFfts(List<double[]> ffts) {
    Objects.requireNonNull(ffts, "getRealPartOfFfts requires non-null ffts");

    List<double[]> list = new ArrayList<>();

    ffts.forEach(fft -> list.add(FftUtilities.getRealPartOfFft(fft)));

    return list;
  }

  /**
   * Calculates the squared magnitude of the value at each frequency in each of the FFT arrays in
   * the provided List
   *
   * @param ffts - List of FFT arrays in JTransform format
   * @return List of arrays of the squared magnitudes calculated for each complex number in the
   *     provided FFT arrays, returned in real FFT format, not JTransform format
   */
  public static List<double[]> getImaginaryPartOfFfts(List<double[]> ffts) {
    Objects.requireNonNull(ffts, "getImaginaryPartOfFfts requires non-null ffts");

    List<double[]> list = new ArrayList<>();

    ffts.forEach(fft -> list.add(FftUtilities.getImaginaryPartOfFft(fft)));

    return list;
  }

  /**
   * Calculates the squared magnitude of the value at each frequency in each of the FFT arrays in
   * the provided List
   *
   * @param ffts - List of FFT arrays in JTransform format
   * @return List of arrays of the squared magnitudes calculated for each complex number in the
   *     provided FFT arrays, returned in real FFT format, not JTransform format
   */
  public static List<double[]> calculateFftSquaredMagnitudes(List<double[]> ffts) {
    Objects.requireNonNull(ffts, "calculateFftSquaredMagnitudes requires non-null ffts");

    List<double[]> fftSquareMagnitudes = new ArrayList<>();

    ffts.forEach(fft -> fftSquareMagnitudes.add(FftUtilities.calculateFftSquaredMagnitude(fft)));

    return fftSquareMagnitudes;
  }

  /**
   * Calculates the magnitude of the value at each frequency in each of the FFT arrays in the
   * provided List
   *
   * @param ffts - List of FFT arrays in JTransform format
   * @return List of arrays of the magnitudes calculated for each complex number in the provided FFT
   *     arrays, returned in real FFT format, not JTransform format
   */
  public static List<double[]> calculateFftMagnitudes(List<double[]> ffts) {
    Objects.requireNonNull(ffts, "calculateFftMagnitudes requires non-null ffts");

    List<double[]> fftMagnitudes = new ArrayList<>();

    ffts.forEach(fft -> fftMagnitudes.add(FftUtilities.calculateFftMagnitude(fft)));

    return fftMagnitudes;
  }

  /**
   * Calculates the squared magnitude of the value at each frequency in an FFT array
   *
   * @param fft - FFT array in JTransform format
   * @return Array of the squared magnitudes calculated for each complex number value in the
   *     provided FFT array, returned in real FFT format, not JTransform format
   */
  private static double[] calculateFftSquaredMagnitude(double[] fft) {
    Objects.requireNonNull(fft, "calculateFftSquareMagnitude requires non-null fft");

    var fftSquareMag = new double[(fft.length / 2) + 1];

    if (isEven(fft.length)) {
      fftSquareMag[0] = Math.pow(fft[0], 2);
      fftSquareMag[fftSquareMag.length - 1] = Math.pow(fft[1], 2);
    } else {
      fftSquareMag[0] = Math.pow(fft[0], 2);
      fftSquareMag[fftSquareMag.length - 1] =
          Math.pow(fft[fft.length - 1], 2) + Math.pow(fft[1], 2);
    }

    int fftIndex;
    for (var i = 1; i < fftSquareMag.length - 1; i++) {
      fftIndex = i * 2;
      fftSquareMag[i] = Math.pow(fft[fftIndex], 2) + Math.pow(fft[fftIndex + 1], 2);
    }

    return fftSquareMag;
  }

  /**
   * Returns the real part of an FFT array
   *
   * @param fft - FFT array in JTransform format
   * @return Array of the real part of the array of the provided FFT array, returned in real FFT
   *     format, not JTransform format
   */
  private static double[] getRealPartOfFft(double[] fft) {
    Objects.requireNonNull(fft, "getRealPartOfFft requires non-null fft");

    double[] real;

    if (isEven(fft.length)) {
      real = new double[fft.length / 2 + 1];
      for (var i = 0; i < fft.length / 2; ++i) {
        real[i] = fft[2 * i];
      }
      real[fft.length / 2] = fft[1];
    } else {
      real = new double[(fft.length + 1) / 2];
      for (var i = 0; i < (fft.length + 1) / 2; ++i) {
        real[i] = fft[2 * i];
      }
    }

    return real;
  }

  public static Complex[] getComplexFft(double[] fft) {
    Objects.requireNonNull(fft, "getImaginaryPartOfFft requires non-null fft");

    Complex[] complex;
    int iterationSize;

    if (isEven(fft.length)) {
      complex = new Complex[fft.length / 2];
      iterationSize = fft.length / 2;
    } else {
      complex = new Complex[(fft.length + 1) / 2];
      iterationSize = (fft.length + 1) / 2;
    }

    for (var i = 0; i < iterationSize; i++) {
      complex[i] = new Complex(fft[2 * i], fft[2 * i + 1]);
    }

    return complex;
  }

  /**
   * Returns the imaginary part of an FFT array
   *
   * @param fft - FFT array in JTransform format
   * @return Array of the imaginary part of the array of the provided FFT array, returned in real
   *     FFT format, not JTransform format
   */
  private static double[] getImaginaryPartOfFft(double[] fft) {
    Objects.requireNonNull(fft, "getImaginaryPartOfFft requires non-null fft");

    double[] imag;

    if (isEven(fft.length)) {
      imag = new double[fft.length / 2 + 1];
      imag[0] = 0.0;
      for (var i = 1; i < fft.length / 2; ++i) {
        imag[i] = fft[2 * i + 1];
      }
      imag[fft.length / 2] = 0.0;
    } else {
      imag = new double[(fft.length + 1) / 2];
      imag[0] = 0.0;
      for (var i = 1; i < (fft.length - 1) / 2; ++i) {
        imag[i] = fft[2 * i + 1];
      }
      imag[(fft.length - 1) / 2] = fft[1];
    }

    return imag;
  }

  /**
   * Calculates the magnitude of the value at each frequency in an FFT array
   *
   * @param fft - FFT array in JTransform format
   * @return Array of the magnitudes calculated for each complex number value in the provided FFT
   *     array, returned in real FFT format, not JTransform format
   */
  private static double[] calculateFftMagnitude(double[] fft) {
    Objects.requireNonNull(fft, "calculateFftSquareMagnitude requires non-null fft");

    var fftMagnitude = new double[(fft.length / 2) + 1];

    if (isEven(fft.length)) {
      fftMagnitude[0] = Math.sqrt(Math.pow(fft[0], 2));
      fftMagnitude[fftMagnitude.length - 1] = Math.sqrt(Math.pow(fft[1], 2));
    } else {
      fftMagnitude[0] = Math.sqrt(Math.pow(fft[0], 2));
      fftMagnitude[fftMagnitude.length - 1] =
          Math.sqrt(Math.pow(fft[fft.length - 1], 2) + Math.pow(fft[1], 2));
    }

    int fftIndex;
    for (var i = 1; i < fftMagnitude.length - 1; i++) {
      fftIndex = i * 2;
      fftMagnitude[i] = Math.sqrt(Math.pow(fft[fftIndex], 2) + Math.pow(fft[fftIndex + 1], 2));
    }

    return fftMagnitude;
  }

  private static boolean isEven(int value) {
    return value % 2 == 0;
  }
}
