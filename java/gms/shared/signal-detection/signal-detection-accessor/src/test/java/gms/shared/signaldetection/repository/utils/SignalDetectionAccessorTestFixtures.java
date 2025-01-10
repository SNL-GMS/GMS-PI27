package gms.shared.signaldetection.repository.utils;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.AMPLITUDE_DAO;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.AMPLITUDE_DAO_AMPTYPE_SBSNR;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_TEST_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_TEST_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ASSOC_DAO_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ASSOC_DAO_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.AMPLITUDE_CHANNEL_SEGMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL_SEGMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.WORKFLOW_DEFINITION_ID1;

import gms.shared.signaldetection.coi.detection.WaveformAndFilterDefinition;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;
import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.signaldetection.coi.values.FirstMotionMeasurementValue;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.utils.Units;

public final class SignalDetectionAccessorTestFixtures {

  // ------- ArrivalDao MeasurementValueSpecs --------
  public static final MeasurementValueSpec<ArrivalTimeMeasurementValue> ARRIVAL_MEASUREMENT_SPEC =
      MeasurementValueSpec.<ArrivalTimeMeasurementValue>builder()
          .setArrivalDao(ARRIVAL_1)
          .setFeatureMeasurementType(FeatureMeasurementTypes.ARRIVAL_TIME)
          .build();
  public static final MeasurementValueSpec<PhaseTypeMeasurementValue> PHASE_MEASUREMENT_SPEC =
      MeasurementValueSpec.<PhaseTypeMeasurementValue>builder()
          .setArrivalDao(ARRIVAL_1)
          .setFeatureMeasurementType(FeatureMeasurementTypes.PHASE)
          .build();
  public static final MeasurementValueSpec<NumericMeasurementValue>
      RECEIVER_AZIMUTH_MEASUREMENT_SPEC =
          MeasurementValueSpec.<NumericMeasurementValue>builder()
              .setArrivalDao(ARRIVAL_2)
              .setFeatureMeasurementType(FeatureMeasurementTypes.RECEIVER_TO_SOURCE_AZIMUTH)
              .setMeasuredValueExtractor(ArrivalDao::getAzimuth)
              .setUncertaintyValueExtractor(ArrivalDao::getAzimuthUncertainty)
              .setUnits(Units.DEGREES)
              .build();
  public static final MeasurementValueSpec<NumericMeasurementValue> SLOWNESS_MEASUREMENT_SPEC =
      MeasurementValueSpec.<NumericMeasurementValue>builder()
          .setArrivalDao(ARRIVAL_1)
          .setFeatureMeasurementType(FeatureMeasurementTypes.SLOWNESS)
          .setMeasuredValueExtractor(ArrivalDao::getSlowness)
          .setUnits(Units.SECONDS_PER_DEGREE)
          .build();
  public static final MeasurementValueSpec<NumericMeasurementValue>
      EMERGENCE_ANGLE_MEASUREMENT_SPEC =
          MeasurementValueSpec.<NumericMeasurementValue>builder()
              .setArrivalDao(ARRIVAL_1)
              .setFeatureMeasurementType(FeatureMeasurementTypes.EMERGENCE_ANGLE)
              .setMeasuredValueExtractor(ArrivalDao::getEmergenceAngle)
              .setUnits(Units.DEGREES)
              .build();
  public static final MeasurementValueSpec<NumericMeasurementValue>
      RECTILINEARITY_MEASUREMENT_SPEC =
          MeasurementValueSpec.<NumericMeasurementValue>builder()
              .setArrivalDao(ARRIVAL_1)
              .setFeatureMeasurementType(FeatureMeasurementTypes.RECTILINEARITY)
              .setMeasuredValueExtractor(ArrivalDao::getRectilinearity)
              .setUnits(Units.UNITLESS)
              .build();
  public static final MeasurementValueSpec<FirstMotionMeasurementValue>
      SHORT_PERIOD_MEASUREMENT_SPEC =
          MeasurementValueSpec.<FirstMotionMeasurementValue>builder()
              .setArrivalDao(ARRIVAL_1)
              .setFeatureMeasurementType(FeatureMeasurementTypes.SHORT_PERIOD_FIRST_MOTION)
              .setFeatureMeasurementTypeCode("c")
              .build();
  public static final MeasurementValueSpec<FirstMotionMeasurementValue>
      LONG_PERIOD_MEASUREMENT_SPEC =
          MeasurementValueSpec.<FirstMotionMeasurementValue>builder()
              .setArrivalDao(ARRIVAL_3)
              .setFeatureMeasurementType(FeatureMeasurementTypes.LONG_PERIOD_FIRST_MOTION)
              .setFeatureMeasurementTypeCode("r")
              .build();

