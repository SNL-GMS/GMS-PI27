package gms.shared.fk.plugin.algorithms;

import com.google.common.base.Preconditions;
import com.google.common.primitives.Ints;
import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.fk.plugin.algorithms.util.FftUtilities;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.RelativePosition;
import gms.shared.utilities.signalprocessing.normalization.DeMeaner;
import gms.shared.utilities.signalprocessing.normalization.MaxAmplitudeNormalizer;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.FkSpectrum;
import gms.shared.waveform.coi.Waveform;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import org.apache.commons.lang3.Validate;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.complex.ComplexField;
import org.apache.commons.math3.linear.Array2DRowFieldMatrix;
import org.apache.commons.math3.linear.ArrayFieldVector;

public final class CaponFkSpectrumAlgorithm {

  private static final double NANOS_PER_SEC = 1.0e9;
  private static final double ZERO_THRESHOLD = 1.0e-5;
  private static final double QUAL_3_RATIO = powerDecibel(2.0);
  private static final int ALLOWABLE_JITTER_FACTOR = 2;
  private static final double MIN_QUAL_1_RATIO = powerDecibel(6);
  private static final double MIN_QUAL_2_RATIO = powerDecibel(4);
  private static final double MIN_QUAL_3_RATIO = powerDecibel(1);

  private final FkSpectraDefinition definition;
  private final double mediumVelocityKmPerSec;
  private Map<Channel, RelativePosition> relativePositionsByChannelName;

  private CaponFkSpectrumAlgorithm(
      FkSpectraDefinition definition,
      double mediumVelocityKmPerSec,
      Map<Channel, RelativePosition> relativePositionsByChannelName) {
    this.mediumVelocityKmPerSec = mediumVelocityKmPerSec;
    this.definition = definition;
    this.relativePositionsByChannelName = relativePositionsByChannelName;
  }

  public static CaponFkSpectrumAlgorithm create(
      FkSpectraDefinition definition,
      double mediumVelocityKmPerSec,
      Map<Channel, RelativePosition> relativePositionsByChannelName) {
    Preconditions.checkNotNull(definition);
    Preconditions.checkNotNull(relativePositionsByChannelName);

    return new CaponFkSpectrumAlgorithm(
        definition, mediumVelocityKmPerSec, relativePositionsByChannelName);
  }

  /**
   * Generate FK Spectra for the given {@link Waveform}s
   *
   * @param channelSegments {@link Waveform}s from which to generate FK Spectra
   * @return temporal sequence of FK Spectra
   * @throws IllegalArgumentException if the algorithm parameters are inconsistent or degenerate
   */
  public List<FkSpectrum> generateFk(Collection<ChannelSegment<Waveform>> channelSegments) {

    //
    // Validate input data
    //

    Objects.requireNonNull(
        channelSegments,
        "CaponFkSpectrumAlgorithm cannot generate FK Spectra with null channel segments");

    Validate.notEmpty(
        channelSegments,
        "CaponFkSpectrumAlgorithm cannot generate FK Spectra with zero channel segments");

    Validate.isTrue(
        channelSegments.stream().map(ChannelSegment::getId).collect(Collectors.toSet()).size()
            == channelSegments.size(),
        "CaponFkSpectrumAlgorithm cannot generate an FKSpectra from duplicate channel segments");

    // Determine the start and end points of the Spectra
    List<FkSpectrum> fkList = new ArrayList<>();

    List<ChannelSegment<Waveform>> fkChannelSegments =
        transformChannelSegmentsByWaveform(channelSegments, DeMeaner::demean);
    if (definition.isNormalizeWaveforms()) {
      fkChannelSegments =
          transformChannelSegmentsByWaveform(fkChannelSegments, MaxAmplitudeNormalizer::normalize);
    }

    Optional<Instant> possibleStart = getModalTime(channelSegments, Waveform::getStartTime);
    Optional<Instant> possibleEnd = getModalTime(channelSegments, Waveform::getEndTime);
    if (possibleStart.isPresent() && possibleEnd.isPresent()) {
      Instant jitterBaseStartTime = possibleStart.get();
      Instant endTime = possibleEnd.get();
      Validate.isTrue(
          !jitterBaseStartTime.plus(definition.getWindowLength()).isAfter(endTime),
          "Initial window end extends beyond the end of the waveforms");

      var fkSamplePeriod =
          Duration.ofNanos((long) ((1 / definition.getSampleRateHz()) * NANOS_PER_SEC));

      final List<RelativePosition> relativePositionsList =
          channelSegments.stream()
              .map(
                  channelSegment ->
                      relativePositionsByChannelName.get(
                          channelSegment.getId().getChannel().toEntityReference()))
              .toList();

      /*
       * Fk Timeseries:
       *        |            |             |
       * 0.5    1    1.5     2      2.5    3    3.5
       * |______|     |______|       |_____|
       * [----------]
       *            [--------------]
       *                           [-----------]
       * Waveform Timeseries:
       * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       * FKs are centered at 1, 2, and 3
       * The distance between 1 and 2, and 2 and 3 is the sample period for the fk, which is equal
       * to 1 / sampleRate
       * The distance between 0 and 1, 1.5 and 2, and 2.5 and 3 is the window lead (noted by |_|)
       * The distance between 0 and 1.5, 1.5 and 2.5, and 2.5, and 3.5 is the window length
       * (noted by [-])
       */
      for (Instant windowStart = jitterBaseStartTime,
              fkStartTime = windowStart.plus(definition.getWindowLead());
          !windowStart.plus(definition.getWindowLength()).isAfter(endTime);
          fkStartTime = fkStartTime.plus(fkSamplePeriod),
              windowStart = fkStartTime.minus(definition.getWindowLead())) {
        generateSingleFk(fkChannelSegments, relativePositionsList, windowStart, jitterBaseStartTime)
            .ifPresent(fkList::add);
      }
    }

    return fkList;
  }

