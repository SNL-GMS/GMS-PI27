package gms.shared.event.analysis.relocation.locoo3d.apibridge;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.analysis.EventRelocationPredictorDefinition;
import gms.shared.event.analysis.EventRelocationProcessingDefinition;
import gms.shared.event.analysis.LocationUncertaintyDefinition;
import gms.shared.event.analysis.ResidualDefinition;
import gms.shared.event.analysis.relocation.locoo3d.utility.ConverterUtility;
import gms.shared.event.api.DefiningFeatureByFeatureMeasurementType;
import gms.shared.event.api.DefiningFeatureDefinition;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.InstantValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gov.sandia.gmp.baseobjects.observation.Observation;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class ConverterUtilityTest {

  // Independently set MILLISECOND_FACTOR beside what is defined elsewhere (ConverterUtility).
  // The test should have its own idea of what this should be, which hopefully the defininition
  // in ConverterUtility "got right".
  private static final double MILLISECOND_FACTOR = 1000.0;

  @Test
  void testArrivalTime() {
    var fm = SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT;

    fm =
        fm.toBuilder()
            .setMeasurementValue(
                ArrivalTimeMeasurementValue.from(
                    InstantValue.from(
                        Instant.EPOCH.plusMillis(14001),
                        fm.getMeasurementValue().getArrivalTime().getStandardDeviation().get()),
                    Optional.empty()))
            .build();

    var observation = new Observation();
    observation.setObservationId(1L);

    Map<FeatureMeasurementType<?>, DefiningFeatureDefinition> map =
        Map.of(
            FeatureMeasurementTypes.ARRIVAL_TIME, new DefiningFeatureDefinition(true, false, true));

    var definingFeatureByFeatureMeasurementType = new DefiningFeatureByFeatureMeasurementType(map);

    ConverterUtility.addFeatureMeasurementToObservation(
        fm, definingFeatureByFeatureMeasurementType, observation);

    Assertions.assertEquals(
        fm.getMeasurementValue().getArrivalTime().getValue().toEpochMilli() / MILLISECOND_FACTOR,
        observation.getArrivalTime());
    Assertions.assertEquals(
        fm.getMeasurementValue().getArrivalTime().getStandardDeviation().get().toMillis()
            / MILLISECOND_FACTOR,
        observation.getDeltim());
    Assertions.assertTrue(observation.isTimedef());
  }

  @Test
  void testReceiverToSourceAzimuth() {
    var fm = SignalDetectionTestFixtures.RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT;

    var observation = new Observation();
    observation.setObservationId(1L);

    Map<FeatureMeasurementType<?>, DefiningFeatureDefinition> map =
        Map.of(
            FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH,
            new DefiningFeatureDefinition(true, false, true));

    var definingFeatureByFeatureMeasurementType = new DefiningFeatureByFeatureMeasurementType(map);

    ConverterUtility.addFeatureMeasurementToObservation(
        fm, definingFeatureByFeatureMeasurementType, observation);

    Assertions.assertEquals(
        fm.getMeasurementValue().getMeasuredValue().getValue(),
        Math.toDegrees(observation.getAzimuth()),
        1e-10);
    Assertions.assertEquals(
        fm.getMeasurementValue().getMeasuredValue().getStandardDeviation().get(),
        Math.toDegrees(observation.getDelaz()),
        1e-10);
    Assertions.assertTrue(observation.isAzdef());
  }

  @Test
  void testSlowness() {
    var fm = SignalDetectionTestFixtures.SLOW_FEATURE_MEASUREMENT;

    // The units in this test fixture constant are wrong - need to be SECONDS_PER_DEGREE.
    fm =
        fm.toBuilder()
            .setMeasurementValue(
                NumericMeasurementValue.from(
                    fm.getMeasurementValue().getReferenceTime(),
                    DoubleValue.from(
                        fm.getMeasurementValue().getMeasuredValue().getValue(),
                        fm.getMeasurementValue().getMeasuredValue().getStandardDeviation(),
                        Units.SECONDS_PER_DEGREE)))
            .build();

    var observation = new Observation();
    observation.setObservationId(1L);

    Map<FeatureMeasurementType<?>, DefiningFeatureDefinition> map =
        Map.of(FeatureMeasurementTypes.SLOWNESS, new DefiningFeatureDefinition(true, false, true));

    var definingFeatureByFeatureMeasurementType = new DefiningFeatureByFeatureMeasurementType(map);

    ConverterUtility.addFeatureMeasurementToObservation(
        fm, definingFeatureByFeatureMeasurementType, observation);

    // Due to the magic of math, toRadians applied to a value that represents SECONDS_PER_RADIAN
    // turns it into one that represents SECONDS_PER_DEGREE.
    // This is related to the fact that the radians/degrees are in the denominator.
    Assertions.assertEquals(
        fm.getMeasurementValue().getMeasuredValue().getValue(),
        Math.toRadians(observation.getSlow()),
        1e-10);
    Assertions.assertEquals(
        fm.getMeasurementValue().getMeasuredValue().getStandardDeviation().get(),
        Math.toRadians(observation.getDelslo()),
        1e-10);
    Assertions.assertTrue(observation.isSlodef());
  }

  @Test
  void testPhase() {
    var fm = SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT;

    var observation = new Observation();
    observation.setObservationId(1L);

    // Needs to be nonempty - converting from Phase does not use the defining map.
    Map<FeatureMeasurementType<?>, DefiningFeatureDefinition> map =
        Map.of(
            FeatureMeasurementTypes.SLOWNESS, // Does not matter what this is for Phase.
            new DefiningFeatureDefinition(true, false, true));

    var definingFeatureByFeatureMeasurementType = new DefiningFeatureByFeatureMeasurementType(map);

    ConverterUtility.addFeatureMeasurementToObservation(
        fm, definingFeatureByFeatureMeasurementType, observation);

    Assertions.assertEquals(
        fm.getMeasurementValue().getValue().toString(), observation.getPhase().toString());
  }

  @Test
  void testCreateLocPredictorTypeValue() {

    EventRelocationPredictorDefinition defaultPredictorDefinition =
        EventRelocationPredictorDefinition.builder()
            .setPredictor("lookup2d")
            .setEarthModel("default earth model")
            .build();

    List<EventRelocationPredictorDefinition> eventRelocationPredictorDefinitionsA =
        List.of(
            EventRelocationPredictorDefinition.builder()
                .setPredictor("bender")
                .setEarthModel("earth model 1")
                .build(),
            EventRelocationPredictorDefinition.builder()
                .setPredictor("slbm")
                .setEarthModel("earth model 1")
                .build());

    List<EventRelocationPredictorDefinition> eventRelocationPredictorDefinitionsB =
        List.of(
            EventRelocationPredictorDefinition.builder()
                .setPredictor("bender")
                .setEarthModel("earth model 1")
                .build());

    List<EventRelocationPredictorDefinition> eventRelocationPredictorDefinitionsC =
        List.of(
            EventRelocationPredictorDefinition.builder()
                .setPredictor("slbm")
                .setEarthModel("earth model 1")
                .build());

    var eventRelocationDefinitionByPhaseType =
        Map.of(
            PhaseType.Pn,
            eventRelocationPredictorDefinitionsA,
            PhaseType.P,
            eventRelocationPredictorDefinitionsB,
            PhaseType.Pg,
            eventRelocationPredictorDefinitionsC);

    Collection<LocationRestraint> locationRestraints =
        List.of(
            LocationRestraint.builder()
                .setDepthRestraintType(RestraintType.UNRESTRAINED)
                .setPositionRestraintType(RestraintType.UNRESTRAINED)
                .setTimeRestraintType(RestraintType.UNRESTRAINED)
                .build());

    Collection<LocationUncertaintyDefinition> locationUncertaintyDefinitions =
        List.of(
            LocationUncertaintyDefinition.builder()
                .setAprioriStandardError(10.0)
                .setConfidenceLevel(0.5)
                .setEllipsoid(true)
                .setKWeight(Double.POSITIVE_INFINITY)
                .setScalingFactorType(ScalingFactorType.COVERAGE)
                .build());

    ResidualDefinition residualDefinition =
        ResidualDefinition.builder()
            .setAllowBigResidual(true)
            .setBigResidualThreshold(0.0)
            .setMaxFraction(0.0)
            .build();

    EventRelocationProcessingDefinition erpd =
        EventRelocationProcessingDefinition.builder()
            .setDefaultPredictorDefinition(defaultPredictorDefinition)
            .setEventRelocationPredictorDefinitions(List.of())
            .setEventRelocator("event relocator")
            .setLocationRestraints(locationRestraints)
            .setLocationUncertaintyDefinitions(locationUncertaintyDefinitions)
            .setResidualDefinition(residualDefinition)
            .build();

    var actual =
        ConverterUtility.createLocPredictorTypeValue(eventRelocationDefinitionByPhaseType, erpd);

    String expected = "lookup2d, bender(P, Pn), slbm(Pg, Pn)";

    Assertions.assertEquals(expected, actual);
  }
}
