package gms.shared.signaldetection.converter.detection;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.AMPLITUDE_DAO;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.DETECTION_FROM_ARRIVAL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.DETECTION_FROM_ARRIVAL_NO_HYPOTHESES;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.DETECTION_FROM_BOTH_ARRIVALS;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.DETECTION_FROM_PREVIOUS_STAGE;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.HYPOTHESIS_FROM_ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.HYPOTHESIS_FROM_ASSOC_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.HYPOTHESIS_FROM_ASSOC_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MONITORING_ORG;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.signaldetection.repository.utils.SignalDetectionComponents;
import gms.shared.signaldetection.repository.utils.SignalDetectionIdUtility;
import gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SignalDetectionConverterTest {

  private static final WorkflowDefinitionId stage1Id = WorkflowDefinitionId.from(STAGE_1);
  private static final WorkflowDefinitionId stage2Id = WorkflowDefinitionId.from(STAGE_2);
  private static final WorkflowDefinitionId stage3Id = WorkflowDefinitionId.from(STAGE_3);
  private static final List<WorkflowDefinitionId> orderedStages = List.of(stage1Id, stage2Id);
  private static final Map<WorkflowDefinitionId, String> dbAccountStageMap =
      Map.of(stage1Id, stage1Id.getName(), stage2Id, stage2Id.getName());

  @Mock private SignalDetectionHypothesisConverter signalDetectionHypothesisConverter;

  @Mock private SignalDetectionIdUtility signalDetectionIdUtility;

  private SignalDetectionConverter converter;

  @BeforeEach
  void setup() {
    converter =
        SignalDetectionConverter.create(
            signalDetectionHypothesisConverter,
            signalDetectionIdUtility,
            orderedStages,
            dbAccountStageMap);
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(
      SignalDetectionHypothesisConverter signalDetectionHypothesisConverter,
      SignalDetectionIdUtility signalDetectionIdUtility,
      List<WorkflowDefinitionId> orderedStages) {
    assertThrows(
        NullPointerException.class,
        () ->
            SignalDetectionConverter.create(
                signalDetectionHypothesisConverter,
                signalDetectionIdUtility,
                orderedStages,
                dbAccountStageMap));
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
        arguments(null, mock(SignalDetectionIdUtility.class), orderedStages),
        arguments(mock(SignalDetectionHypothesisConverter.class), null, orderedStages),
        arguments(
            mock(SignalDetectionHypothesisConverter.class),
            mock(SignalDetectionIdUtility.class),
            null));
  }

  @Test
  void testCreate() {
    SignalDetectionConverter converter =
        Assertions.assertDoesNotThrow(
            () ->
                SignalDetectionConverter.create(
                    signalDetectionHypothesisConverter,
                    signalDetectionIdUtility,
                    orderedStages,
                    dbAccountStageMap));
    assertNotNull(converter);
  }

  @ParameterizedTest
  @MethodSource("getConvertValidationArguments")
  void testConvertValidation(
      Class<? extends Exception> expectedException,
      SignalDetectionComponents signalDetectionComponents) {

    assertThrows(expectedException, () -> converter.convert(signalDetectionComponents));
  }

  static Stream<Arguments> getConvertValidationArguments() {
    return Stream.of(arguments(NullPointerException.class, null));
  }

  @Test
  void testConverterEmptyStageArrivals() {

    when(signalDetectionIdUtility.getOrCreateSignalDetectionIdfromArid(ARRIVAL_1.getId()))
        .thenReturn(DETECTION_FROM_ARRIVAL_NO_HYPOTHESES.getId());

    SignalDetectionComponents signalDetectionComponents =
        SignalDetectionComponents.builder()
            .setCurrentStage(stage3Id)
            .setPreviousStage(Optional.empty())
            .setCurrentArrival(ARRIVAL_1)
            .setPreviousArrival(Optional.empty())
            .setCurrentAssocs(List.of())
            .setPreviousAssocs(List.of())
            .setAmplitudeDaos(List.of(AMPLITUDE_DAO))
            .setStation(STATION)
            .setMonitoringOrganization(MONITORING_ORG)
            .build();

    Optional<SignalDetection> actual = converter.convert(signalDetectionComponents);

    assertTrue(actual.isPresent());
    assertEquals(DETECTION_FROM_ARRIVAL_NO_HYPOTHESES, actual.get());
  }

  @ParameterizedTest
  @MethodSource("getConvertArguments")
  void testConvert(
      SignalDetection expected,
      Consumer<SignalDetectionHypothesisConverter> setupMocks,
      Consumer<SignalDetectionHypothesisConverter> verifyMocks,
      Consumer<SignalDetectionIdUtility> sdiuMocks,
      SignalDetectionComponents signalDetectionComponents) {

    setupMocks.accept(signalDetectionHypothesisConverter);
    sdiuMocks.accept(signalDetectionIdUtility);

    Optional<SignalDetection> actual = converter.convert(signalDetectionComponents);

    assertTrue(actual.isPresent());
    assertEquals(expected, actual.get());

    verifyMocks.accept(signalDetectionHypothesisConverter);
  }

  static Stream<Arguments> getConvertArguments() {

    long arid = 32;
    long orid = 23;
    Pair<ArrivalDao, AssocDao> arrivalAssocPair =
        SignalDetectionDaoTestFixtures.getArrivalAssocPair(arid, orid);

    Consumer<SignalDetectionHypothesisConverter> singleArrivalSetup =
        sdhConverter ->
            when(sdhConverter.convertToEntityReference(
                    stage1Id.getName(), DETECTION_FROM_ARRIVAL.getId(), ARRIVAL_1))
                .thenReturn(Optional.ofNullable(HYPOTHESIS_FROM_ARRIVAL_1));

    Consumer<SignalDetectionHypothesisConverter> singleArrivalVerification =
        sdhConverter -> {
          verify(sdhConverter)
              .convertToEntityReference(
                  stage1Id.getName(), DETECTION_FROM_ARRIVAL.getId(), ARRIVAL_1);
          verifyNoMoreInteractions(sdhConverter);
        };

    Consumer<SignalDetectionIdUtility> idUtilityConsumer1 =
        idUtility ->
            when(idUtility.getOrCreateSignalDetectionIdfromArid(ARRIVAL_1.getId()))
                .thenReturn(DETECTION_FROM_ARRIVAL.getId());

    Consumer<SignalDetectionHypothesisConverter> twoArrivalSetup =
        sdhConverter -> {
          when(sdhConverter.convertToEntityReference(
                  stage1Id.getName(), DETECTION_FROM_BOTH_ARRIVALS.getId(), ARRIVAL_1))
              .thenReturn(Optional.ofNullable(HYPOTHESIS_FROM_ARRIVAL_1));
        };

    Consumer<SignalDetectionHypothesisConverter> twoArrivalVerification =
        sdhConverter -> {
          verify(sdhConverter)
              .convertToEntityReference(
                  stage1Id.getName(), DETECTION_FROM_BOTH_ARRIVALS.getId(), ARRIVAL_1);
          verifyNoMoreInteractions(sdhConverter);
        };

    Consumer<SignalDetectionIdUtility> idUtilityConsumer2 =
        idUtility ->
            when(idUtility.getOrCreateSignalDetectionIdfromArid(ARRIVAL_1.getId()))
                .thenReturn(DETECTION_FROM_BOTH_ARRIVALS.getId());

    Consumer<SignalDetectionHypothesisConverter> previousArrivalSetup =
        sdhConverter -> {
          when(sdhConverter.convertToEntityReference(
                  stage1Id.getName(),
                  DETECTION_FROM_PREVIOUS_STAGE.getId(),
                  arrivalAssocPair.getLeft(),
                  arrivalAssocPair.getRight()))
              .thenReturn(Optional.ofNullable(HYPOTHESIS_FROM_ASSOC_1));

          when(sdhConverter.convertToEntityReference(
                  stage2Id.getName(),
                  DETECTION_FROM_PREVIOUS_STAGE.getId(),
                  arrivalAssocPair.getLeft(),
                  arrivalAssocPair.getRight()))
              .thenReturn(Optional.ofNullable(HYPOTHESIS_FROM_ASSOC_2));

          when(sdhConverter.convertToEntityReference(
                  stage1Id.getName(),
                  DETECTION_FROM_PREVIOUS_STAGE.getId(),
                  arrivalAssocPair.getLeft()))
              .thenReturn(Optional.ofNullable(HYPOTHESIS_FROM_ARRIVAL_1));
        };

    Consumer<SignalDetectionHypothesisConverter> previousVerification =
        sdhConverter -> {
          verify(sdhConverter)
              .convertToEntityReference(
                  stage1Id.getName(),
                  DETECTION_FROM_PREVIOUS_STAGE.getId(),
                  arrivalAssocPair.getLeft(),
                  arrivalAssocPair.getRight());

          verify(sdhConverter)
              .convertToEntityReference(
                  stage2Id.getName(),
                  DETECTION_FROM_PREVIOUS_STAGE.getId(),
                  arrivalAssocPair.getLeft(),
                  arrivalAssocPair.getRight());

          verify(sdhConverter)
              .convertToEntityReference(
                  stage1Id.getName(),
                  DETECTION_FROM_PREVIOUS_STAGE.getId(),
                  arrivalAssocPair.getLeft());

          verifyNoMoreInteractions(sdhConverter);
        };

    Consumer<SignalDetectionIdUtility> idUtilityConsumer3 =
        idUtility ->
            when(idUtility.getOrCreateSignalDetectionIdfromArid(arrivalAssocPair.getLeft().getId()))
                .thenReturn(DETECTION_FROM_PREVIOUS_STAGE.getId());

    return Stream.of(
        arguments(
            DETECTION_FROM_ARRIVAL,
            singleArrivalSetup,
            singleArrivalVerification,
            idUtilityConsumer1,
            SignalDetectionComponents.builder()
                .setCurrentStage(stage1Id)
                .setPreviousStage(Optional.empty())
                .setCurrentArrival(ARRIVAL_1)
                .setPreviousArrival(Optional.empty())
                .setCurrentAssocs(List.of())
                .setPreviousAssocs(List.of())
                .setAmplitudeDaos(List.of(AMPLITUDE_DAO))
                .setStation(STATION)
                .setMonitoringOrganization(MONITORING_ORG)
                .build()),
        arguments(
            DETECTION_FROM_ARRIVAL,
            twoArrivalSetup,
            twoArrivalVerification,
            idUtilityConsumer2,
            SignalDetectionComponents.builder()
                .setCurrentStage(stage1Id)
                .setPreviousStage(Optional.empty())
                .setCurrentArrival(ARRIVAL_1)
                .setPreviousArrival(Optional.of(ARRIVAL_1))
                .setCurrentAssocs(List.of())
                .setPreviousAssocs(List.of())
                .setAmplitudeDaos(List.of(AMPLITUDE_DAO))
                .setStation(STATION)
                .setMonitoringOrganization(MONITORING_ORG)
                .build()),
        arguments(
            DETECTION_FROM_PREVIOUS_STAGE,
            previousArrivalSetup,
            previousVerification,
            idUtilityConsumer3,
            SignalDetectionComponents.builder()
                .setCurrentStage(stage2Id)
                .setPreviousStage(Optional.of(stage1Id))
                .setCurrentArrival(arrivalAssocPair.getLeft())
                .setPreviousArrival(Optional.of(arrivalAssocPair.getLeft()))
                .setCurrentAssocs(List.of(arrivalAssocPair.getRight()))
                .setPreviousAssocs(List.of(arrivalAssocPair.getRight()))
                .setAmplitudeDaos(List.of(AMPLITUDE_DAO))
                .setStation(STATION)
                .setMonitoringOrganization(MONITORING_ORG)
                .build()));
  }
}
