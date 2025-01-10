package gms.shared.event.analysis.relocation.locoo3d.apibridge;

import static gms.shared.event.coi.EventTestFixtures.EVENT_UUID;
import static gms.shared.event.coi.EventTestFixtures.HYPOTHESIS_UUID;
import static gms.shared.event.coi.EventTestFixtures.LOCATION_UUID;
import static gms.shared.event.coi.featureprediction.FeaturePredictionComponentType.BASEMODEL_PREDICTION;
import static gms.shared.event.coi.featureprediction.FeaturePredictionDerivativeType.DERIVATIVE_WRT_LATITUDE;
import static org.mockito.Mockito.when;

import com.google.common.math.DoubleMath;
import gms.shared.event.analysis.EventRelocationDefinition;
import gms.shared.event.analysis.LocationUncertaintyDefinition;
import gms.shared.event.analysis.relocation.locoo3d.utility.GmsOutputConverter;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.api.DefiningFeatureDefinition;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationBehavior;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gov.sandia.gmp.baseobjects.PropertiesPlusGMP;
import gov.sandia.gmp.baseobjects.Source;
import gov.sandia.gmp.baseobjects.globals.GMPGlobals;
import gov.sandia.gmp.baseobjects.globals.GeoAttributes;
import gov.sandia.gmp.baseobjects.globals.SeismicPhase;
import gov.sandia.gmp.baseobjects.hyperellipse.Ellipse;
import gov.sandia.gmp.baseobjects.hyperellipse.Ellipsoid;
import gov.sandia.gmp.baseobjects.hyperellipse.HyperEllipse;
import gov.sandia.gmp.baseobjects.observation.Observation;
import gov.sandia.gmp.locoo3d.LocOOTaskResult;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(MockitoExtension.class)
@ExtendWith(OutputCaptureExtension.class)
class GmsOutputTest {

  @Mock private HyperEllipse hyperEllipse;

  @Mock private Ellipse ellipse;

  @Mock private Ellipsoid ellipsoid;

  @Mock private Observation observation;

  private final EnumMap<GeoAttributes, Double> predictions;

  private GmsInput gmsInput;

  @InjectMocks private GmsOutput gmsOutput;

  private static final double TOLERANCE = 1E-5;

  GmsOutputTest() throws Exception {
    gmsInput = getGmsInput();
    gmsOutput = new GmsOutput(GmsOutputTest.Fixtures.properties, gmsInput);
    gmsOutput.setEllipseParameters(GmsOutputTest.Fixtures.ellipseParameters);

    predictions = new EnumMap<>(GeoAttributes.class);
    predictions.put(GeoAttributes.TRAVEL_TIME, 1.1);
    predictions.put(GeoAttributes.TT_MODEL_UNCERTAINTY, 1.2);
    predictions.put(GeoAttributes.TT_MODEL_UNCERTAINTY_DISTANCE_DEPENDENT, 1.3);
    predictions.put(GeoAttributes.TT_MODEL_UNCERTAINTY_PATH_DEPENDENT, 1.4);
    predictions.put(GeoAttributes.DTT_DLAT, 1.5);
    predictions.put(GeoAttributes.DTT_DLON, 1.6);
    predictions.put(GeoAttributes.DTT_DR, 1.7);
    predictions.put(GeoAttributes.DTT_DTIME, 1.8);
    predictions.put(GeoAttributes.TT_BASEMODEL, 1.01);
    predictions.put(GeoAttributes.TT_ELEVATION_CORRECTION, 1.02);
    predictions.put(GeoAttributes.TT_ELLIPTICITY_CORRECTION, 1.03);
    predictions.put(GeoAttributes.TT_PATH_CORRECTION, 1.04);
    predictions.put(GeoAttributes.TT_MASTER_EVENT_CORRECTION, 1.05);
    predictions.put(GeoAttributes.AZIMUTH, 2.1);
    predictions.put(GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY, 2.2);
    predictions.put(GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY_STATION_PHASE_DEPENDENT, 2.3);
    predictions.put(GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY_PATH_DEPENDENT, 2.4);
    predictions.put(GeoAttributes.AZIMUTH_BASEMODEL, 2.01);
    predictions.put(GeoAttributes.AZIMUTH_PATH_CORRECTION, 2.02);
    predictions.put(GeoAttributes.AZIMUTH_MASTER_EVENT_CORRECTION, 2.03);
    predictions.put(GeoAttributes.DAZ_DLAT, 2.5);
    predictions.put(GeoAttributes.DAZ_DLON, 2.6);
    predictions.put(GeoAttributes.DAZ_DR, 2.7);
    predictions.put(GeoAttributes.DAZ_DTIME, 2.8);
    predictions.put(GeoAttributes.SLOWNESS, 3.1);
    predictions.put(GeoAttributes.SLOWNESS_MODEL_UNCERTAINTY, 3.2);
    predictions.put(GeoAttributes.SLOWNESS_MODEL_UNCERTAINTY_STATION_PHASE_DEPENDENT, 3.3);
    predictions.put(GeoAttributes.SLOWNESS_MODEL_UNCERTAINTY_PATH_DEPENDENT, 3.4);
    predictions.put(GeoAttributes.DSH_DLAT, 3.5);
    predictions.put(GeoAttributes.DSH_DLON, 3.6);
    predictions.put(GeoAttributes.DSH_DR, 3.7);
    predictions.put(GeoAttributes.DSH_DTIME, 3.8);
    predictions.put(GeoAttributes.SLOWNESS_BASEMODEL, 3.01);
    predictions.put(GeoAttributes.SLOWNESS_PATH_CORRECTION, 3.02);
    predictions.put(GeoAttributes.SLOWNESS_MASTER_EVENT_CORRECTION, 3.03);
  }

  @BeforeEach
  void setup() throws Exception {
    gmsInput = getGmsInput();
    gmsOutput = new GmsOutput(GmsOutputTest.Fixtures.properties, gmsInput);
    gmsOutput.setEllipseParameters(GmsOutputTest.Fixtures.ellipseParameters);
  }

