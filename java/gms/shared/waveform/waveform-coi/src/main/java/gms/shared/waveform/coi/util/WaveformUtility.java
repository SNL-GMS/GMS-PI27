package gms.shared.waveform.coi.util;

import gms.shared.waveform.coi.Waveform;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import org.apache.commons.lang3.ArrayUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class WaveformUtility {

  private static final Logger LOGGER = LoggerFactory.getLogger(WaveformUtility.class);

  private static final double MIN_GAP_SAMPLE_COUNT_FOR_INTERPOLATION = 1.5;
  private static final long SECONDS_TO_NANOS = 1_000_000_000L;

  private WaveformUtility() {
    // Hide implicit public constructor
  }

  /**
   * Check for the possible insertion of interpolated waveforms between any sample gaps that may
   * exist in this ChannelSegments {@link Waveform}s. A gap is interpolatable if the sample spacing
   * between two adjacent {@link Waveform}s differs by more than 1.5 samples where the sample rate
   * is defined as the mean of the two adjacent waveforms. Also, the sample rates of the two
   * adjacent {@link Waveform}s must be within the input tolerance for the interpolation to occur.
   *
   * <p>The method returns a new ChannelSegment even if no interpolatable waveforms were inserted.
   * In that case the returned ChannelSegment is a copy of the original with a new internal
   * ChannelSegment id.
   *
   * @param sampleRateTolerance The acceptable sample rate tolerance between two adjacent {@link
   *     Waveform}s.
   * @param maximumGapSampleCountLimit The size of the gap beyond which interpolation is not
   *     performed. The gap limit is defined as a number of sample periods using the mean sample
   *     rate between two adjacent {@link Waveform}s.
   * @return A new ChannelSegment containing 0 to the number of input {@link Waveform}s - 1
   *     interpolated waveforms between the initial waveforms defining this ChannelSegment on input.
   */
  public static List<Waveform> interpolateWaveformGap(
      List<Waveform> waveforms, double sampleRateTolerance, double maximumGapSampleCountLimit) {

    // return if the waveform set is empty.
    if (waveforms == null || waveforms.isEmpty()) {
      return waveforms;
    }

    // create a new list of waveforms for the new channel segment and iterate over all waveforms in
    // this
    // channel segment. Add the first waveform to the new list to begin
    List<Waveform> newWaveforms = new ArrayList<>();
    Iterator<Waveform> waveformIterator = waveforms.iterator();
    var previousWaveform = waveformIterator.next();
    newWaveforms.add(previousWaveform);
    while (waveformIterator.hasNext()) {

      // get the next waveform after the previous and see if the sample rates are comparable.
      var nextWaveform = waveformIterator.next();
      if (Math.abs(previousWaveform.getSampleRateHz() - nextWaveform.getSampleRateHz())
          <= sampleRateTolerance) {

        // get the fractional gap sample count (fractional sample period between the two waveforms)
        // and check to see if an interpolated waveform is required (gap is equal to or larger than
        // 1.5 samples but smaller than the maximumGapLimit).
        double fractionalGapSampleCount = getFractionalSampleCount(previousWaveform, nextWaveform);
        if (fractionalGapSampleCount >= MIN_GAP_SAMPLE_COUNT_FOR_INTERPOLATION
            && fractionalGapSampleCount < maximumGapSampleCountLimit) {

          // make a new Waveform that has a sample rate as close to the mean of the original
          // adjacent
          // waveforms as possible. The start time of the new waveform will be equal to the end time
          // of the previous waveform plus 1 sample period (the sample period of the new waveform).
          // The end time will be the start time of the next waveform minus 1 sample period). The
          // number of samples will be the rounded value of the fractionalGapSampleCount - 1. Since
          // the fractionalGapSampleCount is always 1.5 or larger the rounded value - 1 will always
          // contain at least one sample. The new sample count will be 1 for 1.5 <= fraction < 2.5,
          // 2 for 2.5 <= fraction < 3.5, and so on.
          long newSampleCount = Math.round(fractionalGapSampleCount) - 1;

          // make a double array of newSampleCount points and fill with the linearly interpolated
          // values from the last sample of the previousWaveform to the first sample of the
          // nextWaveform
          double[] samples = interpolateWaveforms(newSampleCount, previousWaveform, nextWaveform);

          // create the new waveform as the previous and add to the waveform set.
          double gapTimeWidth =
              getDurationSeconds(previousWaveform.getEndTime(), nextWaveform.getStartTime());
          double sampleRate = (samples.length + 1) / gapTimeWidth;
          long samplePeriod = (long) (SECONDS_TO_NANOS / sampleRate);

          previousWaveform =
              Waveform.create(
                  previousWaveform.getEndTime().plusNanos(samplePeriod), sampleRate, samples);
          newWaveforms.add(previousWaveform);
        }
      }

      // add the next waveform, update the previousWaveform and continue
      newWaveforms.add(nextWaveform);
      previousWaveform = nextWaveform;
    }

    // return the new waveforms
    return newWaveforms;
  }

  private static double[] interpolateWaveforms(
      long newSampleCount, Waveform previousWaveform, Waveform nextWaveform) {
    var samples = new double[(int) newSampleCount];

    double startSample = previousWaveform.getLastSample();
    double delSample = (nextWaveform.getFirstSample() - startSample) / (newSampleCount + 1);
    for (var i = 1; i <= newSampleCount; ++i) {
      samples[i - 1] = delSample * i + startSample;
    }

    return samples;
  }

  /**
   * Check for the possible merger of existing adjacent {@link Waveform}s where the sample period of
   * the gap between the two {@link Waveform}s is larger than 0 so it is not an overlap, but less
   * than 1.5 samples.If these conditions are met the two adjacent waveforms are merged into a
   * single waveform. Also, the sample rates of the two adjacent {@link Waveform}s must be within
   * the input tolerance for the merger to occur. When a waveform in the list is completely enclosed
   * by the previous waveform in the list, it is removed.
   *
   * @param waveforms the list of {@link Waveform}s to be merged
   * @param sampleRateTolerance The acceptable sample rate tolerance between two adjacent {@link
   *     Waveform}s. The gap limit is defined as a number of sample periods using the mean sample
   *     rate between two adjacent {@link Waveform}s.
   * @param sampleDifferenceAllowed
   * @return A new ChannelSegment containing 0 to the number of input {@link Waveform}s -1 merged
   *     waveforms on return.
   */
  public static List<Waveform> mergeWaveforms(
      List<Waveform> waveforms, double sampleRateTolerance, double sampleDifferenceAllowed) {

    // return this if ChannelSegment waveform set is empty.
    if (waveforms == null || waveforms.isEmpty()) {
      return waveforms;
    }

    var sortedWaveforms = waveforms.stream().sorted().toList();

    // create a new list for the new channel segment and iterate over all waveforms in this
    // channel segment. Add the first waveform to the new list to begin
    List<Waveform> newWaveforms = new ArrayList<>();
    var previousWaveform = sortedWaveforms.get(0);
    newWaveforms.add(previousWaveform);

    for (Waveform nextWaveform : sortedWaveforms.subList(1, sortedWaveforms.size())) {
      LOGGER.info(
          "Waveform start: {} and end: {}", nextWaveform.getStartTime(), nextWaveform.getEndTime());
      // get the next waveform after the previous and see if the sample rates are comparable.
      if (Math.abs(previousWaveform.getSampleRateHz() - nextWaveform.getSampleRateHz())
          <= sampleRateTolerance) {
        LOGGER.info("SampleRate is within tolerance. Checking for sample count.");

        // get the fractional gap sample count (fractional sample period between the two waveforms)
        // and check to see if a merged waveform is required (gap is less than specified number of
        // samples and
        // positive, so it is not an overlap instead).
        double fractionalGapSampleCount = getFractionalSampleCount(previousWaveform, nextWaveform);

        // do not want any gaps that are negative, meaning overlaps.
        if (fractionalGapSampleCount < sampleDifferenceAllowed && fractionalGapSampleCount >= 0) {
          LOGGER.info("Merging waveforms");

          nextWaveform = merge(previousWaveform, nextWaveform);

          // remove the previous waveform (which is now merged) and continue
          newWaveforms.remove(newWaveforms.size() - 1);
        }
      }
      if (isNextWaveformDistinctFromPreviousWaveform(previousWaveform, nextWaveform)) {
        // add the next waveform, update the previousWaveform and continue, but only if the
        // nextWaveform is distrinct from (not included in) the previous waveform
        newWaveforms.add(nextWaveform);
        previousWaveform = nextWaveform;
      }
    }

    // return the merged waveforms
    LOGGER.info("Returning list as {}", newWaveforms.size());
    return newWaveforms;
  }

  private static boolean isNextWaveformDistinctFromPreviousWaveform(
      Waveform previousWaveform, Waveform nextWaveform) {
    return !((previousWaveform.getStartTime().isBefore(nextWaveform.getStartTime())
            || previousWaveform.getStartTime().equals(nextWaveform.getStartTime()))
        && (previousWaveform.getEndTime().isAfter(nextWaveform.getEndTime())
            || previousWaveform.getEndTime().equals(nextWaveform.getEndTime())));
  }

  /**
   * Merges two waveforms together, including their underlying values
   *
   * @param first The first waveform to merge
   * @param second The second waveform to merge
   * @return The merged waveform, including the values from the two input waveforms.
   */
  private static Waveform merge(Waveform first, Waveform second) {
    // make a new Waveform that is a merger of the previousWaveform and the next Waveform
    double[] samples = ArrayUtils.addAll(first.getSamples(), second.getSamples());
    double sampleRate =
        (samples.length - 1) / getDurationSeconds(first.getStartTime(), second.getEndTime());
    return Waveform.create(first.getStartTime(), sampleRate, samples);
  }

  /**
   * Returns the fractional sample count in a gap between the two input {@link Waveform}s as a
   * Duration.
   *
   * @param previousWaveform The earlier {@link Waveform}
   * @param nextWaveform The later {@link Waveform}
   * @return The fractional sample count as a Duration.
   */
  private static double getFractionalSampleCount(Waveform previousWaveform, Waveform nextWaveform) {
    double meanSampleRate =
        (nextWaveform.getSampleRateHz() + previousWaveform.getSampleRateHz()) / 2.0;
    return meanSampleRate
        * getDurationSeconds(previousWaveform.getEndTime(), nextWaveform.getStartTime());
  }

  /**
   * Returns the time difference of a gap between two adjacent {@link Waveform}s
   *
   * @param startTime The start time of the gap.
   * @param endTime The end time of the gap.
   * @return The gap time difference in seconds.
   */
  private static double getDurationSeconds(Instant startTime, Instant endTime) {
    return getDurationSeconds(Duration.between(startTime, endTime));
  }

  /**
   * Converts the input Duration to (double) seconds and returns the result.
   *
   * @param duration The input Duration to be converted to (double) seconds.
   * @return The input Duration in (double) seconds.
   */
  private static double getDurationSeconds(Duration duration) {
    return (double) duration.getNano() / SECONDS_TO_NANOS + duration.getSeconds();
  }
}