  private Optional<Instant> getModalTime(
      Collection<ChannelSegment<Waveform>> channelSegments,
      Function<Waveform, Instant> timeConverter) {
    Map<Instant, Long> startTimeMap =
        channelSegments.stream()
            .flatMap(channelSegment -> channelSegment.getTimeseries().stream())
            .filter(this::validateSampleRate)
            .collect(Collectors.groupingBy(timeConverter, Collectors.counting()));

    Optional<Long> possibleMax = startTimeMap.values().stream().max(Long::compareTo);

    if (possibleMax.isPresent()) {
      long maxCount = possibleMax.get();
      List<Instant> modalTimes =
          startTimeMap.entrySet().stream()
              .filter(timeCountPair -> timeCountPair.getValue() == maxCount)
              .map(Map.Entry::getKey)
              .sorted()
              .toList();

      return Optional.of(modalTimes.get(0));
    }

    return Optional.empty();
  }

  private boolean validateSampleRate(Waveform waveform) {
    double sampleRateDifference =
        Math.abs(waveform.getSampleRateHz() - definition.getWaveformSampleRateHz());
    return Double.compare(sampleRateDifference, definition.getWaveformSampleRateToleranceHz()) <= 0;
  }

  /**
   * Gets the subset of waveforms that can be used to calculate an FkSpectrum in the time window
   * defined by windowStart, windowEnd (inclusive). This includes rejecting any waveforms that have
   * sample rates out of tolerance (according the setup of this algorithm), that are within the
   * allowable jitter (< 1/2 sample period off the jitterBaseStartTime), and contain both the start
   * and end times, once they have been snapped to the jitter sample
   *
   * @param channelSegments The channel segments for which the usable subset will be calculated
   * @param windowStart The start time of the FkSpectrum
   * @param windowEnd The end time of the FkSpectrum
   * @param jitterBaseStartTime The reference point against which all waveforms are compared for
   *     jitter.
   * @return A subset of waveforms suitable for calculating the FkSpectrum defined by the
   *     windowStart and windowEnd.
   */
  private List<Waveform> getWaveformSubset(
      Collection<ChannelSegment<Waveform>> channelSegments,
      Instant windowStart,
      Instant windowEnd,
      Instant jitterBaseStartTime) {

    return channelSegments.stream()
        .flatMap(cs -> cs.getTimeseries().stream())
        .filter(this::validateSampleRate)
        .filter(waveform -> jitterCheck(waveform, jitterBaseStartTime))
        .map(waveform -> shiftWaveform(waveform, jitterBaseStartTime))
        .filter(waveform -> waveform.computeTimeRange().contains(windowStart))
        .filter(waveform -> waveform.computeTimeRange().contains(windowEnd))
        .toList();
  }

