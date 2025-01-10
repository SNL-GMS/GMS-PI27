package gms.shared.signaldetection.converter.detection;

import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.AMPLITUDE_ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.AMPLITUDE_ASSOCIATION_AMPTYPE_SBSNR;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.AMPLITUDE_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.ARRIVAL_ASSOCIATION_1;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.ARRIVAL_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.PHASE_MEASUREMENT_SPEC;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ASSOC_DAO_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_CHANNEL_SEGMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MONITORING_ORG;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_0;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_A5;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.converterId;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisConverterId;
import gms.shared.signaldetection.coi.detection.WaveformAndFilterDefinition;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.signaldetection.repository.utils.AmplitudeDaoAndChannelAssociation;
import gms.shared.signaldetection.repository.utils.ArrivalDaoAndChannelAssociation;
import gms.shared.signaldetection.repository.utils.SignalDetectionIdUtility;
import gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SignalDetectionHypothesisConverterTest {

  private static final WorkflowDefinitionId stage1Id = WorkflowDefinitionId.from(STAGE_1);

  @Mock private FeatureMeasurementConverter featureMeasurementConverter;

  @Mock private SignalDetectionIdUtility signalDetectionIdUtility;

  private SignalDetectionHypothesisConverter converter;

  @BeforeEach
  void setup() {
    converter =
        new SignalDetectionHypothesisConverter(
            featureMeasurementConverter, signalDetectionIdUtility);
  }

  @ParameterizedTest
  @MethodSource("getConvertToEntityReferenceValidationArgumentsWithAssocDao")
  void testConvertToEntityReferenceValidationWithAssocDao(
      Class<? extends Exception> expectedException,
      WorkflowDefinitionId stageId,
      UUID detectionId,
      ArrivalDao arrivalDao,
      AssocDao assocDao) {

    assertThrows(
        expectedException,
        () ->
            converter.convertToEntityReference(
                stageId.getName(), detectionId, arrivalDao, assocDao));
  }

  @ParameterizedTest
  @MethodSource("getConvertToEntityReferenceValidationArgumentsNoAssocDao")
  void testConvertToEntityReferenceValidationNoAssocDao(
      Class<? extends Exception> expectedException,
      WorkflowDefinitionId stageId,
      UUID detectionId,
      ArrivalDao arrivalDao) {

    assertThrows(
        expectedException,
        () -> converter.convertToEntityReference(stageId.getName(), detectionId, arrivalDao));
  }

  @ParameterizedTest
  @MethodSource("getConvertValidationArguments")
  void testConvertValidation(
      Class<? extends Exception> expectedException,
      SignalDetectionHypothesisConverterId converterId,
      Pair<ArrivalDaoAndChannelAssociation, WaveformAndFilterDefinition> arrivalAssociationAndWF,
      Optional<AssocDao> assocDao,
      String monitoringOrganization,
      Station station,
      Collection<AmplitudeDaoAndChannelAssociation> amplitudeAssociations,
      Map<Long, WaveformAndFilterDefinition> analysisWaveformsForAmpids) {

    assertThrows(
        expectedException,
        () ->
            converter.convert(
                converterId,
                arrivalAssociationAndWF,
                assocDao,
                monitoringOrganization,
                station,
                amplitudeAssociations,
                analysisWaveformsForAmpids));
  }

  static Stream<Arguments> getConvertToEntityReferenceValidationArgumentsWithAssocDao() {
    return Stream.of(
        arguments(
            IllegalStateException.class,
            stage1Id,
            UUID.fromString("00000000-111-0000-0000-000000000001"),
            ARRIVAL_1,
            ASSOC_DAO_1));
  }

  static Stream<Arguments> getConvertToEntityReferenceValidationArgumentsNoAssocDao() {
    return Stream.of(
        arguments(
            NullPointerException.class,
            null,
            UUID.fromString("00000000-222-0000-0000-000000000002"),
            ARRIVAL_1),
        arguments(NullPointerException.class, stage1Id, null, ARRIVAL_1),
        arguments(
            NullPointerException.class,
            stage1Id,
            UUID.fromString("00000000-333-0000-0000-000000000003"),
            null));
  }

  static Stream<Arguments> getConvertValidationArguments() {

    Map<Long, WaveformAndFilterDefinition> analysisWaveformsForAmpids =
        Map.of(
            AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2.getAmplitudeDao().getId(),
            AMPLITUDE_ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION);

    return Stream.of(
        arguments(
            NullPointerException.class,
            null,
            Pair.of(ARRIVAL_ASSOCIATION_1, ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
            Optional.of(ASSOC_DAO_1),
            MONITORING_ORG,
            STATION,
            List.of(AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2),
            analysisWaveformsForAmpids),
        arguments(
            NullPointerException.class,
            converterId,
            Pair.of(null, ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
            Optional.of(ASSOC_DAO_1),
            MONITORING_ORG,
            STATION,
            List.of(AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2),
            analysisWaveformsForAmpids),
        arguments(
            NullPointerException.class,
            converterId,
            Pair.of(ARRIVAL_ASSOCIATION_1, ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
            null,
            MONITORING_ORG,
            STATION,
            List.of(AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2),
            analysisWaveformsForAmpids),
        arguments(
            IllegalStateException.class,
            converterId,
            Pair.of(ARRIVAL_ASSOCIATION_1, ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
            Optional.of(ASSOC_DAO_1),
            null,
            STATION,
            List.of(AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2),
            analysisWaveformsForAmpids),
        arguments(
            NullPointerException.class,
            converterId,
            Pair.of(ARRIVAL_ASSOCIATION_1, ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
            Optional.of(ASSOC_DAO_1),
            MONITORING_ORG,
            null,
            List.of(AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2),
            analysisWaveformsForAmpids),
        arguments(
            NullPointerException.class,
            converterId,
            Pair.of(ARRIVAL_ASSOCIATION_1, ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
            Optional.of(ASSOC_DAO_1),
            MONITORING_ORG,
            STATION,
            null,
            analysisWaveformsForAmpids),
        arguments(
            NullPointerException.class,
            converterId,
            Pair.of(ARRIVAL_ASSOCIATION_1, null),
            Optional.of(ASSOC_DAO_1),
            MONITORING_ORG,
            STATION,
            List.of(AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2),
            null));
  }

  @ParameterizedTest
  @MethodSource("getConvertReferenceArgumentsWithAssocDao")
  void testConvertToEntityReferenceArgumentsWithAssocDao(
      SignalDetectionHypothesis expected,
      Consumer<SignalDetectionIdUtility> sdiuMock,
      WorkflowDefinitionId stageId,
      UUID detectionId,
      ArrivalDao arrivalDao,
      AssocDao assocDao) {

    sdiuMock.accept(signalDetectionIdUtility);

    Optional<SignalDetectionHypothesis> actual =
        converter.convertToEntityReference(stageId.getName(), detectionId, arrivalDao, assocDao);

    assertTrue(actual.isPresent());
    assertEquals(SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE, actual.get());
  }

  @ParameterizedTest
  @MethodSource("getConvertReferenceArgumentsNoAssocDao")
  void testConvertToEntityReferenceArgumentsNoAssocDao(
      SignalDetectionHypothesis expected,
      Consumer<SignalDetectionIdUtility> sdiuMock,
      WorkflowDefinitionId stageId,
      UUID detectionId,
      ArrivalDao arrivalDao) {

    sdiuMock.accept(signalDetectionIdUtility);

    Optional<SignalDetectionHypothesis> actual =
        converter.convertToEntityReference(stageId.getName(), detectionId, arrivalDao);

    assertTrue(actual.isPresent());
    assertEquals(SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE, actual.get());
  }

  static Stream<Arguments> getConvertReferenceArgumentsWithAssocDao() {

    long arid = 234;
    long orid = 932;
    Pair<ArrivalDao, AssocDao> arrivalAssocPair =
        SignalDetectionDaoTestFixtures.getArrivalAssocPair(arid, orid);

    Consumer<SignalDetectionIdUtility> signalDetectionIdUtilityConsumer2 =
        sdiu -> {
          when(sdiu.getOrCreateSignalDetectionHypothesisIdFromAridOridAndStageId(
                  arid, orid, stage1Id.getName()))
              .thenReturn(SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE.getId().getId());
        };

    return Stream.of(
        arguments(
            SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE,
            signalDetectionIdUtilityConsumer2,
            stage1Id,
            SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE.getId().getSignalDetectionId(),
            arrivalAssocPair.getLeft(),
            arrivalAssocPair.getRight()));
  }

  static Stream<Arguments> getConvertReferenceArgumentsNoAssocDao() {

    long arid = 234;
    long orid = 932;
    Pair<ArrivalDao, AssocDao> arrivalAssocPair =
        SignalDetectionDaoTestFixtures.getArrivalAssocPair(arid, orid);

    Consumer<SignalDetectionIdUtility> signalDetectionIdUtilityConsumer1 =
        sdiu -> {
          when(sdiu.getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(
                  ARRIVAL_1.getId(), stage1Id.getName()))
              .thenReturn(SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE.getId().getId());
        };

    return Stream.of(
        arguments(
            SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE,
            signalDetectionIdUtilityConsumer1,
            stage1Id,
            SIGNAL_DETECTION_HYPOTHESIS_ENTITY_REFERENCE.getId().getSignalDetectionId(),
            ARRIVAL_1));
  }

  @ParameterizedTest
  @MethodSource("getConvertArguments")
  void testConvert(
      SignalDetectionHypothesis expected,
      List<Consumer<FeatureMeasurementConverter>> setupMocks,
      Consumer<SignalDetectionIdUtility> sdiuMock,
      SignalDetectionHypothesisConverterId converterId,
      Pair<ArrivalDaoAndChannelAssociation, WaveformAndFilterDefinition> arrivalAssociationAndWF,
      Optional<AssocDao> assocDao,
      String monitoringOrganization,
      Station station,
      Collection<AmplitudeDaoAndChannelAssociation> amplitudeAssociations,
      Map<Long, WaveformAndFilterDefinition> analysisWaveformsForAmpids) {

    setupMocks.forEach(mock -> mock.accept(featureMeasurementConverter));

    sdiuMock.accept(signalDetectionIdUtility);

    Optional<SignalDetectionHypothesis> actual =
        converter.convert(
            converterId,
            arrivalAssociationAndWF,
            assocDao,
            monitoringOrganization,
            station,
            amplitudeAssociations,
            analysisWaveformsForAmpids);

    assertTrue(actual.isPresent());
    assertEquals(expected, actual.get());
  }

  static Stream<Arguments> getConvertArguments() {

    long arid = 44;
    long orid = 25;
    Pair<ArrivalDao, AssocDao> arrivalAssocPair =
        SignalDetectionDaoTestFixtures.getArrivalAssocPair(arid, orid);
    var arrivalAssociation =
        ArrivalDaoAndChannelAssociation.create(
            arrivalAssocPair.getLeft(), ARRIVAL_CHANNEL, ARRIVAL_CHANNEL_SEGMENT);

    Map<Long, WaveformAndFilterDefinition> analysisWaveformsForAmpids =
        Map.of(
            AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2.getAmplitudeDao().getId(),
            AMPLITUDE_ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION);

    // ArrivalTime FeatureMeasurement createMeasurementValueSpec setup
    Consumer<FeatureMeasurementConverter> arrivalSpecSetup =
        fmConverter ->
            when(fmConverter.createMeasurementValueSpec(
                    FeatureMeasurementTypes.ARRIVAL_TIME,
                    ARRIVAL_1,
                    Optional.empty(),
                    Optional.empty()))
                .thenReturn(Stream.of(ARRIVAL_MEASUREMENT_SPEC));

    Consumer<FeatureMeasurementConverter> arrivalSpecSetup2 =
        fmConverter ->
            when(fmConverter.createMeasurementValueSpec(
                    FeatureMeasurementTypes.ARRIVAL_TIME,
                    arrivalAssocPair.getLeft(),
                    Optional.of(arrivalAssocPair.getRight()),
                    Optional.empty()))
                .thenReturn(Stream.of(ARRIVAL_MEASUREMENT_SPEC));

    // Phase FeatureMeasurement createMeasurementValueSpec setup
    Consumer<FeatureMeasurementConverter> phaseSpecSetup =
        fmConverter ->
            when(fmConverter.createMeasurementValueSpec(
                    FeatureMeasurementTypes.PHASE, ARRIVAL_1, Optional.empty(), Optional.empty()))
                .thenReturn(Stream.of(PHASE_MEASUREMENT_SPEC));

    Consumer<FeatureMeasurementConverter> phaseSpecSetup2 =
        fmConverter ->
            when(fmConverter.createMeasurementValueSpec(
                    FeatureMeasurementTypes.PHASE,
                    arrivalAssocPair.getLeft(),
                    Optional.of(arrivalAssocPair.getRight()),
                    Optional.empty()))
                .thenReturn(Stream.of(PHASE_MEASUREMENT_SPEC));

    // AMPLITUDE_A5_OVER_2 FeatureMeasurement createMeasurementValueSpec setup
    Consumer<FeatureMeasurementConverter> amplitudeA5SpecSetup =
        fmConverter ->
            when(fmConverter.createMeasurementValueSpec(any(), any(), any(), any()))
                .thenAnswer(
                    input -> {
                      if (input
                          .getArgument(0)
                          .equals(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2)) {
                        return Stream.of(AMPLITUDE_MEASUREMENT_SPEC);
                      } else if (input
                          .getArgument(0)
                          .equals(FeatureMeasurementTypes.ARRIVAL_TIME)) {
                        return Stream.of(ARRIVAL_MEASUREMENT_SPEC);
                      } else if (input.getArgument(0).equals(FeatureMeasurementTypes.PHASE)) {
                        return Stream.of(PHASE_MEASUREMENT_SPEC);
                      } else {
                        return Stream.of();
                      }
                    });

    // ArrivalTime FeatureMeasurement converter setup
    Consumer<FeatureMeasurementConverter> singleArrivalSetup =
        fmConverter ->
            when(fmConverter.convert(
                    ARRIVAL_MEASUREMENT_SPEC,
                    ARRIVAL_CHANNEL,
                    ARRIVAL_CHANNEL_SEGMENT,
                    DoubleValue.from(ARRIVAL_1.getSnr(), Optional.empty(), Units.DECIBELS),
                    ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION))
                .thenReturn(Optional.of(ARRIVAL_TIME_FEATURE_MEASUREMENT));

    Consumer<FeatureMeasurementConverter> singleArrivalSetup2 =
        fmConverter ->
            when(fmConverter.convert(
                    ARRIVAL_MEASUREMENT_SPEC,
                    ARRIVAL_CHANNEL,
                    ARRIVAL_CHANNEL_SEGMENT,
                    DoubleValue.from(
                        arrivalAssocPair.getLeft().getSnr(), Optional.empty(), Units.DECIBELS),
                    ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION))
                .thenReturn(Optional.of(ARRIVAL_TIME_FEATURE_MEASUREMENT));

    // Phase FeatureMeasurement converter setup
    Consumer<FeatureMeasurementConverter> singlePhaseSetup =
        fmConverter ->
            when(fmConverter.convert(
                    PHASE_MEASUREMENT_SPEC,
                    ARRIVAL_CHANNEL,
                    ARRIVAL_CHANNEL_SEGMENT,
                    ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION))
                .thenReturn(Optional.of(PHASE_FEATURE_MEASUREMENT));

    // AMPLITUDE_A5_OVER_2 FeatureMeasurement converter setup
    Consumer<FeatureMeasurementConverter> singleAmplitudeSetup =
        fmConverter ->
            when(fmConverter.convert(
                    AMPLITUDE_MEASUREMENT_SPEC,
                    ARRIVAL_CHANNEL,
                    ARRIVAL_CHANNEL_SEGMENT,
                    AMPLITUDE_ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION))
                .thenReturn(Optional.of(AMPLITUDE_FEATURE_MEASUREMENT));

    List<Consumer<FeatureMeasurementConverter>> fmSetupList =
        List.of(arrivalSpecSetup, phaseSpecSetup, singleArrivalSetup, singlePhaseSetup);

    List<Consumer<FeatureMeasurementConverter>> fmSetupList2 =
        List.of(arrivalSpecSetup2, phaseSpecSetup2, singleArrivalSetup2, singlePhaseSetup);

    List<Consumer<FeatureMeasurementConverter>> fmSetupList3 =
        List.of(amplitudeA5SpecSetup, singleAmplitudeSetup, singleArrivalSetup, singlePhaseSetup);

    Consumer<SignalDetectionIdUtility> signalDetectionIdUtilityConsumer1 =
        sdiu -> {
          when(sdiu.getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(
                  ARRIVAL_1.getId(), converterId.getLegacyDatabaseAccountId()))
              .thenReturn(SIGNAL_DETECTION_HYPOTHESIS_0.getId().getId());
        };

    Consumer<SignalDetectionIdUtility> signalDetectionIdUtilityConsumer2 =
        sdiu -> {
          when(sdiu.getOrCreateSignalDetectionHypothesisIdFromAridOridAndStageId(
                  arid, orid, stage1Id.getName()))
              .thenReturn(SIGNAL_DETECTION_HYPOTHESIS_0.getId().getId());
        };

    Consumer<SignalDetectionIdUtility> signalDetectionIdUtilityConsumer3 =
        sdiu -> {
          when(sdiu.getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(
                  ARRIVAL_1.getId(), converterId.getLegacyDatabaseAccountId()))
              .thenReturn(SIGNAL_DETECTION_HYPOTHESIS_A5.getId().getId());
        };

    return Stream.of(
        arguments(
            SIGNAL_DETECTION_HYPOTHESIS_0,
            fmSetupList,
            signalDetectionIdUtilityConsumer1,
            converterId,
            Pair.of(ARRIVAL_ASSOCIATION_1, ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
            Optional.empty(),
            MONITORING_ORG,
            STATION,
            List.of(),
            Map.of()),
        arguments(
            SIGNAL_DETECTION_HYPOTHESIS_0,
            fmSetupList2,
            signalDetectionIdUtilityConsumer2,
            converterId,
            Pair.of(arrivalAssociation, ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
            Optional.of(arrivalAssocPair.getRight()),
            MONITORING_ORG,
            STATION,
            List.of(),
            Map.of()),
        arguments(
            SIGNAL_DETECTION_HYPOTHESIS_A5,
            fmSetupList3,
            signalDetectionIdUtilityConsumer3,
            converterId,
            Pair.of(ARRIVAL_ASSOCIATION_1, ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
            Optional.empty(),
            MONITORING_ORG,
            STATION,
            List.of(AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2, AMPLITUDE_ASSOCIATION_AMPTYPE_SBSNR),
            analysisWaveformsForAmpids),
        arguments(
            SIGNAL_DETECTION_HYPOTHESIS_A5,
            fmSetupList3,
            signalDetectionIdUtilityConsumer3,
            converterId,
            Pair.of(ARRIVAL_ASSOCIATION_1, ANALYSIS_WAVEFORM_AND_FILTER_DEFINITION),
            Optional.empty(),
            MONITORING_ORG,
            STATION,
            List.of(AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2, AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2),
            analysisWaveformsForAmpids));
  }
}