  // ------- AssocDao MeasurementValueSpecs --------
  public static final MeasurementValueSpec<ArrivalTimeMeasurementValue> ARRIVAL_MEASUREMENT_SPEC_2 =
      MeasurementValueSpec.<ArrivalTimeMeasurementValue>builder()
          .setArrivalDao(ARRIVAL_1)
          .setAssocDao(ASSOC_DAO_1)
          .setFeatureMeasurementType(FeatureMeasurementTypes.ARRIVAL_TIME)
          .build();
  public static final MeasurementValueSpec<PhaseTypeMeasurementValue> PHASE_MEASUREMENT_SPEC_2 =
      MeasurementValueSpec.<PhaseTypeMeasurementValue>builder()
          .setArrivalDao(ARRIVAL_2)
          .setAssocDao(ASSOC_DAO_2)
          .setFeatureMeasurementType(FeatureMeasurementTypes.PHASE)
          .build();

  public static final MeasurementValueSpec<AmplitudeMeasurementValue> AMPLITUDE_MEASUREMENT_SPEC =
      MeasurementValueSpec.<AmplitudeMeasurementValue>builder()
          .setAmplitudeDao(AMPLITUDE_DAO)
          .setArrivalDao(ARRIVAL_1)
          .setFeatureMeasurementType(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2)
          .build();

  // ------- ArrivalDaoAndChannelAssociation, AmplitudeDaoAndChannelAssociation -------
  public static final ArrivalDaoAndChannelAssociation ARRIVAL_ASSOCIATION_1 =
      ArrivalDaoAndChannelAssociation.create(ARRIVAL_1, ARRIVAL_CHANNEL, ARRIVAL_CHANNEL_SEGMENT);
  public static final ArrivalDaoAndChannelAssociation ARRIVAL_ASSOCIATION_3 =
      ArrivalDaoAndChannelAssociation.create(ARRIVAL_3, ARRIVAL_CHANNEL, ARRIVAL_CHANNEL_SEGMENT);
  public static final ArrivalDaoAndChannelAssociation ARRIVAL_ASSOCIATION_TEST_1 =
      ArrivalDaoAndChannelAssociation.create(
          ARRIVAL_TEST_1, ARRIVAL_CHANNEL, ARRIVAL_CHANNEL_SEGMENT);
  public static final ArrivalDaoAndChannelAssociation ARRIVAL_ASSOCIATION_TEST_3 =
      ArrivalDaoAndChannelAssociation.create(
          ARRIVAL_TEST_3, ARRIVAL_CHANNEL, ARRIVAL_CHANNEL_SEGMENT);
  public static final AmplitudeDaoAndChannelAssociation AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2 =
      AmplitudeDaoAndChannelAssociation.create(
          AMPLITUDE_DAO, ARRIVAL_CHANNEL, ARRIVAL_CHANNEL_SEGMENT);
  public static final AmplitudeDaoAndChannelAssociation AMPLITUDE_ASSOCIATION_AMPTYPE_SBSNR =
      AmplitudeDaoAndChannelAssociation.create(
          AMPLITUDE_DAO_AMPTYPE_SBSNR, ARRIVAL_CHANNEL, ARRIVAL_CHANNEL_SEGMENT);

  public static final AccountValue SIGNAL_DETECTION_HYPOTHESIS_ARRIVAL_ID_COMPONENTS_1 =
      AccountValue.create(WORKFLOW_DEFINITION_ID1.getName(), ARRIVAL_1.getId());
  public static final AccountValue SIGNAL_DETECTION_HYPOTHESIS_ARRIVAL_ID_COMPONENTS_3 =
      AccountValue.create(WORKFLOW_DEFINITION_ID1.getName(), ARRIVAL_3.getId());

  public static final WaveformAndFilterDefinition ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION =
      WaveformAndFilterDefinition.builder()
          .setWaveform(ARRIVAL_CHANNEL_SEGMENT)
          .setFilterDefinitionUsage(FilterDefinitionUsage.FK)
          .build();

  public static final WaveformAndFilterDefinition
      AMPLITUDE_ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION =
          WaveformAndFilterDefinition.builder()
              .setWaveform(AMPLITUDE_CHANNEL_SEGMENT)
              .setFilterDefinitionUsage(FilterDefinitionUsage.FK)
              .build();
}
