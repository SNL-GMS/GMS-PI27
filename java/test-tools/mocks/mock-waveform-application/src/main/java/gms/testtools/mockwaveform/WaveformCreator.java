package gms.testtools.mockwaveform;

import com.fasterxml.jackson.databind.ObjectReader;
import com.google.common.collect.Range;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.waveform.coi.Waveform;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WaveformCreator {

  private static final Logger LOGGER = LoggerFactory.getLogger(WaveformCreator.class);

  private static final int SAMPLE_RATE_SECONDS = 40;

  private static final URL FILE =
      WaveformCreator.class
          .getClassLoader()
          .getResource("Waveforms" + File.separator + "WaveformsArrayCalibrated.json");

  private static final Logger logger = LoggerFactory.getLogger(WaveformCreator.class);

  private final ObjectReader jsonReader = ObjectMappers.jsonReader();
  private double[] samples;

  private WaveformCreator() {
    try {
      samples = jsonReader.readValue(FILE, double[].class);
    } catch (IOException e) {
      logger.error("Error reading waveform samples.", e);
    }
  }

  public static WaveformCreator create() {
    return new WaveformCreator();
  }

  public List<Waveform> getWaveforms(List<Range<Instant>> waveformTimeRanges, int initialPosition) {

    Objects.requireNonNull(waveformTimeRanges);
    Objects.requireNonNull(initialPosition);

    if (waveformTimeRanges.isEmpty()) {
      logger.warn("Empty list of time ranges passed to Waveform creator, returning empty list");
      return Collections.emptyList();
    }

    if (samples.length == 0) {
      logger.error("Samples for waveforms were not loaded");
      return Collections.emptyList();
    }

    var position = initialPosition;
    List<Waveform> waveformList = new ArrayList<>();

    for (var timeRange : waveformTimeRanges) {

      var numSamples =
          (int)
              (Duration.between(timeRange.lowerEndpoint(), timeRange.upperEndpoint()).toSeconds()
                  * SAMPLE_RATE_SECONDS);
      var waveformArray = new double[numSamples];
      position = getSubsetOfSamplesCircularArray(samples, waveformArray, position);
      try {
        var newWaveform =
            Waveform.create(timeRange.lowerEndpoint(), SAMPLE_RATE_SECONDS, waveformArray);
        // EndTime is not computed until the getter is called
        newWaveform.getEndTime();
        waveformList.add(newWaveform);
      } catch (IllegalArgumentException | IllegalStateException ex) {
        LOGGER.warn(
            "Unable to process data with invalid data for [startTime:{} sampleRateHz:{}] request. "
                + " Skipping inclusion of invalid waveform into list",
            timeRange.lowerEndpoint(),
            SAMPLE_RATE_SECONDS,
            ex);
        throw ex;
      }
    }

    return waveformList;
  }

  public int getsamplesLength() {
    return samples.length;
  }

  private int getSubsetOfSamplesCircularArray(
      double[] samples, double[] waveformArray, int initialPosition) {
    var samplesPosition = initialPosition;
    var wavPos = 0;
    var endPos = samplesPosition + waveformArray.length;
    int rem;

    while (endPos >= samples.length) {

      rem = samples.length - samplesPosition;
      System.arraycopy(samples, samplesPosition, waveformArray, wavPos, rem);
      samplesPosition = 0;
      wavPos += rem;
      endPos -= samples.length;
    }
    rem = endPos - samplesPosition;
    System.arraycopy(samples, samplesPosition, waveformArray, wavPos, rem);

    return samplesPosition + rem;
  }
}