  private Waveform shiftWaveform(Waveform waveform, Instant jitterBaseStartTime) {
    // snap
    if (jitterBaseStartTime.equals(waveform.getStartTime())) {
      return waveform;
    }

    Duration allowableJitter =
        Duration.ofNanos((long) ((1 / definition.getWaveformSampleRateHz()) * NANOS_PER_SEC))
            .dividedBy(ALLOWABLE_JITTER_FACTOR);

    Duration positiveJitter = calculateJitter(waveform, jitterBaseStartTime, true);
    if (positiveJitter.compareTo(allowableJitter) < 0) {
      // waveform starts late, so we snap it back
      return Waveform.create(
          waveform.getStartTime().minus(positiveJitter),
          waveform.getSampleRateHz(),
          waveform.getSamples());
    } else {
      Duration negativeJitter = calculateJitter(waveform, jitterBaseStartTime, false);
      return Waveform.create(
          waveform.getStartTime().plus(negativeJitter),
          waveform.getSampleRateHz(),
          waveform.getSamples());
    }
  }

  private Duration calculateJitter(
      Waveform waveform, Instant jitterBaseStartTime, boolean isPositive) {
    if (jitterBaseStartTime.equals(waveform.getStartTime())) {
      return Duration.ofNanos(0);
    }

    Instant actualStart = waveform.getStartTime();
    Duration unfilledArea = Duration.between(jitterBaseStartTime, actualStart).abs();
    var samplePeriod =
        Duration.ofNanos((long) ((1 / definition.getWaveformSampleRateHz()) * NANOS_PER_SEC));

    long unfilledSamples = unfilledArea.dividedBy(samplePeriod);

    Instant interpolatedStart;
    if (isPositive) {
      if (actualStart.isBefore(jitterBaseStartTime)) {
        interpolatedStart = actualStart.plus(samplePeriod.multipliedBy(unfilledSamples + 1));
      } else {
        interpolatedStart = actualStart.minus(samplePeriod.multipliedBy(unfilledSamples));
      }

      return Duration.between(jitterBaseStartTime, interpolatedStart);
    } else {
      if (actualStart.isBefore(jitterBaseStartTime)) {
        interpolatedStart = actualStart.plus(samplePeriod.multipliedBy(unfilledSamples));
      } else {
        interpolatedStart = actualStart.minus(samplePeriod.multipliedBy(unfilledSamples + 1));
      }

      return Duration.between(interpolatedStart, jitterBaseStartTime);
    }
  }

  /**
   * Determines if the provided waveform is within the jitter allowance
   *
   * @param waveform The waveform to validate
   * @param jitterBaseStartTime The minimum jitter time to use for validating the waveform sample
   *     jitter
   * @return True if the waveform's samples are off from the jitterBaseStartTime by less than 1 / 2
   *     waveform sample period
   */
  private boolean jitterCheck(Waveform waveform, Instant jitterBaseStartTime) {

    if (jitterBaseStartTime.equals(waveform.getStartTime())) {
      return true;
    }

    // the number of samples needed to get us as close to min start without going before
    // this basically operates as a divide followed by rounding down, so we know we have the next
    // sample equal to or after the min time.  Then if this interpolated start time is not within
    // the allowable jitter range (.5*deltime on either side of the start), calculate the next
    // sample
    // (right before the min start time), and see if it's within the jitter range
    var allowableJitter =
        Duration.ofNanos((long) ((1 / definition.getWaveformSampleRateHz()) * NANOS_PER_SEC));
    Duration positiveJitter = calculateJitter(waveform, jitterBaseStartTime, true);
    if (positiveJitter.compareTo(allowableJitter) < 0) {
      return true;
    } else {
      Duration negativeJitter = calculateJitter(waveform, jitterBaseStartTime, false);
      return negativeJitter.compareTo(allowableJitter) < 0;
    }
  }

  /**
   * Calculate the fstat given beam power (an fk element), average power, and the number of array
   * elements.
   *
   * @param fkPower A calculated fk pixel (beam power) (Units: dB)
   * @param pAvg Average of the powers of all the waveforms that went into the fk (Units: dB)
   * @param numChannels Number of channels used to create fk
   * @return The calculated fstat (Unitless)
   */
  private static double computeFStatistic(double fkPower, double pAvg, double numChannels) {
    double fstat = (numChannels - 1) * fkPower;
    fstat /= (pAvg - fkPower);
    return fstat;
  }

