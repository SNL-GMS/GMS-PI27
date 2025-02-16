package gms.shared.event.coi;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.CHANNEL_SEGMENT;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponent;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.event.coi.featureprediction.value.NumericFeaturePredictionValue;
import gms.shared.event.coi.type.DepthMethod;
import gms.shared.event.dao.ArInfoDao;
import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.EventDao;
import gms.shared.event.dao.EventIdOriginIdKey;
import gms.shared.event.dao.GaTagDao;
import gms.shared.event.dao.LatLonDepthTimeKey;
import gms.shared.event.dao.MagnitudeIdAmplitudeIdStationNameKey;
import gms.shared.event.dao.NetMagDao;
import gms.shared.event.dao.OrigerrDao;
import gms.shared.event.dao.OriginDao;
import gms.shared.event.dao.OriginIdArrivalIdKey;
import gms.shared.event.dao.StaMagDao;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.dao.css.AridOridKey;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.signaldetection.dao.css.enums.DefiningFlag;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public final class EventTestFixtures {

  public static final UUID EVENT_UUID = UUID.fromString("12347cc2-8c86-4fa1-a764-c9b9944614b7");
  public static final UUID HYPOTHESIS_UUID =
      UUID.fromString("12478cc2-8c86-4fa1-a964-c9b9944614b7");
  public static final UUID LOCATION_UUID = UUID.fromString("32478cc2-8c86-4ca1-a964-c9b9914614b7");
  public static final long EVENT_ID = 1111;
  public static final long ORIGIN_ID = 22222;
  public static final long ARRIVAL_ID = 333_333;

  public static final long MB_ID = 1111;
  public static final long MS_ID = 2222;
  public static final long ML_ID = 3333;
  public static final long NULL_MAGNITUDE_ID = -1;
  public static final long NULL_MAGNITUDE = -999;

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
  public static final double STD_DEV_ONE_OBSERVATION = 0.0;

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

  public static final Station STA_STATION = UtilsTestFixtures.STATION;

  // event hypothesis channel segments pair
  public static Map<EventHypothesis, List<ChannelSegment<Waveform>>>
      getTestEventHypothesisChannelSegmentsMap() {
    var channelSegment = ChannelSegmentTestFixtures.createTestChannelSegmentWaveform();

    return Map.of(getTestEventHypothesis(), List.of(channelSegment));
  }

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

  // SLOWNESS without measured channel segment
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

  // Station magnitude solution with amplitude feature measurement that has no measured channel
  // segment
  public static final StationMagnitudeSolution STATION_MAGNITUDE_SOLUTION_NO_MCS =
      STATION_MAGNITUDE_SOLUTION.toBuilder()
          .setMeasurement(SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT_NO_MCS)
          .build();

  public static final NetworkMagnitudeBehavior NETWORK_MAGNITUDE_BEHAVIOR =
      NetworkMagnitudeBehavior.builder()
          .setDefining(true)
          .setResidual(1.2)
          .setWeight(1.2)
          .setStationMagnitudeSolution(STATION_MAGNITUDE_SOLUTION)
          .build();

  // Network magnitude behavior with station magnitude solution that has no measured channel segment
  public static final NetworkMagnitudeBehavior NETWORK_MAGNITUDE_BEHAVIOR_NO_MCS =
      NETWORK_MAGNITUDE_BEHAVIOR.toBuilder()
          .setStationMagnitudeSolution(STATION_MAGNITUDE_SOLUTION_NO_MCS)
          .build();

  public static final NetworkMagnitudeSolution NETWORK_MAGNITUDE_SOLUTION =
      NetworkMagnitudeSolution.builder()
          .setMagnitude(DoubleValue.from(2.3, Optional.empty(), Units.COUNT))
          .setType(MagnitudeType.MB)
          .setMagnitudeBehaviors(List.of(NETWORK_MAGNITUDE_BEHAVIOR))
          .build();

  // Network magnitude solution with network magnitude behavior that has no measured channel segment
  public static final NetworkMagnitudeSolution NETWORK_MAGNITUDE_SOLUTION_NO_MCS =
      NETWORK_MAGNITUDE_SOLUTION.toBuilder()
          .setMagnitudeBehaviors(List.of(NETWORK_MAGNITUDE_BEHAVIOR_NO_MCS))
          .build();

  public static final LocationBehavior LOCATION_BEHAVIOR =
      LocationBehavior.from(1.0, 2.4, false, FEATURE_PREDICTION, SLOWNESS_FEATURE_MEASUREMENT);

  // Location behavior with no measured channel segment in feature measurement
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

  // Location solution with location behavior that has no measured channel segment
  public static final LocationSolution.Data LOCATION_SOLUTION_DATA_NO_MCS =
      LOCATION_SOLUTION_DATA.toBuilder()
          .setLocationBehaviors(List.of(LOCATION_BEHAVIOR_NO_MCS))
          .setNetworkMagnitudeSolutions(List.of(NETWORK_MAGNITUDE_SOLUTION_NO_MCS))
          .build();

  public static final LocationRestraint LOCATION_RESTRAINT_FREE_SOLUTION = LocationRestraint.free();

  public static final LocationRestraint LOCATION_RESTRAINT_SURFACE_SOLUTION =
      LocationRestraint.surface();

  public static final OriginDao DEFAULT_ORIGIN_DAO =
      new OriginDao.Builder()
          .withLatLonDepthTimeKey(
              new LatLonDepthTimeKey.Builder()
                  .withLatitude(1)
                  .withLongitude(5)
                  .withDepth(314.159)
                  .withTime(1629600001.0000)
                  .build())
          .withOriginId(ORIGIN_ID)
          .withEventId(EVENT_ID)
          .withJulianDate(1)
          .withNumAssociatedArrivals(1)
          .withNumTimeDefiningPhases(1)
          .withNumDepthPhases(1)
          .withGeographicRegionNumber(1)
          .withSeismicRegionNumber(1)
          .withEventType("etype")
          .withEstimatedDepth(4)
          .withDepthMethod(DepthMethod.A)
          .withBodyWaveMag(23)
          .withBodyWaveMagId(3423)
          .withSurfaceWaveMag(23)
          .withSurfaceWaveMagId(23434)
          .withLocalMag(32)
          .withLocalMagId(23434)
          .withLocationAlgorithm("algorithm")
          .withAuthor("auth")
          .withCommentId(234234242)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  public static final OriginDao ORIGIN_DAO_ALL_TYPES =
      new OriginDao.Builder()
          .withLatLonDepthTimeKey(
              new LatLonDepthTimeKey.Builder()
                  .withLatitude(1)
                  .withLongitude(5)
                  .withDepth(314.159)
                  .withTime(1629600001.0000)
                  .build())
          .withOriginId(ORIGIN_ID)
          .withEventId(EVENT_ID)
          .withJulianDate(1)
          .withNumAssociatedArrivals(1)
          .withNumTimeDefiningPhases(1)
          .withNumDepthPhases(1)
          .withGeographicRegionNumber(1)
          .withSeismicRegionNumber(1)
          .withEventType("etype")
          .withEstimatedDepth(4)
          .withDepthMethod(DepthMethod.A)
          .withBodyWaveMag(11)
          .withBodyWaveMagId(MB_ID)
          .withSurfaceWaveMag(22)
          .withSurfaceWaveMagId(MS_ID)
          .withLocalMag(33)
          .withLocalMagId(ML_ID)
          .withLocationAlgorithm("algorithm")
          .withAuthor("auth")
          .withCommentId(234234242)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  public static final OriginDao ORIGIN_DAO_NULL_MB =
      new OriginDao.Builder()
          .withLatLonDepthTimeKey(
              new LatLonDepthTimeKey.Builder()
                  .withLatitude(1)
                  .withLongitude(5)
                  .withDepth(314.159)
                  .withTime(1629600001.0000)
                  .build())
          .withOriginId(ORIGIN_ID)
          .withEventId(EVENT_ID)
          .withJulianDate(1)
          .withNumAssociatedArrivals(1)
          .withNumTimeDefiningPhases(1)
          .withNumDepthPhases(1)
          .withGeographicRegionNumber(1)
          .withSeismicRegionNumber(1)
          .withEventType("etype")
          .withEstimatedDepth(4)
          .withDepthMethod(DepthMethod.A)
          .withBodyWaveMag(NULL_MAGNITUDE)
          .withBodyWaveMagId(MS_ID)
          .withSurfaceWaveMag(22)
          .withSurfaceWaveMagId(MS_ID)
          .withLocalMag(33)
          .withLocalMagId(ML_ID)
          .withLocationAlgorithm("algorithm")
          .withAuthor("auth")
          .withCommentId(234234242)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  public static final OriginDao ORIGIN_DAO_NULL_MB_ID =
      new OriginDao.Builder()
          .withLatLonDepthTimeKey(
              new LatLonDepthTimeKey.Builder()
                  .withLatitude(1)
                  .withLongitude(5)
                  .withDepth(314.159)
                  .withTime(1629600001.0000)
                  .build())
          .withOriginId(ORIGIN_ID)
          .withEventId(EVENT_ID)
          .withJulianDate(1)
          .withNumAssociatedArrivals(1)
          .withNumTimeDefiningPhases(1)
          .withNumDepthPhases(1)
          .withGeographicRegionNumber(1)
          .withSeismicRegionNumber(1)
          .withEventType("etype")
          .withEstimatedDepth(4)
          .withDepthMethod(DepthMethod.A)
          .withBodyWaveMag(11)
          .withBodyWaveMagId(NULL_MAGNITUDE_ID)
          .withSurfaceWaveMag(22)
          .withSurfaceWaveMagId(2222)
          .withLocalMag(33)
          .withLocalMagId(3333)
          .withLocationAlgorithm("algorithm")
          .withAuthor("auth")
          .withCommentId(234234242)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  public static final OrigerrDao DEFAULT_ORIGERR_DAO =
      new OrigerrDao.Builder()
          .withOriginId(ORIGIN_ID)
          .withCovarianceMatrixSxx(10.108709)
          .withCovarianceMatrixSyy(6.428858)
          .withCovarianceMatrixSzz(1.695562)
          .withCovarianceMatrixStt(0.02051971)
          .withCovarianceMatrixSxy(1.2243478)
          .withCovarianceMatrixSxz(0.19202526)
          .withCovarianceMatrixSyz(0.20920013)
          .withCovarianceMatrixStx(0.10167803)
          .withCovarianceMatrixSty(0.10848454)
          .withCovarianceMatrixStz(-0.10146588)
          .withStandardErrorOfObservations(1.3827603)
          .withSemiMajorAxisOfError(6.9415627)
          .withSemiMinorAxisOfError(5.2782662)
          .withStrikeOfSemiMajorAxis(73.17944)
          .withDepthError(2.1432024)
          .withOriginTimeError(0.23577186)
          .withConfidence(0.9)
          .withCommentId(-1)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  public static final NetMagDao DEFAULT_NET_MAG_DAO =
      new NetMagDao.Builder()
          .withMagnitudeId(1)
          .withNetwork("AA")
          .withOriginId(ORIGIN_ID)
          .withEventId(EVENT_ID)
          .withMagnitudeType("mb")
          .withNumberOfStations(10)
          .withMagnitude(2.3)
          .withMagnitudeUncertainty(1.0)
          .withAuthor("AUTH")
          .withCommentId(1234)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  // F	0	0	0	3		0	3	0	1	1			0	3	1	1	20	100		1.15	1.15
  public static final EventControlDao DEFAULT_EVENT_CONTROL_DAO =
      new EventControlDao.Builder()
          .withEventIdOriginIdKey(
              new EventIdOriginIdKey.Builder()
                  .withOriginId(ORIGIN_ID)
                  .withEventId(EVENT_ID)
                  .build())
          .withPreferredLocation("F")
          .withConstrainOriginTime(true)
          .withConstrainLatLon(true)
          .withConstrainDepth(true)
          .withSourceDependentCorrectionCode(23)
          .withSourceDependentLocationCorrectionRegion("GGGHHHFFFGGG")
          .withIgnoreLargeResidualsInLocation(true)
          .withLocationLargeResidualMultiplier(10)
          .withUseStationSubsetInLocation(true)
          .withUseAllStationsInLocation(true)
          .withUseDistanceVarianceWeighting(true)
          .withUserDefinedDistanceVarianceWeighting(10)
          .withSourceDependentMagnitudeCorrectionRegion("FFFDDDFFFFF")
          .withIgnoreLargeResidualsInMagnitude(true)
          .withMagnitudeLargeResidualMultiplier(10)
          .withUseStationSubsetInMagnitude(true)
          .withUseAllStationsInMagnitude(true)
          .withMbMinimumDistance(10)
          .withMbMaximumDistance(10)
          .withMagnitudeModel("FDFDFDFDFDFDF")
          .withEllipseSemiaxisConversionFactor(10)
          .withEllipseDepthTimeConversionFactor(10)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  public static final AssocDao DEFAULT_ASSOC_DAO =
      new AssocDao.Builder()
          .withId(
              new AridOridKey.Builder().withOriginId(ORIGIN_ID).withArrivalId(ARRIVAL_ID).build())
          .withStationCode("AA")
          .withPhase("P")
          .withBelief(1.0)
          .withDelta(1.0)
          .withStationToEventAzimuth(1.0)
          .withEventToStationAzimuth(1.0)
          .withTimeResidual(1.0)
          .withTimeDefining(DefiningFlag.DEFAULT_DEFINING)
          .withAzimuthResidual(1.0)
          .withAzimuthDefining(DefiningFlag.DEFAULT_DEFINING)
          .withSlownessResidual(1.0)
          .withSlownessDefining(DefiningFlag.DEFAULT_DEFINING)
          .withEmergenceAngleResidual(1.0)
          .withLocationWeight(1.0)
          .withVelocityModel("model")
          .withCommentId(5)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  public static final ArInfoDao DEFAULT_AR_INFO_DAO =
      new ArInfoDao.Builder()
          .withOriginIdArrivalIdKey(
              new OriginIdArrivalIdKey.Builder()
                  .withOriginId(ORIGIN_ID)
                  .withArrivalId(ARRIVAL_ID)
                  .build())
          .withTimeErrorCode(0)
          .withAzimuthErrorCode(0)
          .withSlownessErrorCode(0)
          .withCorrectionCode(0)
          .withVelocityModel("AK135")
          .withTotalTravelTime(1797.3668)
          .withBaseModelTravelTime(1793.644)
          .withTravelTimeEllipticityCorrection(-0.23172)
          .withTravelTimeElevationCorrection(0.33987)
          .withTravelTimeStaticCorrection(3.6147)
          .withTravelTimeSourceSpecificCorrection(0)
          .withTravelTimeModelError(3)
          .withTravelTimeMeasurementError(0.58002)
          .withTravelTimeModelPlusMeasurementError(3.05556)
          .withAzimuthSourceSpecificCorrection(0)
          .withAzimuthModelError(20)
          .withAzimuthMeasurementError(13.2431)
          .withAzimuthModelPlusMeasurementError(23.98706)
          .withSlownessSourceSpecificCorrection(0)
          .withSlownessModelError(0.15)
          .withSlownessMeasurementError(0.61525)
          .withSlownessModelPlusMeasurementError(0.63327)
          .withTravelTimeImport(0)
          .withAzimuthImport(0)
          .withSlownessImport(0)
          .withSlownessVectorResidual(4.6067)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  public static final StaMagDao DEFAULT_STA_MAG_DAO =
      new StaMagDao.Builder()
          .withMagnitudeIdAmplitudeIdStationNameKey(
              new MagnitudeIdAmplitudeIdStationNameKey.Builder()
                  .withMagnitudeId(1)
                  .withAmplitudeId(2)
                  .withStationName("AA")
                  .build())
          .withArrivalId(ARRIVAL_ID)
          .withOriginId(ORIGIN_ID)
          .withEventId(EVENT_ID)
          .withPhaseType("P")
          .withDelta(1)
          .withMagnitudeType("mb")
          .withMagnitude(2.3)
          .withMagnitudeUncertainty(1)
          .withMagnitudeResidual(1.2)
          .withMagnitudeDefining(DefiningFlag.DEFAULT_DEFINING)
          .withMagnitudeModel(MagnitudeModel.UNKNOWN.toString())
          .withAuthor("me")
          .withCommentId(12)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  public static final EventDao DEFAULT_EVENT_DAO =
      new EventDao.Builder()
          .withAuthor("author")
          .withCommentId(3)
          .withEventId(EVENT_ID)
          .withEventName("default")
          .withLoadDate(Instant.now())
          .withPreferredOrigin(3333L)
          .build();

  public static final GaTagDao DEFAULT_GATAG_DAO =
      new GaTagDao.Builder()
          .withAuthor("Test")
          .withId(42)
          .withObjectType("a")
          .withLatitude(0.0)
          .withLongitude(0.0)
          .withTime(Instant.now().toEpochMilli())
          .withLoadDate(Instant.now())
          .withRejectedArrivalOriginEvid(0)
          .withProcessState("analyst_rejected")
          .build();

  public static final EventDao EVENT_PREFERRED_DAO =
      new EventDao.Builder()
          .withAuthor("author")
          .withCommentId(3)
          .withEventId(EVENT_ID)
          .withEventName("default")
          .withLoadDate(Instant.now())
          .withPreferredOrigin(ORIGIN_ID)
          .build();

  public static final GaTagDao DEFAULT_REJECTED_GATAG_DAO =
      new GaTagDao.Builder()
          .withAuthor("Test")
          .withId(DEFAULT_ORIGIN_DAO.getOriginId())
          .withObjectType("o")
          .withLatitude(0.0)
          .withLongitude(0.0)
          .withTime(Instant.now().toEpochMilli())
          .withLoadDate(Instant.now())
          .withRejectedArrivalOriginEvid(DEFAULT_ORIGIN_DAO.getEventId())
          .withProcessState("analyst_rejected")
          .build();

  public static final FacetingDefinition DEFAULT_EVENT_FACETING_DEFINITION =
      FacetingDefinition.builder().setClassType("Event").setPopulated(true).build();

  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS =
      SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS;

  public static final SignalDetectionHypothesis SIGNAL_DETECTION_HYPOTHESIS_NO_MCS =
      SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_NO_MCS;

  private EventTestFixtures() {
    // Hide implicit public constructor
  }

  /**
   * Get the test {@link EventHypothesis}
   *
   * @return {@link EventHypothesis}
   */
  public static EventHypothesis getTestEventHypothesis() {
    return generateDummyEventHypothesis(
        EVENT_UUID,
        HYPOTHESIS_UUID,
        LOCATION_UUID,
        3.3,
        Instant.EPOCH,
        MagnitudeType.MB,
        DoubleValue.from(3.3, Optional.empty(), Units.COUNT),
        List.of());
  }

  /**
   * Generates a dummy, non-realistic {@link EventHypothesis} for use in testing
   *
   * @param eventId ID to be assigned to the generated {@link Event}
   * @param hypothesisId ID to be assigned to the generated {@link EventHypothesis}
   * @param locationId ID to be assigned to the generated {@link Location}
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
      UUID hypothesisId,
      UUID locationId,
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
            .setMeasurement(SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT_NO_MCS)
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
            .setLocationBehaviors(List.of(LOCATION_BEHAVIOR_NO_MCS))
            .setLocationRestraint(LocationRestraint.free())
            .setLocationUncertainty(locationUncertainty)
            .setNetworkMagnitudeSolutions(List.of(netMagSolution))
            .build();

    var locationSolution =
        LocationSolution.builder().setId(locationId).setData(locationSolutionData).build();

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

    var eventHypothesisId = EventHypothesis.Id.from(eventId, hypothesisId);

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
            HYPOTHESIS_UUID,
            LOCATION_UUID,
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
