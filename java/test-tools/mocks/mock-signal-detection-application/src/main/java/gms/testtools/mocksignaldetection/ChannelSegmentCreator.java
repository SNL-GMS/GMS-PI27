package gms.testtools.mocksignaldetection;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectReader;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.waveform.coi.Waveform;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChannelSegmentCreator {

  private static final Logger logger = LoggerFactory.getLogger(ChannelSegmentCreator.class);

  private final ObjectReader channelSegmentReader =
      ObjectMappers.jsonReader().forType(new TypeReference<ChannelSegment<Timeseries>>() {});

  private ChannelSegment<Timeseries> channelSegment;

  private ChannelSegmentCreator() {
    parseChannelSegments();
  }

  public static ChannelSegmentCreator create() {
    return new ChannelSegmentCreator();
  }

  /** Parse a sample {@link ChannelSegment} JSON file to seed mock data. */
  private void parseChannelSegments() {
    try {
      var cs = SignalDetectionCreator.class.getClassLoader().getResource("channel-segment.json");
      channelSegment = channelSegmentReader.readValue(cs);
    } catch (IOException e) {
      logger.error("Error reading channel segment json file.", e);
    }
  }

  /**
   * Iterator over a set of {@link SignalDetection}s and, from the parsed sample JSON file, modify
   * these fields:
   *
   * <p>
   *
   * <pre>
   *  get the current hypothesis
   *  find the arrival time feature measurement
   *  get the measure channel segment descriptor
   *  and the arrival time feature measurement value (measurementValue.arrivalTime.value)
   *  new ChannelSegment ->  ChannelSegmentDescriptor channelSegmentDescriptor,
   *    Units units,
   *    Collection<T> series)
   *    Modify timeseries start and end times.
   *
   *  timeseries[] ->
   *    startTime -> values is same as id -> startTime
   *    endTime -> startTime + 1 second
   * </pre>
   *
   * @param signalDetections mock signal detections
   * @return collection of channel segments
   */
  public List<ChannelSegment<? extends Timeseries>> modifyChannelSegments(
      List<SignalDetection> signalDetections) {

    Objects.requireNonNull(signalDetections, "signalDetections may not be null");

    var segments = new ArrayList<ChannelSegment<? extends Timeseries>>();

    for (SignalDetection sd : signalDetections) {
      var h = sd.getSignalDetectionHypotheses().get(0);

      var at =
          h.getFeatureMeasurements().stream()
              .filter(
                  m ->
                      m.getFeatureMeasurementType()
                          .getFeatureMeasurementTypeName()
                          .equals(
                              FeatureMeasurementTypes.ARRIVAL_TIME.getFeatureMeasurementTypeName()))
              .findFirst();

      if (at.isPresent()) {
        var atFm = at.get();
        if (atFm.getMeasuredChannelSegment().isPresent()) {
          var descriptor = atFm.getMeasuredChannelSegment().get().getId();
          var arrivalTimeMeasurementValue =
              (ArrivalTimeMeasurementValue) atFm.getMeasurementValue();

          List<Timeseries> waveformList = new ArrayList<>();

          try {
            var waveform = (Waveform) channelSegment.getTimeseries().get(0);
            var newWaveform =
                Waveform.create(
                    arrivalTimeMeasurementValue.getArrivalTime().getValue(),
                    waveform.getSampleRateHz(),
                    waveform.getSamples());

            // EndTime is not computed until the getter is called
            newWaveform.getEndTime();
            waveformList.add(newWaveform);
          } catch (IllegalArgumentException | IllegalStateException ex) {
            logger.warn(
                "Unable to process data with invalid data for request. Skipping inclusion of"
                    + " invalid waveform into list",
                ex);
            throw ex;
          }

          ChannelSegment<Timeseries> cs =
              ChannelSegment.from(
                  descriptor, channelSegment.getUnits(), waveformList, List.of(), Map.of());
          segments.add(cs);
        }
      } else {
        logger.debug(
            "measuredChannelSegment was expected but not present in ChannelSegmentCreator; segment"
                + " not added");
      }
    }
    return segments;
  }
}