  /**
   * Measures the quality of the fk spectrum.
   *
   * @param fk the two-dimensional array of FK values
   * @return a number representing the quality of the fk heat map
   */
  private static int computeFkQual(double[][] fk) {
    Objects.requireNonNull(fk, "FK spectrum cannot be null");

    if (fk.length == 0) {
      throw new IllegalArgumentException("FK spectrum must be non-empty");
    }
    if (fk[0].length == 0) {
      throw new IllegalArgumentException("FK spectrum must have non-empty rows");
    }

    double[][] zeroedFk = zeroFkNans(fk);

    List<Double> fkPeakValues = new ArrayList<>();

    for (var y = 0; y < zeroedFk.length - 1; y++) {
      for (var x = 0; x < zeroedFk[y].length - 1; x++) {
        if (isPeak(x, y, zeroedFk)) {
          fkPeakValues.add(zeroedFk[y][x]);
        }
      }
    }

    double fkRatio = 0;
    if (!fkPeakValues.isEmpty()) {
      fkPeakValues.sort(Collections.reverseOrder());

      if (fkPeakValues.size() == 1 || fkPeakValues.get(1) <= 0.0) {
        // By definition, a spectrum with a single peak has a quality factor of 3 (powerDecibel(x)
        // for 1<=x<4)
        fkRatio = QUAL_3_RATIO;
      } else {
        double max = fkPeakValues.get(0);
        double secondMax = fkPeakValues.get(1);
        fkRatio = max / secondMax;
      }
    }

    return calculateFkQual(fkRatio);
  }

  private static int calculateFkQual(double fkRatio) {
    int fkQual;

    if (fkRatio >= MIN_QUAL_1_RATIO) {
      fkQual = 1;
    } else if (fkRatio >= MIN_QUAL_2_RATIO) {
      fkQual = 2;
    } else if (fkRatio >= MIN_QUAL_3_RATIO) {
      fkQual = 3;
    } else {
      fkQual = 4;
    }

    return fkQual;
  }

  /**
   * Given an FK, zero out the NaN values. Necessary for accurate FK Quality calculation.
   *
   * @param fk a 2D FK Power array
   * @return an array containing the same values as the input with NaNs replaced with 0
   */
  private static double[][] zeroFkNans(double[][] fk) {
    var zeroedFk = new double[fk.length][fk[0].length];
    for (var y = 0; y < fk.length; y++) {
      for (var x = 0; x < fk[0].length; x++) {
        if (Double.isNaN(fk[y][x])) {
          zeroedFk[y][x] = 0;
        } else {
          zeroedFk[y][x] = fk[y][x];
        }
      }
    }
    return zeroedFk;
  }

  /**
   * Converts the beam power measured by f-stat to decibels
   *
   * @param power the beam power returned by a call to f-stat
   * @return the beam power measured in decibels
   */
  private static double powerDecibel(double power) {
    return Math.pow(10, power / 10);
  }

  /**
   * Determines if an (x,y) coordinate within an fk spectrum is a local maximum by comparing it to
   * its neighbors
   *
   * @param xCoordinate x coordinate of the potential local maximum
   * @param yCoordinate y coordinate of the potential local maximum
   * @param fk the two-dimensional array of FK values
   * @return the (x, y) coordinates of the maximum value
   */
  private static boolean isPeak(int xCoordinate, int yCoordinate, double[][] fk) {
    var isPeak = true;

    double val = fk[yCoordinate][xCoordinate];

    // Single-pixel FK has no peak
    if (fk.length == 1 && fk[0].length == 1) {
      return false;
    }

    var before = -1;
    var above = -1;
    var after = 1;
    var below = 1;

    // Handle cases when pixel is not fully surrounded by neighbors ('edge' of matrix)
    if (yCoordinate == 0) {
      // Ignore top edge.
      above = 0;
    } else if (yCoordinate == fk.length - 1) {
      // Ignore bottom edge
      below = 0;
    } else {
      // not on an edge; take no action
    }

    if (xCoordinate == 0) {
      // Ignore left edge
      before = 0;
    } else if (xCoordinate == fk[0].length - 1) {
      // Ignore right edge
      after = 0;
    } else {
      // not on an edge; take no action
    }

    for (int i = above; i <= below; i++) {
      for (int j = before; j <= after; j++) {
        if (fk[yCoordinate + i][xCoordinate + j] > val) {
          isPeak = false;
          break;
        }
      }
    }

    return isPeak;
  }