  // TODO: Due to realities of how locoo works being uncovered, need to revisit "invalid" and how to
  // handle it.
  @Disabled("Locoo3d doesn't work as this test expects - see above TODO")
  @Test
  void testInvalidSource(CapturedOutput capturedOutput) throws Exception {
    gmsInput = new GmsInput(GmsOutputTest.Fixtures.properties);
    gmsOutput = new GmsOutput(GmsOutputTest.Fixtures.properties, gmsInput);
    gmsOutput.setEllipseParameters(GmsOutputTest.Fixtures.ellipseParameters);

    // No tasks
    LocOOTaskResult taskResult = new LocOOTaskResult();
    gmsOutput.writeTaskResult(taskResult);
    Assertions.assertTrue(gmsOutput.getOutputLocationSolutions().isEmpty());

    // Invalid source
    var source = new Source(Fixtures.SOURCE_LAT, Fixtures.SOURCE_LON, Fixtures.SOURCE_DEPTH, true);
    source.setErrorMessage("This is an invalid source");
    source.setValid(false);
    Assertions.assertFalse(source.isValid());

    taskResult = new LocOOTaskResult();
    Map<Long, Source> sourceMap = Map.of(1L, source);
    taskResult.setSources(sourceMap);

    gmsOutput.writeTaskResult(taskResult);
    Assertions.assertTrue(gmsOutput.getOutputLocationSolutions().isEmpty());
    var errorMessage = capturedOutput.getOut();
    var hasCorrectMessage =
        errorMessage.contains("Results contain an invalid source: This is an invalid source");
    Assertions.assertTrue(hasCorrectMessage, "Incorrect error message returned.");
  }

  @Test
  void testNoUnderlyingEllipse() throws Exception {

    // Valid source
    var source = new Source(Fixtures.SOURCE_LAT, Fixtures.SOURCE_LON, Fixtures.SOURCE_DEPTH, true);
    source.setHyperEllipse(hyperEllipse);
    source.setErrorMessage("This is a valid source");
    source.setValid(true);
    Assertions.assertTrue(source.isValid());

    // Task results
    var taskResult = new LocOOTaskResult();
    var sourceMap = new HashMap<Long, Source>();
    gmsInput.readTaskSourceIds().stream()
        .forEach(
            idArray ->
                Arrays.stream(idArray.toArray())
                    .forEach(
                        id -> {
                          try {
                            var newSource = (Source) source.clone();
                            newSource.setSourceId(id);
                            sourceMap.put(id, newSource);
                          } catch (CloneNotSupportedException cnse) {
                            // do nothing -- this exception won't happen
                          }
                        }));

    taskResult.setSources(sourceMap);

    var e =
        Assertions.assertThrows(
            IllegalArgumentException.class, () -> gmsOutput.writeTaskResult(taskResult));
    System.out.println(e.getMessage());
    Assertions.assertTrue(e.getMessage().contains("HyperEllipse does not contain a valid Ellipse"));
  }

  @Test
  void testNoUnderlyingEllipsoid() throws Exception {
    // Valid source
    var source = new Source(Fixtures.SOURCE_LAT, Fixtures.SOURCE_LON, Fixtures.SOURCE_DEPTH, true);
    source.setHyperEllipse(hyperEllipse);
    source.setErrorMessage("This is a valid source");
    source.setValid(true);
    Assertions.assertTrue(source.isValid());

    // Task results
    var taskResult = new LocOOTaskResult();
    var sourceMap = new HashMap<Long, Source>();
    gmsInput.readTaskSourceIds().stream()
        .forEach(
            idArray ->
                Arrays.stream(idArray.toArray())
                    .forEach(
                        id -> {
                          try {
                            var newSource = (Source) source.clone();
                            newSource.setSourceId(id);
                            sourceMap.put(id, newSource);
                          } catch (CloneNotSupportedException cnse) {
                            // do nothing -- this exception won't happen
                          }
                        }));

    taskResult.setSources(sourceMap);

    // Create mocks
    when(hyperEllipse.getEllipse()).thenReturn(ellipse);
    when(ellipse.getMajaxLength()).thenReturn(Fixtures.MAJ_AX_LENGTH);
    when(ellipse.getMinaxLength()).thenReturn(Fixtures.MIN_AX_LENGTH);
    when(ellipse.getMajaxTrend()).thenReturn(Fixtures.MAJ_AX_TREND);

    var e =
        Assertions.assertThrows(
            IllegalArgumentException.class, () -> gmsOutput.writeTaskResult(taskResult));
    Assertions.assertTrue(
        e.getMessage().contains("HyperEllipse does not contain a valid Ellipsoid"));
  }

