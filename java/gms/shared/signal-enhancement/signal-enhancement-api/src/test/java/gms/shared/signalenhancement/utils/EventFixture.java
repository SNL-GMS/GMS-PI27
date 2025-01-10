package gms.shared.signalenhancement.utils;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.CHANNEL_SEGMENT;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.Ellipse;
import gms.shared.event.coi.Ellipsoid;
import gms.shared.event.coi.Event;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationBehavior;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.LocationUncertainty;
import gms.shared.event.coi.MagnitudeModel;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.coi.NetworkMagnitudeBehavior;
import gms.shared.event.coi.NetworkMagnitudeSolution;
import gms.shared.event.coi.PreferredEventHypothesis;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.event.coi.StationMagnitudeSolution;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.NumericFeaturePredictionValue;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public class EventFixture {

  public static final long EVENT_ID = 1111;
  public static final long ORIGIN_ID = 22222;
  public static final long ARRIVAL_ID = 333333;

  public static final double LU_CONFIDENCE = 0.5;
  public static final double LU_OED_MAJOR_AXIS_ERR = 12.0;
  public static final double LU_OED_STRIKE_MAJOR_AXIS = 13.0;
  public static final double LU_OED_MINOR_AXIS_ERR = 14.0;
  public static final double LU_OED_DEPTH_ERR = 15.0;
  public static final double LU_OED_ORIGIN_TIME_ERR = 16.0;
  public static final double LU_OED_STDERR_OBS = 3.14;
  public static final double LU_ELPSE_AXIS_CONV_FACTOR = 17.0;
  public static final double LU_ELPSE_DEPTH_TIME_CONV_FACTOR = 18.0;

  public static final double K_WEIGHT = 0.0;
  public static final double CONFIDENCE_LEVEL = 0.5;
  public static final double MAJOR_AXIS_LENGTH = 0.0;
  public static final double MAJOR_AXIS_TREND = 0.0;
  public static final double MAJOR_AXIS_PLUNGE = 0.0;
  public static final double INTERMEDIATE_AXIS_LENGTH = 0.0;
  public static final double INTERMEDIATE_AXIS_TREND = 0.0;
  public static final double INTERMEDIATE_AXIS_PLUNGE = 0.0;
  public static final double MINOR_AXIS_LENGTH = 0.0;
  public static final double MINOR_AXIS_TREND = 0.0;
  public static final double MINOR_AXIS_PLUNGE = 0.0;
  public static final double DEPTH_UNCERTAINTY = 0.0;
  public static final Duration TIME_UNCERTAINTY = Duration.ofSeconds(5);

  // Create a LocationUncertainty with dummy values.
  public static final double XX = 0.0;
  public static final double XY = 0.0;
  public static final double XZ = 0.0;
  public static final double XT = 0.0;
  public static final double YY = 0.0;
  public static final double YZ = 0.0;
  public static final double YT = 0.0;
  public static final double ZZ = 0.0;
  public static final double ZT = 0.0;
  public static final double TT = 0.0;
  public static final double ST_DEV_ONE_OBSERVATION = 0.0;

  public static final ScalingFactorType SCALING_FACTOR_TYPE = ScalingFactorType.CONFIDENCE;
  public static final Ellipse ELLIPSE =
      Ellipse.builder()
          .setScalingFactorType(SCALING_FACTOR_TYPE)
          .setkWeight(K_WEIGHT)
          .setConfidenceLevel(CONFIDENCE_LEVEL)
          .setSemiMajorAxisLengthKm(MAJOR_AXIS_LENGTH)
          .setSemiMajorAxisTrendDeg(MAJOR_AXIS_TREND)
          .setSemiMinorAxisLengthKm(MINOR_AXIS_LENGTH)
          .setDepthUncertaintyKm(DEPTH_UNCERTAINTY)
          .setTimeUncertainty(TIME_UNCERTAINTY)
          .build();

  public static final NumericMeasurementValue NUMERIC_MEASUREMENT_VALUE =
      NumericMeasurementValue.from(
          Optional.of(Instant.EPOCH), DoubleValue.from(1.0, Optional.of(0.0), Units.UNITLESS));

  public static final ArrivalTimeMeasurementValue ARRIVAL_TIME_MEASUREMENT_VALUE =
      ArrivalTimeMeasurementValue.from(
          InstantValue.from(Instant.EPOCH, Duration.ofMillis(1)), Optional.empty());

  public static final PhaseTypeMeasurementValue PHASE_TYPE_MEASUREMENT_VALUE =
      PhaseTypeMeasurementValue.fromFeaturePrediction(PhaseType.P, Optional.of(0.5));

  public static final EventLocation EVENT_LOCATION =
      EventLocation.from(1.1, 1.0, 2.0, Instant.EPOCH);

  // PHASE TYPE
  public static final FeatureMeasurement<PhaseTypeMeasurementValue> PHASE_TYPE_FEATURE_MEASUREMENT =
      FeatureMeasurement.<PhaseTypeMeasurementValue>builder()
          .setChannel(CHANNEL)
          .setMeasuredChannelSegment(CHANNEL_SEGMENT)
          .setFeatureMeasurementType(FeatureMeasurementTypes.PHASE)
          .setMeasurementValue(PHASE_TYPE_MEASUREMENT_VALUE)
          .build();

  // ARRIVAL_TIME
  public static final FeatureMeasurement<ArrivalTimeMeasurementValue>
      ARRIVAL_TIME_FEATURE_MEASUREMENT =
          FeatureMeasurement.<ArrivalTimeMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(CHANNEL_SEGMENT)
              .setFeatureMeasurementType(FeatureMeasurementTypes.ARRIVAL_TIME)
              .setMeasurementValue(ARRIVAL_TIME_MEASUREMENT_VALUE)
              .build();

  // EMERGENCE_ANGLE
  public static final FeatureMeasurement<NumericMeasurementValue>
      EMERGENCE_ANGLE_FEATURE_MEASUREMENT =
          FeatureMeasurement.<NumericMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(CHANNEL_SEGMENT)
              .setFeatureMeasurementType(FeatureMeasurementTypes.EMERGENCE_ANGLE)
              .setMeasurementValue(NUMERIC_MEASUREMENT_VALUE)
              .build();

  // RECEIVER_TO_SOURCE_AZIMUTH
  public static final FeatureMeasurement<NumericMeasurementValue>
      RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT =
          FeatureMeasurement.<NumericMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(CHANNEL_SEGMENT)
              .setFeatureMeasurementType(FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH)
              .setMeasurementValue(NUMERIC_MEASUREMENT_VALUE)
              .build();

  // SLOWNESS
  public static final FeatureMeasurement<NumericMeasurementValue> SLOWNESS_FEATURE_MEASUREMENT =
      FeatureMeasurement.<NumericMeasurementValue>builder()
          .setChannel(CHANNEL)
          .setMeasuredChannelSegment(CHANNEL_SEGMENT)
          .setFeatureMeasurementType(FeatureMeasurementTypes.SLOWNESS)
          .setMeasurementValue(NUMERIC_MEASUREMENT_VALUE)
          .build();

  public static final FeatureMeasurement<NumericMeasurementValue>
      SLOWNESS_FEATURE_MEASUREMENT_NO_MCS =
          SLOWNESS_FEATURE_MEASUREMENT.toBuilder()
              .setMeasuredChannelSegment(Optional.empty())
              .build();

  // SOURCE_TO_RECEIVER_AZIMUTH
  public static final FeatureMeasurement<NumericMeasurementValue>
      SOURCE_TO_RECEIVER_AZIMUTH_FEATURE_MEASUREMENT =
          FeatureMeasurement.<NumericMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(CHANNEL_SEGMENT)
              .setFeatureMeasurementType(FeatureMeasurementTypes.SOURCE_TO_RECEIVER_AZIMUTH)
              .setMeasurementValue(NUMERIC_MEASUREMENT_VALUE)
              .build();

  // SOURCE_TO_RECEIVER_DISTANCE
  public static final FeatureMeasurement<NumericMeasurementValue>
      SOURCE_TO_RECEIVER_DISTANCE_FEATURE_MEASUREMENT =
          FeatureMeasurement.<NumericMeasurementValue>builder()
              .setChannel(CHANNEL)
              .setMeasuredChannelSegment(CHANNEL_SEGMENT)
              .setFeatureMeasurementType(FeatureMeasurementTypes.SOURCE_TO_RECEIVER_DISTANCE)
              .setMeasurementValue(NUMERIC_MEASUREMENT_VALUE)
              .build();

  public static final FeaturePredictionComponent<DoubleValue> FEATURE_PREDICTION_COMPONENT =
      FeaturePredictionComponent.from(
          DoubleValue.from(1.2, Optional.empty(), Units.SECONDS),
          false,
          FeaturePredictionComponentType.BASEMODEL_PREDICTION);

  public static final FeaturePrediction<NumericFeaturePredictionValue> FEATURE_PREDICTION =
      FeaturePrediction.<NumericFeaturePredictionValue>builder()
          .setPredictionValue(
              NumericFeaturePredictionValue.from(
                  FeatureMeasurementTypes.SLOWNESS,
                  NUMERIC_MEASUREMENT_VALUE,
                  Map.of(),
                  Set.of(FEATURE_PREDICTION_COMPONENT)))
          .setChannel(CHANNEL)
          .setSourceLocation(EVENT_LOCATION)
          .setPhase(PhaseType.P)
          .setPredictionType(FeaturePredictionType.SLOWNESS_PREDICTION_TYPE)
          .noPredictionChannelSegment()
          .setReceiverLocation(CHANNEL.getLocation())
          .setExtrapolated(false)
          .build();

  public static final StationMagnitudeSolution STATION_MAGNITUDE_SOLUTION =
      StationMagnitudeSolution.builder()
          .setModel(MagnitudeModel.UNKNOWN)
          .setModelCorrection(1.2)
          .setType(MagnitudeType.MB)
          .setPhase(PhaseType.P)
          .setStation(UtilsTestFixtures.STATION)
          .setStationCorrection(3.2)
          .setMagnitude(DoubleValue.from(2.3, Optional.empty(), Units.COUNT))
          .setMeasurement(SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT)
          .build();

  public static final NetworkMagnitudeBehavior NETWORK_MAGNITUDE_BEHAVIOR =
      NetworkMagnitudeBehavior.builder()
          .setDefining(true)
          .setResidual(1.2)
          .setWeight(1.2)
          .setStationMagnitudeSolution(STATION_MAGNITUDE_SOLUTION)
          .build();

  public static final NetworkMagnitudeSolution NETWORK_MAGNITUDE_SOLUTION =
      NetworkMagnitudeSolution.builder()
          .setMagnitude(DoubleValue.from(2.3, Optional.empty(), Units.COUNT))
          .setType(MagnitudeType.MB)
          .setMagnitudeBehaviors(List.of(NETWORK_MAGNITUDE_BEHAVIOR))
          .build();

  public static final LocationBehavior LOCATION_BEHAVIOR =
      LocationBehavior.from(1.0, 2.4, false, FEATURE_PREDICTION, SLOWNESS_FEATURE_MEASUREMENT);

  public static final LocationBehavior LOCATION_BEHAVIOR_NO_MCS =
      LocationBehavior.from(
          1.0, 2.4, false, FEATURE_PREDICTION, SLOWNESS_FEATURE_MEASUREMENT_NO_MCS);

  public static final Ellipsoid ELLIPSOID =
      Ellipsoid.builder()
          .setScalingFactorType(SCALING_FACTOR_TYPE)
          .setkWeight(K_WEIGHT)
          .setConfidenceLevel(CONFIDENCE_LEVEL)
          .setSemiMajorAxisLengthKm(MAJOR_AXIS_LENGTH)
          .setSemiMajorAxisTrendDeg(MAJOR_AXIS_TREND)
          .setSemiMajorAxisPlungeDeg(MAJOR_AXIS_PLUNGE)
          .setSemiIntermediateAxisLengthKm(INTERMEDIATE_AXIS_LENGTH)
          .setSemiIntermediateAxisTrendDeg(INTERMEDIATE_AXIS_TREND)
          .setSemiIntermediateAxisPlungeDeg(INTERMEDIATE_AXIS_PLUNGE)
          .setSemiMinorAxisLengthKm(MINOR_AXIS_LENGTH)
          .setSemiMinorAxisTrendDeg(MINOR_AXIS_TREND)
          .setSemiMinorAxisPlungeDeg(MINOR_AXIS_PLUNGE)
          .setTimeUncertainty(TIME_UNCERTAINTY)
          .build();

  public static final LocationUncertainty LOCATION_UNCERTAINTY =
      LocationUncertainty.builder()
          .setXx(EventTestFixtures.XX)
          .setXy(EventTestFixtures.XY)
          .setXz(EventTestFixtures.XZ)
          .setXt(EventTestFixtures.XT)
          .setYy(EventTestFixtures.YY)
          .setYz(EventTestFixtures.YZ)
          .setYt(EventTestFixtures.YT)
          .setZz(EventTestFixtures.ZZ)
          .setZt(EventTestFixtures.ZT)
          .setTt(EventTestFixtures.TT)
          .setStdDevOneObservation(EventTestFixtures.STD_DEV_ONE_OBSERVATION)
          .setEllipses(Set.of(ELLIPSE))
          .setEllipsoids(Set.of(ELLIPSOID))
          .build();

  public static final LocationSolution.Data LOCATION_SOLUTION_DATA =
      LocationSolution.Data.builder()
          .setLocation(EVENT_LOCATION)
          .setLocationBehaviors(List.of(LOCATION_BEHAVIOR))
          .setFeaturePredictions(FeaturePredictionContainer.of(FEATURE_PREDICTION))
          .setLocationUncertainty(LOCATION_UNCERTAINTY)
          .setNetworkMagnitudeSolutions(List.of(NETWORK_MAGNITUDE_SOLUTION))
          .setLocationRestraint(LocationRestraint.free())
          .build();

  public static final LocationRestraint LOCATION_RESTRAINT_FREE_SOLUTION = LocationRestraint.free();

  public static final LocationRestraint LOCATION_RESTRAINT_SURFACE_SOLUTION =
      LocationRestraint.surface();

  public static final FacetingDefinition DEFAULT_EVENT_FACETING_DEFINITION =
      FacetingDefinition.builder().setClassType("Event").setPopulated(true).build();

  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS =
      SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS;

  /**
   * Generates a dummy, non-realistic {@link EventHypothesis} for use in testing
   *
   * @param eventId ID to be assigned to the generated {@link Event}
   * @param locationValuePlaceholder Placeholder double value to be used to arbitrarily populate
   *     required double fields throughout {@link LocationSolution} and its fields
   * @param eventLocationTime Time to be associated with objects requiring a {@link Instant} in
   *     order to be instantiated
   * @param magnitudeType Magnitude type used to type {@link StationMagnitudeSolution}s and {@link
   *     NetworkMagnitudeSolution}s
   * @param dummyDoubleValue an arbitrary {@link DoubleValue} to be used for setting the Magnitude
   *     values throughout the {@link StationMagnitudeSolution} and {@link NetworkMagnitudeBehavior}
   * @return A dummy, non-realistic {@link EventHypothesis} for use in testing
   */
  public static EventHypothesis generateDummyEventHypothesis(
      UUID eventId,
      Double locationValuePlaceholder,
      Instant eventLocationTime,
      MagnitudeType magnitudeType,
      DoubleValue dummyDoubleValue,
      List<EventHypothesis> parentEventHypotheses) {

    StationMagnitudeSolution staMagSolution =
        StationMagnitudeSolution.builder()
            .setModel(MagnitudeModel.UNKNOWN)
            .setModelCorrection(locationValuePlaceholder)
            .setType(magnitudeType)
            .setPhase(PhaseType.UNKNOWN)
            .setStation(UtilsTestFixtures.STATION)
            .setStationCorrection(locationValuePlaceholder)
            .setMagnitude(dummyDoubleValue)
            .setMeasurement(SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT)
            .build();

    NetworkMagnitudeBehavior netMagBehavior =
        NetworkMagnitudeBehavior.builder()
            .setDefining(true)
            .setResidual(locationValuePlaceholder)
            .setWeight(locationValuePlaceholder)
            .setStationMagnitudeSolution(staMagSolution)
            .build();

    NetworkMagnitudeSolution netMagSolution =
        NetworkMagnitudeSolution.builder()
            .setMagnitude(dummyDoubleValue)
            .setType(magnitudeType)
            .setMagnitudeBehaviors(List.of(netMagBehavior))
            .build();

    var locationUncertainty =
        LocationUncertainty.builder()
            .setXx(locationValuePlaceholder)
            .setXy(locationValuePlaceholder)
            .setXz(locationValuePlaceholder)
            .setXt(locationValuePlaceholder)
            .setYy(locationValuePlaceholder)
            .setYz(locationValuePlaceholder)
            .setYt(locationValuePlaceholder)
            .setZz(locationValuePlaceholder)
            .setZt(locationValuePlaceholder)
            .setTt(locationValuePlaceholder)
            .setStdDevOneObservation(locationValuePlaceholder)
            .setEllipses(List.of(ELLIPSE))
            .setEllipsoids(Collections.emptySet())
            .build();

    var locationSolutionData =
        LocationSolution.Data.builder()
            .setLocation(
                EventLocation.from(
                    locationValuePlaceholder,
                    locationValuePlaceholder,
                    locationValuePlaceholder,
                    eventLocationTime))
            .setFeaturePredictions(FeaturePredictionContainer.of(FEATURE_PREDICTION))
            .setLocationBehaviors(List.of(LOCATION_BEHAVIOR))
            .setLocationRestraint(LocationRestraint.free())
            .setLocationUncertainty(locationUncertainty)
            .setNetworkMagnitudeSolutions(List.of(netMagSolution))
            .build();

    var locationSolution =
        LocationSolution.builder().setId(UUID.randomUUID()).setData(locationSolutionData).build();

    var eventHypothesisData =
        EventHypothesis.Data.builder()
            .setParentEventHypotheses(parentEventHypotheses)
            .setRejected(false)
            .setDeleted(false)
            .setLocationSolutions(List.of(locationSolution))
            .setPreferredLocationSolution(locationSolution)
            .addAssociation(
                SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE)
            .build();

    var eventHypothesisId = EventHypothesis.Id.from(eventId, UUID.randomUUID());

    return EventHypothesis.builder().setData(eventHypothesisData).setId(eventHypothesisId).build();
  }

  /**
   * Generates a dummy, non-realistic {@link EventHypothesis} for use in testing
   *
   * @param latitude in degrees so the distance between event and receiver can be calculated
   * @param longitude in degrees so the distance between event and receiver can be calculated
   * @return A dummy, non-realistic {@link EventHypothesis} for use in filter configuration testing
   */
  public static EventHypothesis generateDummyEventHypothesisForFilterTest(
      double latitude, double longitude) {
    StationMagnitudeSolution staMagSolution =
        StationMagnitudeSolution.builder()
            .setModel(MagnitudeModel.UNKNOWN)
            .setModelCorrection(3.0)
            .setType(MagnitudeType.MB)
            .setPhase(PhaseType.UNKNOWN)
            .setStation(UtilsTestFixtures.STATION)
            .setStationCorrection(3.0)
            .setMagnitude(DoubleValue.from(2.3, Optional.empty(), Units.COUNT))
            .setMeasurement(SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT_NO_MCS)
            .build();

    NetworkMagnitudeBehavior netMagBehavior =
        NetworkMagnitudeBehavior.builder()
            .setDefining(true)
            .setResidual(3.0)
            .setWeight(3.0)
            .setStationMagnitudeSolution(staMagSolution)
            .build();

    NetworkMagnitudeSolution netMagSolution =
        NetworkMagnitudeSolution.builder()
            .setMagnitude(DoubleValue.from(2.3, Optional.empty(), Units.COUNT))
            .setType(MagnitudeType.MB)
            .setMagnitudeBehaviors(List.of(netMagBehavior))
            .build();

    var locationUncertainty =
        LocationUncertainty.builder()
            .setXx(3.0)
            .setXy(3.0)
            .setXz(3.0)
            .setXt(3.0)
            .setYy(3.0)
            .setYz(3.0)
            .setYt(3.0)
            .setZz(3.0)
            .setZt(3.0)
            .setTt(3.0)
            .setStdDevOneObservation(3.0)
            .setEllipses(List.of(ELLIPSE))
            .setEllipsoids(Collections.emptySet())
            .build();

    var locationSolutionData =
        LocationSolution.Data.builder()
            .setLocation(EventLocation.from(latitude, longitude, 3.0, Instant.EPOCH))
            .setFeaturePredictions(FeaturePredictionContainer.of(FEATURE_PREDICTION))
            .setLocationBehaviors(List.of(LOCATION_BEHAVIOR_NO_MCS))
            .setLocationRestraint(LocationRestraint.free())
            .setLocationUncertainty(locationUncertainty)
            .setNetworkMagnitudeSolutions(List.of(netMagSolution))
            .build();

    var locationSolution =
        LocationSolution.builder().setId(UUID.randomUUID()).setData(locationSolutionData).build();

    var eventHypothesisData =
        EventHypothesis.Data.builder()
            .setParentEventHypotheses(List.of())
            .setRejected(false)
            .setDeleted(false)
            .setLocationSolutions(List.of(locationSolution))
            .setPreferredLocationSolution(locationSolution)
            .addAssociation(
                SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE)
            .build();

    var eventHypothesisId = EventHypothesis.Id.from(UUID.randomUUID(), UUID.randomUUID());

    return EventHypothesis.builder().setData(eventHypothesisData).setId(eventHypothesisId).build();
  }

  public static EventHypothesis generateDummyRejectedEvenHypothesis(
      UUID eventId, UUID rejectedEhUUId, UUID rejectedParentEh) {
    var rejectedEhData =
        EventHypothesis.Data.builder()
            .setParentEventHypotheses(
                List.of(
                    EventHypothesis.builder()
                        .setId(EventHypothesis.Id.from(eventId, rejectedParentEh))
                        .build()))
            .setRejected(true)
            .setDeleted(false);

    return EventHypothesis.builder()
        .setId(EventHypothesis.Id.from(eventId, rejectedEhUUId))
        .setData(rejectedEhData.build())
        .build();
  }

  /**
   * Generates a dummy, non-realistic {@link Event} for use in testing
   *
   * @param eventId ID to be assigned to the generated {@link Event}
   * @param workflowDefinitionId The {@link WorkflowDefinitionId} used to populate relevant fields
   *     within the {@link Event}
   * @param monitoringOrg Monitoring organization the {@link Event} will be associated with
   * @param eventHypothesisPreferredByAnalyst Analyst name to be assigned to the {@link
   *     PreferredEventHypothesis} for this {@link Event}
   * @param eventLocationTime Time to be associated with objects requiring a {@link Instant} in
   *     order to be instantiated
   * @param locationValuePlaceholder Placeholder double value to be used to arbitrarily populate
   *     required double fields throughout {@link LocationSolution} and its fields
   * @param magnitudeType Magnitude type used to type {@link StationMagnitudeSolution}s and {@link
   *     NetworkMagnitudeSolution}s
   * @return A dummy, non-realistic {@link Event} for use in testing
   */
  public static Event generateDummyEvent(
      UUID eventId,
      WorkflowDefinitionId workflowDefinitionId,
      String monitoringOrg,
      String eventHypothesisPreferredByAnalyst,
      Instant eventLocationTime,
      double locationValuePlaceholder,
      MagnitudeType magnitudeType) {
    var dummyDoubleValue =
        DoubleValue.from(locationValuePlaceholder, Optional.empty(), Units.COUNT);

    var eventHypothesis =
        generateDummyEventHypothesis(
            eventId,
            locationValuePlaceholder,
            eventLocationTime,
            magnitudeType,
            dummyDoubleValue,
            List.of());

    var preferredEventHypothesis =
        PreferredEventHypothesis.from(
            workflowDefinitionId, eventHypothesisPreferredByAnalyst, eventHypothesis);

    var eventData =
        Event.Data.builder()
            .setMonitoringOrganization(monitoringOrg)
            .setEventHypotheses(List.of(eventHypothesis))
            .addPreferredEventHypothesis(preferredEventHypothesis)
            .setOverallPreferred(eventHypothesis)
            .setRejectedSignalDetectionAssociations(Collections.emptyList())
            .setFinalEventHypothesisHistory(List.of(eventHypothesis))
            .build();

    return Event.builder().setId(eventId).setData(eventData).build();
  }
}