  private static List<ChannelSegment<Waveform>> transformChannelSegmentsByWaveform(
      Collection<ChannelSegment<Waveform>> channelSegments,
      UnaryOperator<double[]> waveformTransform) {
    List<ChannelSegment<Waveform>> transformedChannelSegments = new ArrayList<>();

    for (ChannelSegment<Waveform> channelSegment : channelSegments) {
      List<Waveform> transformedWaveforms = new ArrayList<>();
      for (Waveform waveform : channelSegment.getTimeseries()) {
        transformedWaveforms.add(
            Waveform.create(
                waveform.getStartTime(),
                waveform.getSampleRateHz(),
                waveformTransform.apply(waveform.getSamples())));
      }

      // TODO Add processing mask data calls
      transformedChannelSegments.add(
          ChannelSegment.from(
              channelSegment.getId(),
              channelSegment.getUnits(),
              transformedWaveforms,
              List.of(),
              Map.of()));
    }

    return transformedChannelSegments;
  }

  Optional<FkSpectrum> generateSingleFk(
      List<ChannelSegment<Waveform>> channelSegments,
      List<RelativePosition> relativePositions,
      Instant windowStart,
      Instant minStartTime) {

    List<Waveform> waveformSubset =
        getWaveformSubset(
            channelSegments,
            windowStart,
            windowStart.plus(definition.getWindowLength()),
            minStartTime);

    List<Waveform> windowedWaveforms =
        waveformSubset.stream()
            .map(
                waveform ->
                    waveform.trim(windowStart, windowStart.plus(definition.getWindowLength())))
            .toList();

    if (windowedWaveforms.size() < definition.getMinimumWaveformsForSpectra()) {
      return Optional.empty();
    }

    int numSamples = windowedWaveforms.get(0).getSampleCount();
    int numChannels = windowedWaveforms.size();

    List<Complex[]> ffts =
        windowedWaveforms.stream()
            .map(FftUtilities::computeFftWindow)
            .map(FftUtilities::getComplexFft)
            .toList();
    Array2DRowFieldMatrix<Complex> fftWaveformMatrix =
        new Array2DRowFieldMatrix<>(ComplexField.getInstance(), numChannels, numSamples);

    for (var i = 0; i < numChannels; i++) {
      fftWaveformMatrix.setRow(i, ffts.get(i));
    }

    double delFrequency = definition.getWaveformSampleRateHz() / numSamples;

    double[] frequencyAxis = fftFreq(numSamples, delFrequency);

    /* frequencyBinIndices houses the bins of the bandpass filter imposed on the waveforms
     * before the FK spectrum is generated. */
    int[] frequencyBinIndices =
        findBinIndices(
            frequencyAxis, definition.getLowFrequencyHz(), definition.getHighFrequencyHz());

    // calculate the passband of the fft'd data.  That is, keep the values that correspond to the
    // indices in the frequencyAxis that pass the band pass filter
    // This is part of the outer summation in the FK formula
    int numFrequencyBins = frequencyBinIndices.length;
    ArrayFieldVector<Complex> passbandFrequencies =
        new ArrayFieldVector<>(ComplexField.getInstance(), numFrequencyBins);
    for (var i = 0; i < numFrequencyBins; i++) {
      passbandFrequencies.setEntry(i, new Complex(frequencyAxis[frequencyBinIndices[i]]));
    }

    Array2DRowFieldMatrix<Complex> passbandFfts =
        calculatePassbandFftMatrix(fftWaveformMatrix, frequencyBinIndices);

    int fftRows = definition.getSlowCountY();
    int fftCols = definition.getSlowCountX();
    var power = new double[fftRows][fftCols];
    var fstat = new double[fftRows][fftCols];

    double slowNorthStart = definition.getSlowStartYSecPerKm();
    double slowEastStart = definition.getSlowStartXSecPerKm();
    double slowNorthDelta = definition.getSlowDeltaYSecPerKm();
    double slowEastDelta = definition.getSlowDeltaXSecPerKm();

    double pAvg = calculateAveragePower(passbandFfts, numSamples, numChannels);
    double scalingFactor = 1 / Math.pow(numSamples, 2);
    for (var i = 0; i < fftRows; i++) {
      double slowNorth = slowNorthStart + ((fftRows - i) * slowNorthDelta);

      for (var j = 0; j < fftCols; j++) {
        var slowEast = slowEastStart + (j * slowEastDelta);
        var verticalSlowness = calculateVerticalSlowness(slowEast, slowNorth);

        var pixel =
            getPixel(
                verticalSlowness,
                numChannels,
                relativePositions,
                slowEast,
                slowNorth,
                passbandFrequencies,
                passbandFfts);
        if (!Double.isNaN(pixel)) {
          pixel *= scalingFactor;
        }
        power[i][j] = pixel;

        fstat[i][j] = computeFStatistic(power[i][j], pAvg, numChannels);
      }
    }

    return Optional.of(FkSpectrum.from(power, fstat, computeFkQual(power)));
  }