  @Test
  void testValidInputs() throws Exception {
    // Valid source
    var source = new Source(Fixtures.SOURCE_LAT, Fixtures.SOURCE_LON, Fixtures.SOURCE_DEPTH, true);
    source.setHyperEllipse(hyperEllipse);
    source.setErrorMessage("This is a valid source");
    source.setValid(true);
    source.setSdobs(5.5);
    source.setTime(Fixtures.SOURCE_TIME);
    Assertions.assertTrue(source.isValid());

    // Create observation mocks
    when(observation.getObservationId()).thenReturn(2L);
    when(observation.getPredictions()).thenReturn(predictions);
    when(observation.getPhase()).thenReturn(Fixtures.OBS_PHASE);
    when(observation.getTimeres()).thenReturn(Fixtures.OBS_RESIDUAL[0]);
    when(observation.getTtWeight()).thenReturn(Fixtures.OBS_WEIGHT[0]);
    when(observation.isTimedef()).thenReturn(Fixtures.OBS_DEFINING[0]);
    when(observation.getAzres()).thenReturn(Fixtures.OBS_RESIDUAL[1]);
    when(observation.getAzWeight()).thenReturn(Fixtures.OBS_WEIGHT[1]);
    when(observation.isAzdef()).thenReturn(Fixtures.OBS_DEFINING[1]);
    when(observation.getSlores()).thenReturn(Fixtures.OBS_RESIDUAL[2]);
    when(observation.getShWeight()).thenReturn(Fixtures.OBS_WEIGHT[2]);
    when(observation.isSlodef()).thenReturn(Fixtures.OBS_DEFINING[2]);

    // Task results
    var taskResult = new LocOOTaskResult();
    var sourceMap = new HashMap<Long, Source>();
    gmsInput.readTaskSourceIds().stream()
        .forEach(
            idArray ->
                Arrays.stream(idArray.toArray())
                    .forEach(
                        id -> {
                          try {
                            var newSource = (Source) source.clone();
                            newSource.setSourceId(id);
                            newSource.addObservation(observation);
                            sourceMap.put(id, newSource);
                          } catch (CloneNotSupportedException cnse) {
                            // do nothing -- this exception won't happen
                          }
                        }));

    taskResult.setSources(sourceMap);

    // Create ellipse mocks
    when(hyperEllipse.getSxx()).thenReturn(Fixtures.SXX);
    when(hyperEllipse.getSxy()).thenReturn(Fixtures.SXY);
    when(hyperEllipse.getSxz()).thenReturn(Fixtures.SXZ);
    when(hyperEllipse.getStx()).thenReturn(Fixtures.STX);
    when(hyperEllipse.getSyy()).thenReturn(Fixtures.SYY);
    when(hyperEllipse.getSyz()).thenReturn(Fixtures.SYZ);
    when(hyperEllipse.getSty()).thenReturn(Fixtures.STY);
    when(hyperEllipse.getSzz()).thenReturn(Fixtures.SZZ);
    when(hyperEllipse.getStz()).thenReturn(Fixtures.STZ);
    when(hyperEllipse.getStt()).thenReturn(Fixtures.STT);
    when(hyperEllipse.getSdepth()).thenReturn(Fixtures.SDEPTH);
    when(hyperEllipse.getStime()).thenReturn(Fixtures.STIME);

    when(hyperEllipse.getEllipse()).thenReturn(ellipse);
    when(ellipse.getMajaxLength()).thenReturn(Fixtures.MAJ_AX_LENGTH);
    when(ellipse.getMinaxLength()).thenReturn(Fixtures.MIN_AX_LENGTH);
    when(ellipse.getMajaxTrend()).thenReturn(Fixtures.MAJ_AX_TREND);

    when(hyperEllipse.getEllipsoid()).thenReturn(ellipsoid);
    when(ellipsoid.getMajaxLength()).thenReturn(Fixtures.MAJ_AX_LENGTH);
    when(ellipsoid.getMajaxTrend()).thenReturn(Fixtures.MAJ_AX_TREND);
    when(ellipsoid.getMajaxPlunge()).thenReturn(Fixtures.MAJ_AX_PLUNGE);
    when(ellipsoid.getMinaxLength()).thenReturn(Fixtures.MIN_AX_LENGTH);
    when(ellipsoid.getMinaxTrend()).thenReturn(Fixtures.MIN_AX_TREND);
    when(ellipsoid.getMinaxPlunge()).thenReturn(Fixtures.MIN_AX_PLUNGE);
    when(ellipsoid.getIntaxLength()).thenReturn(Fixtures.INT_AX_LENGTH);
    when(ellipsoid.getIntaxTrend()).thenReturn(Fixtures.INT_AX_TREND);
    when(ellipsoid.getIntaxPlunge()).thenReturn(Fixtures.INT_AX_PLUNGE);

    gmsOutput.writeTaskResult(taskResult);
    var outputLocationSolutions = gmsOutput.getOutputLocationSolutions();
    Assertions.assertEquals(sourceMap.size(), outputLocationSolutions.size());
    verifyOutput(outputLocationSolutions);

    gmsOutput.clearOutputLocationSolutions();
    Assertions.assertEquals(0, gmsOutput.getOutputLocationSolutions().size());
  }

  private GmsInput getGmsInput() throws Exception {
    var baseEventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            EVENT_UUID,
            HYPOTHESIS_UUID,
            LOCATION_UUID,
            3.3,
            Instant.EPOCH.plusSeconds(2024),
            MagnitudeType.MB,
            DoubleValue.from(3.3, Optional.empty(), Units.COUNT),
            List.of());

    var slownessFm1 = SignalDetectionTestFixtures.SLOW_FEATURE_MEASUREMENT;

    // The units in this test fixture constant are wrong - need to be SECONDS_PER_DEGREE.
    slownessFm1 =
        slownessFm1.toBuilder()
            .setMeasurementValue(
                NumericMeasurementValue.from(
                    slownessFm1.getMeasurementValue().getReferenceTime(),
                    DoubleValue.from(
                        slownessFm1.getMeasurementValue().getMeasuredValue().getValue(),
                        slownessFm1.getMeasurementValue().getMeasuredValue().getStandardDeviation(),
                        Units.SECONDS_PER_DEGREE)))
            .build();

    var featureMeasurements =
        Set.of(
            slownessFm1,
            SignalDetectionTestFixtures.RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT,
            SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT,
            SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT);

    var baseSdh1 = SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1;

    baseSdh1 =
        baseSdh1.toBuilder()
            .setData(
                baseSdh1.getData().get().toBuilder()
                    .setStation(
                        baseSdh1.getStation().toBuilder()
                            .setData(
                                baseSdh1.getStation().getData().get().toBuilder()
                                    .setEffectiveUntil(Instant.EPOCH.plusSeconds(1000))
                                    .build())
                            .build())
                    .setFeatureMeasurements(featureMeasurements)
                    .build())
            .build();

    var baseSdh2 =
        baseSdh1.toBuilder()
            .setData(
                baseSdh1.getData().get().toBuilder()
                    .setStation(
                        baseSdh1.getStation().toBuilder()
                            .setData(
                                baseSdh1.getStation().getData().get().toBuilder()
                                    .setEffectiveUntil(Instant.EPOCH.plusSeconds(2000))
                                    .build())
                            .build())
                    .setFeatureMeasurements(featureMeasurements)
                    .build())
            .build();

    var associatedSdhs = Set.of(baseSdh1, baseSdh2);
    var assoicatedSdhEnitityReferences =
        associatedSdhs.stream().map(sdh -> sdh.toEntityReference()).toList();

    var eventHypothesis =
        baseEventHypothesis.toBuilder()
            .setData(
                baseEventHypothesis.getData().get().toBuilder()
                    .setAssociatedSignalDetectionHypotheses(assoicatedSdhEnitityReferences)
                    .setPreferredLocationSolution(
                        baseEventHypothesis
                            .getData()
                            .get()
                            .getPreferredLocationSolution()
                            .get()
                            .toEntityReference())
                    .build())
            .build();

