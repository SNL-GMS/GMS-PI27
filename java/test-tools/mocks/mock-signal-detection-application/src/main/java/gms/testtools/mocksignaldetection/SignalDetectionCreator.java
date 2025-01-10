package gms.testtools.mocksignaldetection;

import com.fasterxml.jackson.databind.ObjectReader;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetection.Data;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.waveform.coi.ChannelSegment;
import java.io.IOException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SignalDetectionCreator {

  private static final Logger logger = LoggerFactory.getLogger(SignalDetectionCreator.class);

  private final ObjectReader jsonReader = ObjectMappers.jsonReader();

  private SignalDetection signalDetection;

  private List<Station> stations;

  private final SecureRandom random;
  private final List<PhaseType> phases;
  private double lastAzimuth = 0;

  private SignalDetectionCreator() {
    this.random = new SecureRandom();
    this.phases = List.of(PhaseType.P, PhaseType.S, PhaseType.Lg, PhaseType.LR, PhaseType.Rg);
    parseSignalDetections();
    parseStationDefinitions();
  }

  public static SignalDetectionCreator create() {
    return new SignalDetectionCreator();
  }

  /** Parse a sample {@link SignalDetection} JSON file to seed mock data. */
  private void parseSignalDetections() {
    try {
      var sd = SignalDetectionCreator.class.getClassLoader().getResource("signal-detection.json");
      signalDetection = jsonReader.readValue(sd, SignalDetection.class);
    } catch (IOException e) {
      logger.error("Error reading signal detection json file.", e);
    }
  }

  /**
   * Parse a list of {@link Station} JSON file to be used in creating Signal Detections on raw
   * channels.
   */
  private void parseStationDefinitions() {
    try {
      var stationJson =
          SignalDetectionCreator.class.getClassLoader().getResource("station-definitions.json");
      Station[] stationList = jsonReader.readValue(stationJson, Station[].class);
      this.stations = Arrays.asList(stationList);
    } catch (IOException e) {
      logger.error("Error reading station definition json file.", e);
    }
  }

  /**
   * Iterator over a set of {@link Station} names and, from the parsed sample JSON file, modify
   * these fields:
   *
   * <pre>
   *   Station -> stationName
   *
   *   FeatureMeasurements[] ->
   *    *** Create Channel ID and use it for every measuredChannelSegment ***
   *    Channel -> channelName (change existing to station name in the iteration)
   *    Channel -> effectiveAt (change to Station.effectiveAt)
   *
   *   MeasuredChannelSegment ->
   *    id ->
   *      channel -> Same as FeatureMeasurements -> Channel ID
   *      startTime -> First iteration, startTime = startTime passed in,
   *                   otherwise startTime = startTime + timeLoopIncrement
   *      endTime -> startTime + 5 minutes
   *      creationTime -> creationTime = startTime
   * </pre>
   *
   * @param stations the set of station names
   * @return a collection of signal detections
   */
  public List<SignalDetection> createDerivedChannelDetections(
      Instant startTime, Instant endTime, List<Station> stations) {

    Objects.requireNonNull(startTime, "startTime may not be null");
    Objects.requireNonNull(endTime, "endTime may not be null");
    Objects.requireNonNull(stations, "stations may not be null");

    // Used to increment time during the loop.
    var timeLoopIncrement = Duration.ofMinutes(10);
    var detections = new ArrayList<SignalDetection>();

    for (var s : stations) {
      // first SD will be at start time
      var mockStartTime = startTime.minus(timeLoopIncrement);
      // Don't create one at the end
      while (mockStartTime.isBefore(endTime.minus(10, ChronoUnit.MINUTES))) {
        mockStartTime = mockStartTime.plus(timeLoopIncrement);

        var detection = this.modifyDetection(mockStartTime, s.getName(), s.getName(), true);
        if (detection != null) {
          detections.add(detection);
        }
      }
    }
    return detections;
  }

  /**
   * Iterator over a set of {@link Station} lookup the station from station definitions and for each
   * raw channel create signal detections using the parsed sample JSON file, modify these fields:
   *
   * <pre>
   *   Station -> stationName
   *
   *   FeatureMeasurements[] ->
   *    *** Create Channel ID and use it for every measuredChannelSegment ***
   *    Channel -> channelName (change existing to station name in the iteration)
   *    Channel -> effectiveAt (change to Station.effectiveAt)
   *
   *   MeasuredChannelSegment ->
   *    id ->
   *      channel -> Same as FeatureMeasurements -> Channel ID
   *      startTime -> First iteration, startTime = startTime passed in,
   *                   otherwise startTime = startTime + timeLoopIncrement
   *      endTime -> startTime + 5 minutes
   *      creationTime -> creationTime = startTime
   * </pre>
   *
   * @param stations the set of station names
   * @return a collection of signal detections
   */
  public List<SignalDetection> createRawChannelDetections(
      Instant startTime, Instant endTime, List<Station> stations) {

    Objects.requireNonNull(startTime, "startTime may not be null");
    Objects.requireNonNull(endTime, "endTime may not be null");
    Objects.requireNonNull(stations, "stations may not be null");

    // place first 1/3 way on the interval
    var delta = (endTime.getEpochSecond() - startTime.getEpochSecond()) / 3;
    startTime = startTime.plus(delta, ChronoUnit.SECONDS);
    endTime = endTime.minus(60, ChronoUnit.SECONDS);
    var detections = new ArrayList<SignalDetection>();

    // For each station create 2 signal detections one for the first 2 raw channels
    for (var s : stations) {
      // Find the station definition for the station
      Optional<Station> optionalStation = Optional.empty();
      if (this.stations != null) {
        optionalStation =
            this.stations.stream().filter(entry -> entry.getName().equals(s.getName())).findFirst();
      }
      if (optionalStation.isEmpty()) {
        continue;
      }
      var stationSignalDetection =
          this.createStationRawChannelsSignalDetection(startTime, endTime, optionalStation.get());
      if (!stationSignalDetection.isEmpty()) {
        detections.addAll(stationSignalDetection);
      }
    }
    return detections;
  }

  /**
   * Create a list of Signal Detections (5) for the raw channels
   *
   * @param startTime of request
   * @param endTime of request
   * @param station definition contains the raw channel list
   * @return list of raw channel signal detections for the station
   */
  private List<SignalDetection> createStationRawChannelsSignalDetection(
      Instant startTime, Instant endTime, Station station) {
    var detections = new ArrayList<SignalDetection>();
    var rawChannels = station.getAllRawChannels();
    // Used to increment time during the loop increments.
    var numChannelsToPopulate = Math.min(rawChannels.size(), 2);

    // The time increment will be based on number of channels or 5 (whichever is less) with one per
    // raw channel
    var timeLoopIncrement = Duration.between(startTime, endTime).dividedBy(numChannelsToPopulate);
    var mockStartTime = startTime;
    for (var rawChannel : rawChannels) {
      var detection =
          this.modifyDetection(mockStartTime, station.getName(), rawChannel.getName(), false);
      if (detection != null) {
        detections.add(detection);
      }
      mockStartTime = mockStartTime.plus(timeLoopIncrement);
      if (detections.size() >= numChannelsToPopulate) {
        return detections;
      }
    }
    return detections;
  }

  /**
   * Builds a modified Signal Detection
   *
   * @param startTime for the Arrival Time
   * @param channelName name of station or raw channel
   * @param isDerivedChannel boolean
   * @return returns signal detection created
   */
  private SignalDetection modifyDetection(
      Instant startTime, String stationName, String channelName, boolean isDerivedChannel) {
    var sdId = UUID.randomUUID();
    var hypotheses = new ArrayList<SignalDetectionHypothesis>();
    for (SignalDetectionHypothesis h : signalDetection.getSignalDetectionHypotheses()) {
      var id = SignalDetectionHypothesisId.from(sdId, UUID.randomUUID());
      var channelId = updateChannelId(channelName, h, isDerivedChannel);
      var hypothesis =
          SignalDetectionHypothesis.from(
              id,
              Optional.ofNullable(
                  SignalDetectionHypothesis.Data.builder()
                      .setDeleted(h.isDeleted())
                      .setMonitoringOrganization(h.getMonitoringOrganization())
                      .setParentSignalDetectionHypothesis(h.getParentSignalDetectionHypothesis())
                      .setStation(
                          Station.builder()
                              .setName(stationName)
                              .setEffectiveAt(h.getStation().getEffectiveAt())
                              .setData(h.getStation().getData())
                              .build())
                      .setFeatureMeasurements(
                          updateMeasuredChannelSegmentId(channelId, startTime, h))
                      .build()));

      hypotheses.add(hypothesis);
    }

    return SignalDetection.from(
        sdId,
        Optional.ofNullable(
            Data.builder()
                .setMonitoringOrganization(signalDetection.getMonitoringOrganization())
                .setStation(
                    Station.builder()
                        .setName(stationName)
                        .setEffectiveAt(signalDetection.getStation().getEffectiveAt())
                        .setData(signalDetection.getStation().getData())
                        .build())
                .setSignalDetectionHypotheses(hypotheses)
                .build()));
  }

  /**
   * Update the channel ID with current station name.
   *
   * @param channelName the station name
   * @param signalDetectionHypothesis the hypothesis
   * @param isDerivedChannel which type of channel name to create
   * @return the updated channel ID
   */
  private Channel updateChannelId(
      String channelName,
      SignalDetectionHypothesis signalDetectionHypothesis,
      boolean isDerivedChannel) {
    Optional<FeatureMeasurement<?>> fm =
        signalDetectionHypothesis.getFeatureMeasurements().stream().findFirst();

    // If there is a feature measurement then fix name. For raw channels that is the channel name.
    // For stations (fk beams) the channel name is the derived channel
    if (fm.isPresent()) {
      var name = isDerivedChannel ? fm.get().getChannel().getName() : channelName;
      if (isDerivedChannel) {
        name = name.replace(name.substring(0, name.indexOf('.')), channelName);
      }
      return Channel.builder()
          .setName(name)
          .setEffectiveAt(signalDetection.getStation().getEffectiveAt())
          .build();
    }
    return null;
  }

  /**
   * Update the {@link FeatureMeasurement} with new data.
   *
   * @param channelId the updated channel ID
   * @param startTime the updated start time
   * @param signalDetectionHypothesis the hypothesis
   * @return the updated feature measurement
   */
  private Set<FeatureMeasurement<?>> updateMeasuredChannelSegmentId(
      Channel channelId, Instant startTime, SignalDetectionHypothesis signalDetectionHypothesis) {

    var measurements = new HashSet<FeatureMeasurement<?>>();
    var descriptor =
        ChannelSegmentDescriptor.from(
            channelId, startTime, startTime.plus(5, ChronoUnit.MINUTES), startTime);
    for (FeatureMeasurement<?> fm : signalDetectionHypothesis.getFeatureMeasurements()) {
      if (fm.getMeasuredChannelSegment().isPresent()) {
        var newChannelSegment =
            fm.getMeasuredChannelSegment().get().toBuilder().setId(descriptor).build();
        addFeatureMeasurement(fm, descriptor, measurements, channelId, newChannelSegment);
      } else {
        addFeatureMeasurement(fm, descriptor, measurements, channelId, null);
      }
    }
    return measurements;
  }

  private void addFeatureMeasurement(
      FeatureMeasurement<?> fm,
      ChannelSegmentDescriptor descriptor,
      HashSet<FeatureMeasurement<?>> measurements,
      Channel channelId,
      ChannelSegment<?> newChannelSegment) {

    if (fm.getFeatureMeasurementType()
        .getFeatureMeasurementTypeName()
        .equals(FeatureMeasurementTypes.ARRIVAL_TIME.getFeatureMeasurementTypeName())) {
      var fmv = (ArrivalTimeMeasurementValue) fm.getMeasurementValue();
      var stdDev = fmv.getArrivalTime().getStandardDeviation();

      stdDev.ifPresent(
          duration ->
              measurements.add(
                  FeatureMeasurement.<ArrivalTimeMeasurementValue>builder()
                      .setChannel(channelId)
                      .setMeasuredChannelSegment(newChannelSegment)
                      .setFeatureMeasurementType(
                          getFeatureMeasurementTypeHelper(fm.getFeatureMeasurementType()))
                      .setMeasurementValue(
                          ArrivalTimeMeasurementValue.from(
                              InstantValue.from(descriptor.getStartTime(), duration),
                              fmv.getTravelTime()))
                      .setSnr(fm.getSnr())
                      .build()));
    } else if (fm.getFeatureMeasurementType()
        .getFeatureMeasurementTypeName()
        .equals(FeatureMeasurementTypes.PHASE.getFeatureMeasurementTypeName())) {
      var fmv = (PhaseTypeMeasurementValue) fm.getMeasurementValue();
      measurements.add(
          FeatureMeasurement.<PhaseTypeMeasurementValue>builder()
              .setChannel(channelId)
              .setMeasuredChannelSegment(newChannelSegment)
              .setFeatureMeasurementType(
                  getFeatureMeasurementTypeHelper(fm.getFeatureMeasurementType()))
              .setMeasurementValue(
                  PhaseTypeMeasurementValue.from(
                      this.getRandomPhase(), fmv.getConfidence(), fmv.getReferenceTime()))
              .setSnr(fm.getSnr())
              .build());
    } else if (fm.getFeatureMeasurementType()
            .getFeatureMeasurementTypeName()
            .equals(
                FeatureMeasurementTypes.SOURCE_TO_RECEIVER_AZIMUTH.getFeatureMeasurementTypeName())
        || fm.getFeatureMeasurementType()
            .getFeatureMeasurementTypeName()
            .equals(
                FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH
                    .getFeatureMeasurementTypeName())) {

      var fmv = (NumericMeasurementValue) fm.getMeasurementValue();

      // Keep rotating azimuth so that each SD shows up uniquely on the map
      this.lastAzimuth = (this.lastAzimuth + 30) % 360;
      var measuredValue = fmv.getMeasuredValue();
      var azimuth =
          DoubleValue.from(
              this.lastAzimuth, measuredValue.getStandardDeviation(), measuredValue.getUnits());
      measurements.add(
          FeatureMeasurement.<NumericMeasurementValue>builder()
              .setChannel(channelId)
              .setMeasuredChannelSegment(newChannelSegment)
              .setFeatureMeasurementType(
                  getFeatureMeasurementTypeHelper(fm.getFeatureMeasurementType()))
              .setMeasurementValue(NumericMeasurementValue.from(fmv.getReferenceTime(), azimuth))
              .setSnr(fm.getSnr())
              .build());
    } else {
      measurements.add(
          FeatureMeasurement.builder()
              .setChannel(channelId)
              .setMeasuredChannelSegment(newChannelSegment)
              .setFeatureMeasurementType(
                  getFeatureMeasurementTypeHelper(fm.getFeatureMeasurementType()))
              .setMeasurementValue(fm.getMeasurementValue())
              .setSnr(fm.getSnr())
              .build());
    }
  }

  /**
   * Helper method created so that the wildcard can be captured through type inference.
   *
   * @param measurementType the {@link FeatureMeasurementType}
   * @param <V> the generic type
   * @return the captured wildcard type
   */
  private <V> FeatureMeasurementType<V> getFeatureMeasurementTypeHelper(
      FeatureMeasurementType<?> measurementType) {
    return (FeatureMeasurementType<V>) measurementType;
  }

  /**
   * Helper function to randomly return a phase from the phases list
   *
   * @return PhaseType
   */
  private PhaseType getRandomPhase() {
    return this.phases.get(this.random.nextInt(this.phases.size()));
  }
}