  private static double getPixel(
      double verticalSlowness,
      int numChannels,
      List<RelativePosition> relativePositions,
      double slowEast,
      double slowNorth,
      ArrayFieldVector<Complex> passbandFrequencies,
      Array2DRowFieldMatrix<Complex> passbandFfts) {

    if (Double.isNaN(verticalSlowness)) {
      return Double.NaN;
    }

    Array2DRowFieldMatrix<Complex> timeShifts =
        calculateTimeShifts(
            numChannels,
            relativePositions,
            slowEast,
            slowNorth,
            verticalSlowness,
            passbandFrequencies);
    Array2DRowFieldMatrix<Complex> shiftedWaveforms = rowWiseMultiply(timeShifts, passbandFfts);

    ArrayFieldVector<Complex> beam =
        new ArrayFieldVector<>(ComplexField.getInstance(), passbandFrequencies.getDimension());
    beam = shiftBeam(beam, numChannels, shiftedWaveforms);
    beam = (ArrayFieldVector<Complex>) beam.mapDivide(new Complex(numChannels));

    return Arrays.stream(beam.toArray())
        .map(Complex::abs)
        .map(absBeamPoint -> Math.pow(absBeamPoint, 2))
        .mapToDouble(Double::valueOf)
        .sum();
  }

  private static ArrayFieldVector<Complex> shiftBeam(
      ArrayFieldVector<Complex> beam,
      int numChannels,
      Array2DRowFieldMatrix<Complex> shiftedWaveforms) {
    for (var k = 0; k < numChannels; k++) {
      beam = beam.add((ArrayFieldVector<Complex>) shiftedWaveforms.getRowVector(k));
    }
    return beam;
  }

  private static Array2DRowFieldMatrix<Complex> rowWiseMultiply(
      Array2DRowFieldMatrix<Complex> matrix1, Array2DRowFieldMatrix<Complex> matrix2) {
    Preconditions.checkState(
        matrix1.getRowDimension() == matrix2.getRowDimension(), "Row dimensions must match");
    Preconditions.checkState(
        matrix1.getColumnDimension() == matrix2.getColumnDimension(),
        "Column dimensions must match");

    Array2DRowFieldMatrix<Complex> result =
        new Array2DRowFieldMatrix<>(
            ComplexField.getInstance(), matrix1.getRowDimension(), matrix1.getColumnDimension());

    for (var i = 0; i < matrix1.getRowDimension(); i++) {
      result.setRowVector(i, matrix1.getRowVector(i).ebeMultiply(matrix2.getRowVector(i)));
    }

    return result;
  }

  static Array2DRowFieldMatrix<Complex> calculateTimeShifts(
      int numChannels,
      List<RelativePosition> relativePositions,
      double slowEast,
      double slowNorth,
      double verticalSlowness,
      ArrayFieldVector<Complex> passbandFrequencies) {

    ArrayFieldVector<Complex> timeShifts =
        new ArrayFieldVector<>(ComplexField.getInstance(), numChannels);
    Array2DRowFieldMatrix<Complex> shiftFactor =
        new Array2DRowFieldMatrix<>(
            ComplexField.getInstance(), numChannels, passbandFrequencies.getDimension());

    for (var i = 0; i < numChannels; i++) {
      var position = relativePositions.get(i);
      double timeShift =
          position.getEastDisplacementKm() * slowEast
              + position.getNorthDisplacementKm() * slowNorth
              + position.getVerticalDisplacementKm() * verticalSlowness;
      timeShifts.setEntry(i, new Complex(timeShift));
      var timeShiftFrequencyRow = passbandFrequencies.mapMultiply(new Complex(timeShift));
      var timeShiftFrequenceRowPrime =
          timeShiftFrequencyRow.mapMultiply(Complex.I.multiply(2 * Math.PI));
      for (var j = 0; j < passbandFrequencies.getDimension(); j++) {
        shiftFactor.setEntry(i, j, timeShiftFrequenceRowPrime.getEntry(j).exp());
      }
    }

    return shiftFactor;
  }