    var sdhDefiningMap =
        associatedSdhs.stream()
            .map(
                sdh ->
                    Map.entry(
                        sdh,
                        new DefiningFeatureByFeatureMeasurementType(
                            Map.of(
                                FeatureMeasurementTypes.ARRIVAL_TIME,
                                    new DefiningFeatureDefinition(true, false, true),
                                FeatureMeasurementTypes.SLOWNESS,
                                    new DefiningFeatureDefinition(true, false, true),
                                FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
                                    new DefiningFeatureDefinition(true, false, true)))))
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

    var eventRelocationDefinition = new EventRelocationDefinition(sdhDefiningMap, null);

    var locationRestraintsMap =
        Map.of(
            EventTestFixtures.LOCATION_RESTRAINT_SURFACE_SOLUTION,
            GMPGlobals.DEPTH,
            LocationRestraint.builder()
                .setLongitudeRestraintDegrees(100.0)
                .setLatitudeRestraintDegrees(89.0)
                .setPositionRestraintType(RestraintType.FIXED)
                .setTimeRestraintType(RestraintType.UNRESTRAINED)
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .build(),
            GMPGlobals.LAT,
            LocationRestraint.builder()
                .setTimeRestraint(Instant.EPOCH.plusSeconds(1045))
                .setTimeRestraintType(RestraintType.FIXED)
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .setPositionRestraintType(RestraintType.UNRESTRAINED)
                .build(),
            GMPGlobals.TIME);

    var newGmsInput = new GmsInput(Fixtures.properties);
    newGmsInput.acceptCoi(
        eventHypothesis, eventRelocationDefinition, locationRestraintsMap.keySet());