  private double calculateVerticalSlowness(double slowEast, double slowNorth) {
    double verticalSlowness;
    // compute 3D FK...
    if (definition.isUseChannelVerticalOffsets()) {
      verticalSlowness =
          1.0 / (mediumVelocityKmPerSec * mediumVelocityKmPerSec)
              - Math.pow(slowEast, 2)
              - Math.pow(slowNorth, 2);
      if (verticalSlowness >= ZERO_THRESHOLD) {
        verticalSlowness = Math.sqrt(verticalSlowness);
      } else {
        verticalSlowness = Double.NaN;
      }
    } else {
      // ...or else compute 2D FK
      verticalSlowness = 0.0;
    }

    return verticalSlowness;
  }

  private static Array2DRowFieldMatrix<Complex> calculatePassbandFftMatrix(
      Array2DRowFieldMatrix<Complex> ffts, int[] frequencyBinIndices) {
    int numFrequencyBins = frequencyBinIndices.length;

    // if the frequencyBin indices are always consecutive, might be able to use getSubMatrix
    Array2DRowFieldMatrix<Complex> passBandFfts =
        new Array2DRowFieldMatrix<>(
            ComplexField.getInstance(), ffts.getRowDimension(), numFrequencyBins);

    for (var i = 0; i < numFrequencyBins; i++) {
      passBandFfts.setColumn(i, ffts.getColumn(frequencyBinIndices[i]));
    }

    return passBandFfts;
  }

  private static double calculateAveragePower(
      Array2DRowFieldMatrix<Complex> passBandFfts, int numSamples, int channelCount) {
    var pAvg = 0.0;

    Complex[][] data = passBandFfts.getData();
    for (Complex[] passbandFft : data) {
      for (Complex complex : passbandFft) {
        pAvg += Math.pow(complex.abs(), 2);
      }
    }
    pAvg /= channelCount;
    pAvg /= Math.pow(numSamples, 2);
    return pAvg;
  }

  /**
   * Compute the FFT Frequency Bin Array for an array with N Samples. Based on the NumPy library
   * function numpy.fft.fftfreq found here: https://docs.scipy
   * .org/doc/numpy/reference/generated/numpy.fft.fftfreq.html
   *
   * @param numSamples the number of waveform samples
   * @param deltaFrequency the value on which the frequency bin values should be scaled
   * @return The calculated FFT Frequency Bin Array
   */
  static double[] fftFreq(int numSamples, double deltaFrequency) {

    var freqBinCenters = new double[numSamples];

    // Compute the 'range' of values for the sample frequency array that will be non-negative.
    // e.g. if n = 6, the resulting array polarity will be [0-2] are positive, [3-5] are negative
    // and if n = 5, the polarity would be [0-2] are positive, [3-4] are negative
    int positiveBinRange = (int) Math.ceil(numSamples / 2.0);

    int negativeBaseVal = (int) Math.ceil(-numSamples / 2.0);
    for (var i = 0; i < freqBinCenters.length; i++) {
      int baseVal;
      if (i < positiveBinRange) {
        baseVal = i;
      } else {
        baseVal = negativeBaseVal;
        negativeBaseVal++;
      }
      freqBinCenters[i] = baseVal * deltaFrequency;
    }

    return freqBinCenters;
  }

  /**
   * Iterates through an array of FFT sample frequencies and determines what indices apply for
   * frequency bins (e.g. are within the range between the low and high frequency)
   *
   * @param sampleFrequencies array of FFT sample frequencies
   * @param lowFrequency lower bound for comparing sample frequencies (inclusive)
   * @param highFrequency upper bound for comparing sample frequencies (inclusive)
   * @return an array of frequency bin indices
   */
  static int[] findBinIndices(
      double[] sampleFrequencies, double lowFrequency, double highFrequency) {
    List<Integer> binIndices = new ArrayList<>();
    for (var i = 0; i < sampleFrequencies.length; i++) {
      double absBinCenterVal = Math.abs(sampleFrequencies[i]);
      if (absBinCenterVal >= lowFrequency && absBinCenterVal <= highFrequency) {
        binIndices.add(i);
      }
    }
    return Ints.toArray(binIndices);
  }
}