    return newGmsInput;
  }

  private void verifyOutput(Map<UUID, LocationSolution> outputLocationSolutions) {
    outputLocationSolutions.values().stream()
        .forEach(
            (var locationSolution) -> {
              Assertions.assertTrue(locationSolution.getData().isPresent());
              validateLsData(locationSolution.getData().orElseThrow());
            });
  }

  private void validateLsData(LocationSolution.Data lsData) {
    // data.id - no validation required

    // data.location
    validateLocation(lsData);

    // data.networkMagnitudeSolutions
    Assertions.assertEquals(0L, lsData.getNetworkMagnitudeSolutions().size());

    // data.locationRestraint
    var locationRestraint = lsData.getLocationRestraint();
    Assertions.assertTrue(gmsInput.getRestraints().values().contains(locationRestraint));

    // data.locationUncertainty
    validateLocationUncertainty(lsData);

    // data.featurePredictions
    validateArrivalFeaturePredictions(lsData);
    validateAzimuthFeaturePredictions(lsData);
    validateSlownessFeaturePredictions(lsData);

    // data.locationBehaviors
    validateLocationBehaviors(lsData);
  }

  private void validateLocation(LocationSolution.Data lsData) {
    Assertions.assertTrue(
        DoubleMath.fuzzyEquals(
            Fixtures.SOURCE_LAT, lsData.getLocation().getLatitudeDegrees(), TOLERANCE));
    Assertions.assertTrue(
        DoubleMath.fuzzyEquals(
            Fixtures.SOURCE_LON, lsData.getLocation().getLongitudeDegrees(), TOLERANCE));
    Assertions.assertTrue(
        DoubleMath.fuzzyEquals(
            Fixtures.SOURCE_DEPTH, lsData.getLocation().getDepthKm(), TOLERANCE));
    Assertions.assertEquals(
        Instant.ofEpochMilli(Math.round(Fixtures.SOURCE_TIME * 1000)),
        lsData.getLocation().getTime());
  }

  private void validateArrivalFeaturePredictions(LocationSolution.Data lsData) {
    // only one
    var arrivalFpSet =
        lsData
            .getFeaturePredictions()
            .getFeaturePredictionsForType(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE);
    Assertions.assertEquals(1, arrivalFpSet.size());

    var arrivalFp = arrivalFpSet.stream().findFirst().get();

    // phase
    Assertions.assertEquals(Fixtures.OBS_PHASE.toString(), arrivalFp.getPhase().getLabel());

    // predicted value
    var travelTime = predictions.get(GeoAttributes.TRAVEL_TIME);
    var travelTimeDev = predictions.get(GeoAttributes.TT_MODEL_UNCERTAINTY);
    // -- travel time value
    Assertions.assertEquals(
        travelTime.doubleValue(),
        arrivalFp
                .getPredictionValue()
                .getPredictedValue()
                .getTravelTime()
                .get()
                .getValue()
                .toMillis()
            / 1000.0);
    // -- travel time std dev
    Assertions.assertEquals(
        travelTimeDev.doubleValue(),
        arrivalFp
                .getPredictionValue()
                .getPredictedValue()
                .getTravelTime()
                .get()
                .getStandardDeviation()
                .get()
                .toMillis()
            / 1000.0);
    // -- arrival time value
    Assertions.assertEquals(
        SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT
            .getMeasurementValue()
            .getArrivalTime()
            .getValue()
            .plusMillis(Math.round(travelTime * 1000.0)),
        arrivalFp.getPredictionValue().getPredictedValue().getArrivalTime().getValue());
    // -- arrival time std dev
    Assertions.assertEquals(
        travelTimeDev.doubleValue(),
        arrivalFp
                .getPredictionValue()
                .getPredictedValue()
                .getArrivalTime()
                .getStandardDeviation()
                .get()
                .toMillis()
            / 1000.0);

    // derivatives
    var arrivalMap = arrivalFp.getPredictionValue().getDerivativeMap();
    Assertions.assertEquals(4, arrivalMap.keySet().size());
    arrivalMap.entrySet().stream()
        .forEach(
            entry -> {
              switch (entry.getKey()) {
                case DERIVATIVE_WRT_DEPTH -> {
                  Assertions.assertEquals(
                      -predictions.get(GeoAttributes.DTT_DR), entry.getValue().getValue());
                  Assertions.assertEquals(Units.SECONDS_PER_KILOMETER, entry.getValue().getUnits());
                }
                case DERIVATIVE_WRT_LATITUDE -> {
                  Assertions.assertEquals(
                      Math.toDegrees(predictions.get(GeoAttributes.DTT_DLAT)),
                      entry.getValue().getValue());
                  Assertions.assertEquals(Units.SECONDS_PER_DEGREE, entry.getValue().getUnits());
                }
                case DERIVATIVE_WRT_LONGITUDE -> {
                  Assertions.assertEquals(
                      Math.toDegrees(predictions.get(GeoAttributes.DTT_DLON)),
                      entry.getValue().getValue());
                  Assertions.assertEquals(Units.SECONDS_PER_DEGREE, entry.getValue().getUnits());
                }
                case DERIVATIVE_WRT_TIME -> {
                  Assertions.assertEquals(
                      predictions.get(GeoAttributes.DTT_DTIME).doubleValue(),
                      entry.getValue().getValue());
                  Assertions.assertEquals(Units.UNITLESS, entry.getValue().getUnits());
                }
                default -> Assertions.fail();
              }
            });

    // featurePredictionComponents
    var arrivalComponents = arrivalFp.getPredictionValue().getFeaturePredictionComponentSet();
    Assertions.assertEquals(7, arrivalComponents.size());
    arrivalComponents.stream()
        .forEach(
            sc -> {
              switch (sc.getFeaturePredictionComponent()) {
                case UNCERTAINTY_DISTANCE_DEPENDENT -> Assertions.assertEquals(
                    Duration.ofMillis(
                        Math.round(
                            predictions.get(GeoAttributes.TT_MODEL_UNCERTAINTY_DISTANCE_DEPENDENT)
                                * 1000.0)),
                    sc.getValue().getValue());
                case UNCERTAINTY_PATH_DEPENDENT -> Assertions.assertEquals(
                    Duration.ofMillis(
                        Math.round(
                            predictions.get(GeoAttributes.TT_MODEL_UNCERTAINTY_PATH_DEPENDENT)
                                * 1000.0)),
                    sc.getValue().getValue());
                case BASEMODEL_PREDICTION -> Assertions.assertEquals(
                    Duration.ofMillis(
                        Math.round(predictions.get(GeoAttributes.TT_BASEMODEL) * 1000.0)),
                    sc.getValue().getValue());
                case PATH_CORRECTION -> Assertions.assertEquals(
                    Duration.ofMillis(
                        Math.round(predictions.get(GeoAttributes.TT_PATH_CORRECTION) * 1000.0)),
                    sc.getValue().getValue());
                case MASTER_EVENT_CORRECTION -> Assertions.assertEquals(
                    Duration.ofMillis(
                        Math.round(
                            predictions.get(GeoAttributes.TT_MASTER_EVENT_CORRECTION) * 1000.0)),
                    sc.getValue().getValue());
                case ELEVATION_CORRECTION -> Assertions.assertEquals(
                    Duration.ofMillis(
                        Math.round(
                            predictions.get(GeoAttributes.TT_ELEVATION_CORRECTION) * 1000.0)),
                    sc.getValue().getValue());
                case ELLIPTICITY_CORRECTION -> Assertions.assertEquals(
                    Duration.ofMillis(
                        Math.round(
                            predictions.get(GeoAttributes.TT_ELLIPTICITY_CORRECTION) * 1000.0)),
                    sc.getValue().getValue());
                default -> {
                  System.out.println(sc.getFeaturePredictionComponent());
                  Assertions.fail();
                }
              }
            });

    // channel
    Assertions.assertEquals(
        SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT.getChannel(),
        arrivalFp.getChannel().get());

    // receiver location
    Assertions.assertEquals(
        SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1.getStation().getLocation(),
        arrivalFp.getReceiverLocation());

    // source location
    Assertions.assertEquals(lsData.getLocation(), arrivalFp.getSourceLocation());
  }

  private void validateAzimuthFeaturePredictions(LocationSolution.Data lsData) {
    // only one
    var azimuthFpSet =
        lsData
            .getFeaturePredictions()
            .getFeaturePredictionsForType(
                FeaturePredictionType.RECEIVER_TO_SOURCE_AZIMUTH_PREDICTION_TYPE);
    Assertions.assertEquals(1, azimuthFpSet.size());

    var azimuthFp = azimuthFpSet.stream().findFirst().get();

    // phase
    Assertions.assertEquals(Fixtures.OBS_PHASE.toString(), azimuthFp.getPhase().getLabel());

    // predicted value
    Assertions.assertEquals(
        Math.toDegrees(predictions.get(GeoAttributes.AZIMUTH)),
        azimuthFp.getPredictionValue().getPredictedValue().getMeasuredValue().getValue());
    Assertions.assertEquals(
        Math.toDegrees(predictions.get(GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY)),
        azimuthFp
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getStandardDeviation()
            .get());

    // derivatives
    var azimuthMap = azimuthFp.getPredictionValue().getDerivativeMap();
    Assertions.assertEquals(4, azimuthMap.keySet().size());
    azimuthMap.entrySet().stream()
        .forEach(
            entry -> {
              switch (entry.getKey()) {
                case DERIVATIVE_WRT_DEPTH -> {
                  Assertions.assertEquals(
                      -Math.toDegrees(predictions.get(GeoAttributes.DAZ_DR)),
                      entry.getValue().getValue());
                  Assertions.assertEquals(Units.DEGREES_PER_KM, entry.getValue().getUnits());
                }
                case DERIVATIVE_WRT_LATITUDE -> {
                  Assertions.assertEquals(
                      predictions.get(GeoAttributes.DAZ_DLAT).doubleValue(),
                      entry.getValue().getValue());
                  Assertions.assertEquals(Units.UNITLESS, entry.getValue().getUnits());
                }
                case DERIVATIVE_WRT_LONGITUDE -> {
                  Assertions.assertEquals(
                      predictions.get(GeoAttributes.DAZ_DLON).doubleValue(),
                      entry.getValue().getValue());
                  Assertions.assertEquals(Units.UNITLESS, entry.getValue().getUnits());
                }
                case DERIVATIVE_WRT_TIME -> {
                  Assertions.assertEquals(
                      Math.toDegrees(predictions.get(GeoAttributes.DAZ_DTIME)),
                      entry.getValue().getValue());
                  Assertions.assertEquals(Units.DEGREES_PER_SECOND, entry.getValue().getUnits());
                }
                default -> Assertions.fail();
              }
            });

    // featurePredictionComponents
    var azimuthComponents = azimuthFp.getPredictionValue().getFeaturePredictionComponentSet();
    Assertions.assertEquals(5, azimuthComponents.size());
    azimuthComponents.stream()
        .forEach(
            sc -> {
              switch (sc.getFeaturePredictionComponent()) {
                case UNCERTAINTY_STATION_PHASE_DEPENDENT -> {
                  Assertions.assertEquals(
                      Math.toDegrees(
                          predictions.get(
                              GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY_STATION_PHASE_DEPENDENT)),
                      sc.getValue().getValue());
                  Assertions.assertEquals(Units.DEGREES, sc.getValue().getUnits());
                }
                case UNCERTAINTY_PATH_DEPENDENT -> {
                  Assertions.assertEquals(
                      Math.toDegrees(
                          predictions.get(GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY_PATH_DEPENDENT)),
                      sc.getValue().getValue());
                  Assertions.assertEquals(Units.DEGREES, sc.getValue().getUnits());
                }
                case BASEMODEL_PREDICTION -> {
                  Assertions.assertEquals(
                      Math.toDegrees(predictions.get(GeoAttributes.AZIMUTH_BASEMODEL)),
                      sc.getValue().getValue());
                  Assertions.assertEquals(Units.DEGREES, sc.getValue().getUnits());
                }
                case PATH_CORRECTION -> {
                  Assertions.assertEquals(
                      Math.toDegrees(predictions.get(GeoAttributes.AZIMUTH_PATH_CORRECTION)),
                      sc.getValue().getValue());
                  Assertions.assertEquals(Units.DEGREES, sc.getValue().getUnits());
                }
                case MASTER_EVENT_CORRECTION -> {
                  Assertions.assertEquals(
                      Math.toDegrees(
                          predictions.get(GeoAttributes.AZIMUTH_MASTER_EVENT_CORRECTION)),
                      sc.getValue().getValue());
                  Assertions.assertEquals(Units.DEGREES, sc.getValue().getUnits());
                }
                default -> Assertions.fail();
              }
            });

    // channel
    Assertions.assertEquals(
        SignalDetectionTestFixtures.RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT.getChannel(),
        azimuthFp.getChannel().get());

    // receiver location
    Assertions.assertEquals(
        SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1.getStation().getLocation(),
        azimuthFp.getReceiverLocation());

    // source location
    Assertions.assertEquals(lsData.getLocation(), azimuthFp.getSourceLocation());
  }

  private void validateSlownessFeaturePredictions(LocationSolution.Data lsData) {
    // only one
    var slownessFpSet =
        lsData
            .getFeaturePredictions()
            .getFeaturePredictionsForType(FeaturePredictionType.SLOWNESS_PREDICTION_TYPE);
    Assertions.assertEquals(1, slownessFpSet.size());

    var slowFp = slownessFpSet.stream().findFirst().get();

    // phase
    Assertions.assertEquals(Fixtures.OBS_PHASE.toString(), slowFp.getPhase().getLabel());

    // predicted value
    Assertions.assertEquals(
        GmsOutputConverter.toInverseDegrees(predictions.get(GeoAttributes.SLOWNESS)),
        slowFp.getPredictionValue().getPredictedValue().getMeasuredValue().getValue());
    Assertions.assertEquals(
        GmsOutputConverter.toInverseDegrees(
            predictions.get(GeoAttributes.SLOWNESS_MODEL_UNCERTAINTY)),
        slowFp
            .getPredictionValue()
            .getPredictedValue()
            .getMeasuredValue()
            .getStandardDeviation()
            .get());

    // derivatives
    var slowMap = slowFp.getPredictionValue().getDerivativeMap();
    Assertions.assertEquals(4, slowMap.keySet().size());
    slowMap.entrySet().stream()
        .forEach(
            entry -> {
              switch (entry.getKey()) {
                case DERIVATIVE_WRT_DEPTH -> {
                  Assertions.assertEquals(
                      Math.toRadians(-predictions.get(GeoAttributes.DSH_DR)),
                      entry.getValue().getValue());
                  Assertions.assertEquals(Units.SECONDS_PER_DEGREE_KM, entry.getValue().getUnits());
                }
                case DERIVATIVE_WRT_LATITUDE -> {
                  Assertions.assertEquals(
                      Math.toRadians(Math.toRadians(predictions.get(GeoAttributes.DSH_DLAT))),
                      entry.getValue().getValue());
                  Assertions.assertEquals(
                      Units.SECONDS_PER_DEGREE_SQUARED, entry.getValue().getUnits());
                }
                case DERIVATIVE_WRT_LONGITUDE -> {
                  Assertions.assertEquals(
                      Math.toRadians(Math.toRadians(predictions.get(GeoAttributes.DSH_DLON))),
                      entry.getValue().getValue());
                  Assertions.assertEquals(
                      Units.SECONDS_PER_DEGREE_SQUARED, entry.getValue().getUnits());
                }
                case DERIVATIVE_WRT_TIME -> {
                  Assertions.assertEquals(
                      Math.toRadians(predictions.get(GeoAttributes.DSH_DTIME)),
                      entry.getValue().getValue());
                  Assertions.assertEquals(Units.ONE_OVER_DEGREE, entry.getValue().getUnits());
                }
                default -> Assertions.fail();
              }
            });

    // featurePredictionComponents
    var slowComponents = slowFp.getPredictionValue().getFeaturePredictionComponentSet();
    Assertions.assertEquals(5, slowComponents.size());
    slowComponents.stream()
        .forEach(
            sc -> {
              switch (sc.getFeaturePredictionComponent()) {
                case UNCERTAINTY_STATION_PHASE_DEPENDENT -> {
                  Assertions.assertEquals(
                      Math.toRadians(
                          predictions.get(
                              GeoAttributes.SLOWNESS_MODEL_UNCERTAINTY_STATION_PHASE_DEPENDENT)),
                      sc.getValue().getValue());
                  Assertions.assertEquals(Units.SECONDS_PER_DEGREE, sc.getValue().getUnits());
                }
                case UNCERTAINTY_PATH_DEPENDENT -> {
                  Assertions.assertEquals(
                      Math.toRadians(
                          predictions.get(GeoAttributes.SLOWNESS_MODEL_UNCERTAINTY_PATH_DEPENDENT)),
                      sc.getValue().getValue());
                  Assertions.assertEquals(Units.SECONDS_PER_DEGREE, sc.getValue().getUnits());
                }
                case BASEMODEL_PREDICTION -> {
                  Assertions.assertEquals(
                      Math.toRadians(predictions.get(GeoAttributes.SLOWNESS_BASEMODEL)),
                      sc.getValue().getValue());
                  Assertions.assertEquals(Units.SECONDS_PER_DEGREE, sc.getValue().getUnits());
                }
                case PATH_CORRECTION -> {
                  Assertions.assertEquals(
                      Math.toRadians(predictions.get(GeoAttributes.SLOWNESS_PATH_CORRECTION)),
                      sc.getValue().getValue());
                  Assertions.assertEquals(Units.SECONDS_PER_DEGREE, sc.getValue().getUnits());
                }
                case MASTER_EVENT_CORRECTION -> {
                  Assertions.assertEquals(
                      Math.toRadians(
                          predictions.get(GeoAttributes.SLOWNESS_MASTER_EVENT_CORRECTION)),
                      sc.getValue().getValue());
                  Assertions.assertEquals(Units.SECONDS_PER_DEGREE, sc.getValue().getUnits());
                }
                default -> Assertions.fail();
              }
            });

    // channel
    Assertions.assertEquals(
        SignalDetectionTestFixtures.SLOW_FEATURE_MEASUREMENT.getChannel(),
        slowFp.getChannel().get());

    // receiver location
    Assertions.assertEquals(
        SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1.getStation().getLocation(),
        slowFp.getReceiverLocation());

    // source location
    Assertions.assertEquals(lsData.getLocation(), slowFp.getSourceLocation());
  }

  private void validateLocationBehaviors(LocationSolution.Data lsData) {
    // size 3
    var locationBehaviors = lsData.getLocationBehaviors();
    Assertions.assertEquals(3, locationBehaviors.size());

    // one of each FM type, and each is a member of the SDH collection of FMs
    var lbTypeSet =
        locationBehaviors.stream()
            .map(
                lb ->
                    lb.getMeasurement().getFeatureMeasurementType().getFeatureMeasurementTypeName())
            .collect(Collectors.toSet());
    Assertions.assertEquals(3, lbTypeSet.size());
    Assertions.assertTrue(lbTypeSet.contains("ARRIVAL_TIME"));
    Assertions.assertTrue(lbTypeSet.contains("RECEIVER_TO_SOURCE_AZIMUTH"));
    Assertions.assertTrue(lbTypeSet.contains("SLOWNESS"));
    var sdhFmSet =
        gmsInput.getSignalDetectionHypotheses().values().stream()
            .map(sdh -> sdh.getFeatureMeasurements())
            .flatMap(sdhFms -> sdhFms.stream())
            .collect(Collectors.toSet());
    locationBehaviors.stream()
        .map(lb -> lb.getMeasurement())
        .forEach(lbFm -> sdhFmSet.contains(lbFm));

    // one of each FP type, and each is in the LB collection of FPs
    var lbFpSet =
        locationBehaviors.stream()
            .map(lb -> lb.getPrediction())
            .flatMap(Optional::stream)
            .collect(Collectors.toSet());
    Assertions.assertEquals(3, lbFpSet.size());
    lbFpSet.stream().forEach(lbFp -> lsData.getFeaturePredictions().contains(lbFp));

    // residual, weight, and defining are correct
    locationBehaviors.stream()
        .forEach(
            (LocationBehavior lb) -> {
              int index = -1;
              Double residual = 0.0;
              Double weight = 0.0;
              switch (lb.getMeasurement()
                  .getFeatureMeasurementType()
                  .getFeatureMeasurementTypeName()) {
                case "ARRIVAL_TIME" -> {
                  index = 0;
                  residual = Fixtures.OBS_RESIDUAL[index];
                  weight = Fixtures.OBS_WEIGHT[index];
                }
                case "RECEIVER_TO_SOURCE_AZIMUTH" -> {
                  index = 1;
                  residual = Math.toDegrees(Fixtures.OBS_RESIDUAL[index]);
                  weight = GmsOutputConverter.toInverseDegrees(Fixtures.OBS_WEIGHT[index]);
                }
                case "SLOWNESS" -> {
                  index = 2;
                  residual = GmsOutputConverter.toInverseDegrees(Fixtures.OBS_RESIDUAL[index]);
                  weight = Math.toDegrees(Fixtures.OBS_WEIGHT[index]);
                }
                default -> Assertions.fail();
              }
              Assertions.assertEquals(residual, lb.getResidual().get());
              Assertions.assertEquals(weight, lb.getWeight().get());
              Assertions.assertEquals(Fixtures.OBS_DEFINING[index], lb.isDefining());
            });
  }

  private void validateLocationUncertainty(LocationSolution.Data lsData) {
    var lu = lsData.getLocationUncertainty().get();

    // base values
    Assertions.assertEquals(Fixtures.SXX, lu.getXx().get().doubleValue());
    Assertions.assertEquals(Fixtures.SXY, lu.getXy().get().doubleValue());
    Assertions.assertEquals(Fixtures.SXZ, lu.getXz().get().doubleValue());
    Assertions.assertEquals(Fixtures.STX, lu.getXt().get().doubleValue());
    Assertions.assertEquals(Fixtures.SYY, lu.getYy().get().doubleValue());
    Assertions.assertEquals(Fixtures.SYZ, lu.getYz().get().doubleValue());
    Assertions.assertEquals(Fixtures.STY, lu.getYt().get().doubleValue());
    Assertions.assertEquals(Fixtures.SZZ, lu.getZz().get().doubleValue());
    Assertions.assertEquals(Fixtures.STZ, lu.getZt().get().doubleValue());
    Assertions.assertEquals(Fixtures.STT, lu.getTt().get().doubleValue());

    // ellipses
    var ellipses = lu.getEllipses();
    Assertions.assertEquals(3, ellipses.size());
    ellipses.stream()
        .forEach(
            e -> {
              Assertions.assertEquals(
                  Fixtures.SDEPTH, e.getDepthUncertaintyKm().get().doubleValue());
              Assertions.assertEquals(
                  Duration.ofMillis(Math.round(Fixtures.STIME * 1000.0)),
                  e.getTimeUncertainty().get());
              Assertions.assertEquals(
                  Fixtures.MAJ_AX_LENGTH, e.getSemiMajorAxisLengthKm().get().doubleValue());
              Assertions.assertEquals(
                  Fixtures.MAJ_AX_TREND, e.getSemiMajorAxisTrendDeg().get().doubleValue());
              Assertions.assertEquals(
                  Fixtures.MIN_AX_LENGTH, e.getSemiMinorAxisLengthKm().get().doubleValue());
              switch (e.getScalingFactorType()) {
                case COVERAGE -> {
                  Assertions.assertEquals(0.5, e.getConfidenceLevel());
                  Assertions.assertEquals(Double.POSITIVE_INFINITY, e.getkWeight());
                }
                case K_WEIGHTED -> {
                  Assertions.assertEquals(0.9, e.getConfidenceLevel());
                  Assertions.assertEquals(1.0, e.getkWeight());
                }
                case CONFIDENCE -> {
                  Assertions.assertEquals(0.75, e.getConfidenceLevel());
                  Assertions.assertEquals(0.0, e.getkWeight());
                }
              }
            });

    // ellipsoid
    var ellipsoids = lu.getEllipsoids();
    Assertions.assertEquals(2, ellipsoids.size());
    ellipsoids.stream()
        .forEach(
            e -> {
              Assertions.assertEquals(
                  Duration.ofMillis(Math.round(Fixtures.STIME * 1000.0)),
                  e.getTimeUncertainty().get());
              Assertions.assertEquals(
                  Fixtures.MAJ_AX_LENGTH, e.getSemiMajorAxisLengthKm().get().doubleValue());
              Assertions.assertEquals(
                  Fixtures.MAJ_AX_TREND, e.getSemiMajorAxisTrendDeg().get().doubleValue());
              Assertions.assertEquals(
                  Fixtures.MAJ_AX_PLUNGE, e.getSemiMajorAxisPlungeDeg().get().doubleValue());
              Assertions.assertEquals(
                  Fixtures.INT_AX_LENGTH, e.getSemiIntermediateAxisLengthKm().get().doubleValue());
              Assertions.assertEquals(
                  Fixtures.INT_AX_TREND, e.getSemiIntermediateAxisTrendDeg().get().doubleValue());
              Assertions.assertEquals(
                  Fixtures.INT_AX_PLUNGE, e.getSemiIntermediateAxisPlungeDeg().get().doubleValue());
              Assertions.assertEquals(
                  Fixtures.MIN_AX_LENGTH, e.getSemiMinorAxisLengthKm().get().doubleValue());
              Assertions.assertEquals(
                  Fixtures.MIN_AX_TREND, e.getSemiMinorAxisTrendDeg().get().doubleValue());
              Assertions.assertEquals(
                  Fixtures.MIN_AX_PLUNGE, e.getSemiMinorAxisPlungeDeg().get().doubleValue());
              switch (e.getScalingFactorType()) {
                case COVERAGE -> {
                  Assertions.assertEquals(0.5, e.getConfidenceLevel());
                  Assertions.assertEquals(Double.POSITIVE_INFINITY, e.getkWeight());
                }
                case K_WEIGHTED -> {
                  Assertions.assertEquals(0.9, e.getConfidenceLevel());
                  Assertions.assertEquals(1.0, e.getkWeight());
                }
                case CONFIDENCE -> {
                  Assertions.fail();
                }
              }
            });
  }

  public class Fixtures {

    public static final PropertiesPlusGMP properties = new PropertiesPlusGMP();

    static {
      properties.put("dataLoaderInputType", "application");
      properties.put("dataLoaderInputFormat", "gms");
      properties.put("dataLoaderOutputType", "application");
      properties.put("dataLoaderOutputFormat", "gms");
    }

    public static final Collection<LocationUncertaintyDefinition> ellipseParameters =
        List.of(
            new LocationUncertaintyDefinition(
                0.5, true, Double.POSITIVE_INFINITY, 0.5, ScalingFactorType.COVERAGE),
            new LocationUncertaintyDefinition(null, false, 0.0, 0.75, ScalingFactorType.CONFIDENCE),
            new LocationUncertaintyDefinition(
                0.125, true, 1.0, 0.90, ScalingFactorType.K_WEIGHTED));

    public static final double[][] covarianceMatrix = {
      {1, 0, 0, 0}, {0, 1, 0, 0}, {0, 0, 1, 0}, {0, 0, 0, 1}, {.5, .5, .5, .5}
    };

    public static final double MAJ_AX_LENGTH = 3.1;
    public static final double MAJ_AX_TREND = 3.2;
    public static final double MAJ_AX_PLUNGE = 3.3;
    public static final double INT_AX_LENGTH = 2.1;
    public static final double INT_AX_TREND = 2.2;
    public static final double INT_AX_PLUNGE = 2.3;
    public static final double MIN_AX_LENGTH = 1.1;
    public static final double MIN_AX_TREND = 1.2;
    public static final double MIN_AX_PLUNGE = 1.3;

    public static final double SOURCE_LAT = 35.0844;
    public static final double SOURCE_LON = -106.6504;
    public static final double SOURCE_DEPTH = -10.0;
    public static final double SOURCE_TIME = 31_557_600.0;

    // time / azimuth / slowness
    public static final Double[] OBS_RESIDUAL = {100.1, 100.2, 100.3};
    public static final Double[] OBS_WEIGHT = {200.1, 200.2, 200.3};
    public static final boolean[] OBS_DEFINING = {true, false, true};

    public static final SeismicPhase OBS_PHASE = SeismicPhase.P;

    public static final double SXX = 11.0;
    public static final double SXY = 12.0;
    public static final double SXZ = 13.0;
    public static final double STX = 14.0;
    public static final double SYY = 15.0;
    public static final double SYZ = 16.0;
    public static final double STY = 17.0;
    public static final double SZZ = 18.0;
    public static final double STZ = 19.0;
    public static final double STT = 20.0;
    public static final double SDEPTH = 21.0;
    public static final double STIME = 22.0;
  }
}
