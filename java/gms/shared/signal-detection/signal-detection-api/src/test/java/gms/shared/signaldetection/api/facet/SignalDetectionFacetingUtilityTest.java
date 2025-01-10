package gms.shared.signaldetection.api.facet;

import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.DETECTION_FROM_ARRIVAL;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3B;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3B_ENTITY;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_WITH_MULTIPLE_PARENTS_POPULATED;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_WITH_MULTIPLE_PARENT_ENTITY_REFERENCES;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_WITH_PARENT_ENTITY_REFERENCE;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_WITH_PARENT_POPULATED;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_NO_HYPOTHESES;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.CHANNEL_SEGMENT;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import gms.shared.signaldetection.api.SignalDetectionAccessor;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.coi.detection.WaveformAndFilterDefinition;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import gms.shared.stationdefinition.facet.FacetingTypes;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import gms.shared.waveform.api.facet.WaveformFacetingUtility;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SignalDetectionFacetingUtilityTest {

  private static final FacetingDefinition channelFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
          .setPopulated(true)
          .addFacetingDefinitions(
              FacetingTypes.RESPONSE_TYPE.getValue(),
              FacetingDefinition.builder()
                  .setClassType(FacetingTypes.RESPONSE_TYPE.getValue())
                  .setPopulated(false)
                  .build())
          .build();

  private static final FacetingDefinition channelFacetingDefinitionEntity =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition channelSegmentFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
          .setPopulated(true)
          .addFacetingDefinitions(
              FacetingTypes.ID_CHANNEL_KEY.getValue(), channelFacetingDefinition)
          .build();

  private static final FacetingDefinition channelSegmentFacetingDefinitionEnt =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition stationFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.STATION_TYPE.getValue())
          .setPopulated(false)
          .build();

  private static final FacetingDefinition featureMeasurementFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType(FeatureMeasurement.class.getSimpleName())
          .setPopulated(true)
          .addFacetingDefinitions("channel", channelFacetingDefinition)
          .addFacetingDefinitions("measuredChannelSegment", channelSegmentFacetingDefinition)
          .addFacetingDefinitions(
              "analysisWaveformChannelSegment", channelSegmentFacetingDefinition)
          .build();

  private static final FacetingDefinition featureMeasurementFacetingDefinitionEntChannel =
      FacetingDefinition.builder()
          .setClassType(FeatureMeasurement.class.getSimpleName())
          .setPopulated(true)
          .addFacetingDefinitions("channel", channelFacetingDefinitionEntity)
          .addFacetingDefinitions("measuredChannelSegment", channelSegmentFacetingDefinitionEnt)
          .addFacetingDefinitions(
              "analysisWaveformChannelSegment", channelSegmentFacetingDefinitionEnt)
          .build();

  private static final FacetingDefinition parentSignalDetectionHypothesisFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType(SignalDetectionHypothesis.class.getSimpleName())
          .setPopulated(true)
          .addFacetingDefinitions("station", stationFacetingDefinition)
          .addFacetingDefinitions("featureMeasurements", featureMeasurementFacetingDefinition)
          .build();

  private static final FacetingDefinition signalDetectionHypothesisFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType(SignalDetectionHypothesis.class.getSimpleName())
          .setPopulated(true)
          .addFacetingDefinitions("station", stationFacetingDefinition)
          .addFacetingDefinitions("featureMeasurements", featureMeasurementFacetingDefinition)
          .build();

  private static final FacetingDefinition signalDetectionFacetingDefinition =
      FacetingDefinition.builder()
          .setClassType(SignalDetection.class.getSimpleName())
          .setPopulated(true)
          .addFacetingDefinitions("station", stationFacetingDefinition)
          .addFacetingDefinitions(
              "signalDetectionHypotheses", signalDetectionHypothesisFacetingDefinition)
          .build();

  private static final Instant effectiveTime = Instant.EPOCH;

  private static final SignalDetectionHypothesis unpopulatedHypothesis =
      SIGNAL_DETECTION_HYPOTHESIS.toEntityReference();
  private static final List<SignalDetectionHypothesisId> unpopulatedHypothesisId =
      List.of(unpopulatedHypothesis.getId());
  private static final SignalDetection unpopulatedDetection = SIGNAL_DETECTION.toEntityReference();
  private static final List<UUID> unpopulatedDetectionId = List.of(unpopulatedDetection.getId());
  private static final SignalDetectionHypothesis unpopulatedDetectionHypothesis =
      SIGNAL_DETECTION_HYPOTHESIS.toEntityReference();
  private static final List<SignalDetectionHypothesisId> unpopulatedDetectionHypothesisId =
      List.of(unpopulatedDetectionHypothesis.getId());

  private static Consumer<SignalDetectionAccessor> noOpAccessorSetup =
      signalDetectionAccessor -> {};
  private static Consumer<SignalDetectionAccessor> noOpAccessorVerifier =
      signalDetectionAccessorInterface -> {};
  private static final Consumer<WaveformFacetingUtility> noOpWaveformFacetingSetup =
      waveformFacetingUtility -> {};
  private static final Consumer<WaveformFacetingUtility> noOpWaveformFacetingVerifier =
      waveformFacetingUtility -> {};
  private static final Consumer<StationDefinitionFacetingUtility>
      noOpStationDefinitionFacetingSetup = stationDefinitionFacetingUtility -> {};
  private static final Consumer<StationDefinitionFacetingUtility>
      noOpStationDefinitionFacetingVerifier = stationDefinitionFacetingUtility -> {};

  private static final Consumer<WaveformFacetingUtility> facetWaveformSetup =
      waveformFacetingUtility -> {
        doReturn(CHANNEL_SEGMENT)
            .when(waveformFacetingUtility)
            .populateFacets(CHANNEL_SEGMENT, channelSegmentFacetingDefinition);
      };
  private static final Consumer<WaveformFacetingUtility> facetWaveformVerifier =
      waveformFacetingUtility ->
          verify(waveformFacetingUtility, times(2))
              .populateFacets(CHANNEL_SEGMENT, channelSegmentFacetingDefinition);

  private static final WorkflowDefinitionId stageId = WorkflowDefinitionId.from("test");

  @Mock private SignalDetectionAccessor signalDetectionAccessor;

  @Mock private WaveformFacetingUtility waveformFacetingUtility;

  @Mock private StationDefinitionFacetingUtility stationDefinitionFacetingUtility;

  private SignalDetectionFacetingUtility signalDetectionFacetingUtility;

  @BeforeEach
  void setup() {
    signalDetectionFacetingUtility =
        SignalDetectionFacetingUtility.create(
            signalDetectionAccessor, waveformFacetingUtility, stationDefinitionFacetingUtility);
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(
      Class<? extends Exception> expectedException,
      String expectedMessage,
      SignalDetectionAccessor signalDetectionAccessor,
      WaveformFacetingUtility waveformFacetingUtility,
      StationDefinitionFacetingUtility stationDefinitionFacetingUtility) {

    Exception exception =
        assertThrows(
            expectedException,
            () ->
                SignalDetectionFacetingUtility.create(
                    signalDetectionAccessor,
                    waveformFacetingUtility,
                    stationDefinitionFacetingUtility));
    assertEquals(expectedMessage, exception.getMessage());
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
        arguments(
            NullPointerException.class,
            "SignalDetectionAccessor cannot be null",
            null,
            mock(WaveformFacetingUtility.class),
            mock(StationDefinitionFacetingUtility.class)),
        arguments(
            NullPointerException.class,
            "WaveformFacetingUtility cannot be null",
            mock(SignalDetectionAccessor.class),
            null,
            mock(StationDefinitionFacetingUtility.class)),
        arguments(
            NullPointerException.class,
            "StationDefinitionFacetingUtility cannot be null",
            mock(SignalDetectionAccessor.class),
            mock(WaveformFacetingUtility.class),
            null));
  }

  @Test
  void testCreate() {
    SignalDetectionFacetingUtility signalDetectionFacetingUtility =
        assertDoesNotThrow(
            () ->
                SignalDetectionFacetingUtility.create(
                    signalDetectionAccessor,
                    waveformFacetingUtility,
                    stationDefinitionFacetingUtility));
    assertNotNull(signalDetectionFacetingUtility);
  }

  @ParameterizedTest
  @MethodSource("getPopulateFacetsSdAccessorArguments")
  void testPopulateFacetsSignalDetectionAccessor(
      Consumer<SignalDetectionAccessor> accessorMockSetup,
      SignalDetection initial,
      FacetingDefinition facetingDefinition,
      WorkflowDefinitionId stageId) {

    accessorMockSetup.accept(signalDetectionAccessor);
    assertNull(signalDetectionFacetingUtility.populateFacets(initial, facetingDefinition, stageId));
  }

  static Stream<Arguments> getPopulateFacetsSdAccessorArguments() {
    Consumer<SignalDetectionAccessor> noResultSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findByIds(unpopulatedDetectionId, stageId))
                .thenReturn(List.of());

    Consumer<SignalDetectionAccessor> multipleResultSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findByIds(unpopulatedDetectionId, stageId))
                .thenReturn(List.of(SIGNAL_DETECTION, DETECTION_FROM_ARRIVAL));

    Consumer<SignalDetectionAccessor> unpopulatedResultSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findByIds(unpopulatedDetectionId, stageId))
                .thenReturn(List.of(unpopulatedDetection));

    Consumer<SignalDetectionAccessor> emptyHypothesesSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findByIds(unpopulatedDetectionId, stageId))
                .thenReturn(List.of(SIGNAL_DETECTION_NO_HYPOTHESES));

    return Stream.of(
        arguments(
            unpopulatedResultSetup,
            unpopulatedDetection,
            signalDetectionFacetingDefinition,
            stageId),
        arguments(noResultSetup, unpopulatedDetection, signalDetectionFacetingDefinition, stageId),
        arguments(
            multipleResultSetup, unpopulatedDetection, signalDetectionFacetingDefinition, stageId),
        arguments(
            emptyHypothesesSetup,
            unpopulatedDetection,
            signalDetectionFacetingDefinition,
            stageId));
  }

  @ParameterizedTest
  @MethodSource("getPopulateFacetsValidationSdArguments")
  void testPopulateFacetsSdValidation(
      Class<? extends Exception> expectedException,
      String expectedMessage,
      Consumer<SignalDetectionAccessor> accessorMockSetup,
      SignalDetection initial,
      FacetingDefinition facetingDefinition,
      WorkflowDefinitionId stageId,
      Consumer<SignalDetectionAccessor> accessorMockVerifier) {

    accessorMockSetup.accept(signalDetectionAccessor);
    Exception exception =
        assertThrows(
            expectedException,
            () ->
                signalDetectionFacetingUtility.populateFacets(
                    initial, facetingDefinition, stageId));
    assertEquals(expectedMessage, exception.getMessage());
    accessorMockVerifier.accept(signalDetectionAccessor);
    verifyNoMoreInteractions(
        signalDetectionAccessor, waveformFacetingUtility, stationDefinitionFacetingUtility);
  }

  static Stream<Arguments> getPopulateFacetsValidationSdArguments() {
    Consumer<SignalDetectionAccessor> noResultSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findByIds(unpopulatedDetectionId, stageId))
                .thenReturn(List.of());
    Consumer<SignalDetectionAccessor> sdaVerifier =
        signalDetectionAccessor ->
            verify(signalDetectionAccessor).findByIds(unpopulatedDetectionId, stageId);

    Consumer<SignalDetectionAccessor> multipleResultSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findByIds(unpopulatedDetectionId, stageId))
                .thenReturn(List.of(SIGNAL_DETECTION, DETECTION_FROM_ARRIVAL));

    return Stream.of(
        arguments(
            NullPointerException.class,
            "Initial SignalDetection cannot be null",
            noOpAccessorSetup,
            null,
            signalDetectionFacetingDefinition,
            stageId,
            noOpAccessorVerifier),
        arguments(
            NullPointerException.class,
            "FacetingDefinition cannot be null",
            noOpAccessorSetup,
            SIGNAL_DETECTION,
            null,
            stageId,
            noOpAccessorVerifier),
        arguments(
            NullPointerException.class,
            "StageId cannot be null",
            noOpAccessorSetup,
            SIGNAL_DETECTION,
            signalDetectionFacetingDefinition,
            null,
            noOpAccessorVerifier),
        arguments(
            IllegalStateException.class,
            "FacetingDefinition must be present for SignalDetection",
            noOpAccessorSetup,
            SIGNAL_DETECTION,
            stationFacetingDefinition,
            stageId,
            noOpAccessorVerifier));
  }

  @ParameterizedTest
  @MethodSource("getPopulateFacetsSdArguments")
  void testPopulateFacetsSd(
      Consumer<SignalDetectionAccessor> accessorMockSetup,
      Consumer<WaveformFacetingUtility> waveformFacetingMockSetup,
      Consumer<StationDefinitionFacetingUtility> stationDefinitionFacetingMockSetup,
      SignalDetection initial,
      FacetingDefinition facetingDefinition,
      WorkflowDefinitionId stageId,
      SignalDetection expected,
      Consumer<SignalDetectionAccessor> accessorVerifier,
      Consumer<WaveformFacetingUtility> waveformFacetingVerifier,
      Consumer<StationDefinitionFacetingUtility> stationDefinitinFacetingVerifier) {

    accessorMockSetup.accept(signalDetectionAccessor);
    waveformFacetingMockSetup.accept(waveformFacetingUtility);
    stationDefinitionFacetingMockSetup.accept(stationDefinitionFacetingUtility);

    SignalDetection actual =
        signalDetectionFacetingUtility.populateFacets(initial, facetingDefinition, stageId);

    assertEquals(expected, actual);

    accessorVerifier.accept(signalDetectionAccessor);
    waveformFacetingVerifier.accept(waveformFacetingUtility);
    stationDefinitinFacetingVerifier.accept(stationDefinitionFacetingUtility);
    verifyNoMoreInteractions(
        signalDetectionAccessor, waveformFacetingUtility, stationDefinitionFacetingUtility);
  }

  static Stream<Arguments> getPopulateFacetsSdArguments() {
    FacetingDefinition unpopulatedSignalDetectionFacetingDefinition =
        signalDetectionFacetingDefinition.toBuilder()
            .setPopulated(false)
            .setFacetingDefinitions(Map.of())
            .build();

    Consumer<SignalDetectionAccessor> singleResultSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findByIds(unpopulatedDetectionId, stageId))
                .thenReturn(List.of(SIGNAL_DETECTION));
    Consumer<SignalDetectionAccessor> singleResultVerifier =
        signalDetectionAccessor ->
            verify(signalDetectionAccessor).findByIds(unpopulatedDetectionId, stageId);

    Consumer<StationDefinitionFacetingUtility> facetStationDefinitionSetup =
        stationDefinitionFacetingUtility -> {
          when(stationDefinitionFacetingUtility.populateFacets(
                  STATION, stationFacetingDefinition, effectiveTime))
              .thenReturn(STATION);
          when(stationDefinitionFacetingUtility.populateFacets(
                  CHANNEL, channelFacetingDefinition, effectiveTime))
              .thenReturn(CHANNEL);
        };
    Consumer<StationDefinitionFacetingUtility> facetStationDefinitionVerifier =
        stationDefinitionFacetingUtility -> {
          verify(stationDefinitionFacetingUtility, times(2))
              .populateFacets(STATION, stationFacetingDefinition, effectiveTime);
          verify(stationDefinitionFacetingUtility, times(2))
              .populateFacets(CHANNEL, channelFacetingDefinition, effectiveTime);
        };

    var SIGNAL_DETECTION_ENTITY_STATION =
        SIGNAL_DETECTION.toBuilder()
            .setData(
                SIGNAL_DETECTION.getData().get().toBuilder()
                    .setStation(SIGNAL_DETECTION.getData().get().getStation().toEntityReference())
                    .build())
            .build();

    return Stream.of(
        arguments(
            noOpAccessorSetup,
            noOpWaveformFacetingSetup,
            noOpStationDefinitionFacetingSetup,
            SIGNAL_DETECTION,
            unpopulatedSignalDetectionFacetingDefinition,
            stageId,
            unpopulatedDetection,
            noOpAccessorVerifier,
            noOpWaveformFacetingVerifier,
            noOpStationDefinitionFacetingVerifier),
        arguments(
            noOpAccessorSetup,
            noOpWaveformFacetingSetup,
            noOpStationDefinitionFacetingSetup,
            unpopulatedDetection,
            unpopulatedSignalDetectionFacetingDefinition,
            stageId,
            unpopulatedDetection,
            noOpAccessorVerifier,
            noOpWaveformFacetingVerifier,
            noOpStationDefinitionFacetingVerifier),
        arguments(
            noOpAccessorSetup,
            noOpWaveformFacetingSetup,
            noOpStationDefinitionFacetingSetup,
            unpopulatedDetection,
            unpopulatedSignalDetectionFacetingDefinition,
            stageId,
            unpopulatedDetection,
            noOpAccessorVerifier,
            noOpWaveformFacetingVerifier,
            noOpStationDefinitionFacetingVerifier),
        arguments(
            singleResultSetup,
            facetWaveformSetup,
            facetStationDefinitionSetup,
            unpopulatedDetection,
            signalDetectionFacetingDefinition,
            stageId,
            SIGNAL_DETECTION_ENTITY_STATION,
            singleResultVerifier,
            facetWaveformVerifier,
            facetStationDefinitionVerifier),
        arguments(
            noOpAccessorSetup,
            facetWaveformSetup,
            facetStationDefinitionSetup,
            SIGNAL_DETECTION,
            signalDetectionFacetingDefinition,
            stageId,
            SIGNAL_DETECTION_ENTITY_STATION,
            noOpAccessorVerifier,
            facetWaveformVerifier,
            facetStationDefinitionVerifier));
  }

  @ParameterizedTest
  @MethodSource("getPopulateFacetsSdNullArguments")
  void testPopulateFacetsSdNull(
      Consumer<SignalDetectionAccessor> accessorMockSetup,
      SignalDetection initial,
      FacetingDefinition facetingDefinition,
      WorkflowDefinitionId stageId,
      SignalDetection expected,
      Consumer<SignalDetectionAccessor> accessorVerifier) {

    accessorMockSetup.accept(signalDetectionAccessor);

    SignalDetection actual =
        signalDetectionFacetingUtility.populateFacets(initial, facetingDefinition, stageId);

    assertEquals(expected, actual);

    accessorVerifier.accept(signalDetectionAccessor);
  }

  static Stream<Arguments> getPopulateFacetsSdNullArguments() {

    FacetingDefinition nullStationDefinitionFacetingDefinition =
        FacetingDefinition.builder()
            .setClassType(SignalDetection.class.getSimpleName())
            .setPopulated(true)
            .addFacetingDefinitions(
                "signalDetectionHypotheses", signalDetectionHypothesisFacetingDefinition)
            .build();

    FacetingDefinition nullSignalDetectionFacetingDefinition =
        FacetingDefinition.builder()
            .setClassType(SignalDetection.class.getSimpleName())
            .setPopulated(true)
            .addFacetingDefinitions("station", stationFacetingDefinition)
            .build();

    FacetingDefinition signalDetectionHypothesisFacetingDefinitionEmpty =
        FacetingDefinition.builder()
            .setClassType(SignalDetectionHypothesis.class.getSimpleName())
            .setPopulated(false)
            .build();

    FacetingDefinition emptySignalDetectionHypothesisFacetingDefinition =
        FacetingDefinition.builder()
            .setClassType(SignalDetection.class.getSimpleName())
            .setPopulated(true)
            .addFacetingDefinitions("station", stationFacetingDefinition)
            .addFacetingDefinitions(
                "signalDetectionHypotheses", signalDetectionHypothesisFacetingDefinitionEmpty)
            .build();

    return Stream.of(
        arguments(
            noOpAccessorSetup,
            SIGNAL_DETECTION,
            nullStationDefinitionFacetingDefinition,
            stageId,
            null,
            noOpAccessorVerifier),
        arguments(
            noOpAccessorSetup,
            SIGNAL_DETECTION,
            nullSignalDetectionFacetingDefinition,
            stageId,
            null,
            noOpAccessorVerifier),
        arguments(
            noOpAccessorSetup,
            SIGNAL_DETECTION,
            emptySignalDetectionHypothesisFacetingDefinition,
            stageId,
            null,
            noOpAccessorVerifier));
  }

  @ParameterizedTest
  @MethodSource("getPopulateFacetsValidationSdhArguments")
  void testPopulateFacetsSdhValidation(
      Class<? extends Exception> expectedException,
      String expectedMessage,
      Consumer<SignalDetectionAccessor> accessorMockSetup,
      SignalDetectionHypothesis initial,
      FacetingDefinition facetingDefinition,
      Consumer<SignalDetectionAccessor> accessorMockVerifier) {

    accessorMockSetup.accept(signalDetectionAccessor);
    Exception exception =
        assertThrows(
            expectedException,
            () -> signalDetectionFacetingUtility.populateFacets(initial, facetingDefinition));
    assertEquals(expectedMessage, exception.getMessage());
    accessorMockVerifier.accept(signalDetectionAccessor);
    verifyNoMoreInteractions(
        signalDetectionAccessor, waveformFacetingUtility, stationDefinitionFacetingUtility);
  }

  static Stream<Arguments> getPopulateFacetsValidationSdhArguments() {

    return Stream.of(
        arguments(
            NullPointerException.class,
            "Initial SignalDetectionHypothesis cannot be null",
            noOpAccessorSetup,
            null,
            signalDetectionHypothesisFacetingDefinition,
            noOpAccessorVerifier),
        arguments(
            NullPointerException.class,
            "FacetingDefinition cannot be null",
            noOpAccessorSetup,
            SIGNAL_DETECTION_HYPOTHESIS,
            null,
            noOpAccessorVerifier),
        arguments(
            IllegalStateException.class,
            "FacetingDefinition must be present for SignalDetectionHypothesis",
            noOpAccessorSetup,
            SIGNAL_DETECTION_HYPOTHESIS,
            featureMeasurementFacetingDefinition,
            noOpAccessorVerifier));
  }

  @ParameterizedTest
  @MethodSource("getPopulateFacetsSdhAccessorArguments")
  void testPopulateFacetsSdhSignalDetectionAccessor(
      Consumer<SignalDetectionAccessor> accessorMockSetup,
      SignalDetectionHypothesis initial,
      FacetingDefinition facetingDefinition) {

    accessorMockSetup.accept(signalDetectionAccessor);
    assertNull(signalDetectionFacetingUtility.populateFacets(initial, facetingDefinition));
  }

  static Stream<Arguments> getPopulateFacetsSdhAccessorArguments() {
    Consumer<SignalDetectionAccessor> noResultSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findHypothesesByIds(unpopulatedDetectionHypothesisId))
                .thenReturn(List.of());

    Consumer<SignalDetectionAccessor> multipleResultSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findHypothesesByIds(unpopulatedDetectionHypothesisId))
                .thenReturn(List.of(SIGNAL_DETECTION_HYPOTHESIS, SIGNAL_DETECTION_HYPOTHESIS_2));

    Consumer<SignalDetectionAccessor> unpopulatedResultSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findHypothesesByIds(unpopulatedDetectionHypothesisId))
                .thenReturn(List.of(unpopulatedDetectionHypothesis));

    return Stream.of(
        arguments(
            unpopulatedResultSetup,
            unpopulatedDetectionHypothesis,
            signalDetectionHypothesisFacetingDefinition),
        arguments(
            noResultSetup,
            unpopulatedDetectionHypothesis,
            signalDetectionHypothesisFacetingDefinition),
        arguments(
            multipleResultSetup,
            unpopulatedDetectionHypothesis,
            signalDetectionHypothesisFacetingDefinition));
  }

  @ParameterizedTest
  @MethodSource("getPopulateFacetsSdhArguments")
  void testPopulateFacetsSignalDetectionHypothesis(
      Consumer<SignalDetectionAccessor> accessorMockSetup,
      Consumer<WaveformFacetingUtility> waveformFacetingMockSetup,
      Consumer<StationDefinitionFacetingUtility> stationDefinitionFacetingMockSetup,
      SignalDetectionHypothesis initial,
      FacetingDefinition facetingDefinition,
      SignalDetectionHypothesis expected,
      Consumer<SignalDetectionAccessor> accessorVerifier,
      Consumer<WaveformFacetingUtility> waveformFacetingVerifier,
      Consumer<StationDefinitionFacetingUtility> stationDefinitionFacetingVerifier) {

    accessorMockSetup.accept(signalDetectionAccessor);
    waveformFacetingMockSetup.accept(waveformFacetingUtility);
    stationDefinitionFacetingMockSetup.accept(stationDefinitionFacetingUtility);

    SignalDetectionHypothesis actual =
        signalDetectionFacetingUtility.populateFacets(initial, facetingDefinition);

    assertEquals(expected, actual);
    accessorVerifier.accept(signalDetectionAccessor);
    waveformFacetingVerifier.accept(waveformFacetingUtility);
    stationDefinitionFacetingVerifier.accept(stationDefinitionFacetingUtility);
    verifyNoMoreInteractions(
        signalDetectionAccessor, waveformFacetingUtility, stationDefinitionFacetingUtility);
  }

  static Stream<Arguments> getPopulateFacetsSdhArguments() {
    Consumer<SignalDetectionAccessor> singleResultSetup =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findHypothesesByIds(unpopulatedHypothesisId))
                .thenReturn(List.of(SIGNAL_DETECTION_HYPOTHESIS));
    Consumer<SignalDetectionAccessor> singleResultVerifier =
        signalDetectionAccessor ->
            verify(signalDetectionAccessor).findHypothesesByIds(unpopulatedHypothesisId);

    Consumer<StationDefinitionFacetingUtility> facetStationDefinitionSetup =
        stationDefinitionFacetingUtility -> {
          when(stationDefinitionFacetingUtility.populateFacets(
                  STATION, stationFacetingDefinition, effectiveTime))
              .thenReturn(STATION);
          when(stationDefinitionFacetingUtility.populateFacets(
                  CHANNEL, channelFacetingDefinition, effectiveTime))
              .thenReturn(CHANNEL);
        };
    Consumer<StationDefinitionFacetingUtility> facetStationDefinitionVerifier =
        stationDefinitionFacetingUtility -> {
          verify(stationDefinitionFacetingUtility)
              .populateFacets(STATION, stationFacetingDefinition, effectiveTime);
          verify(stationDefinitionFacetingUtility, times(2))
              .populateFacets(CHANNEL, channelFacetingDefinition, effectiveTime);
        };

    FacetingDefinition unpopulatedFacetingDefinition =
        signalDetectionHypothesisFacetingDefinition.toBuilder()
            .setPopulated(false)
            .setFacetingDefinitions(Map.of())
            .build();
    return Stream.of(
        arguments(
            noOpAccessorSetup,
            noOpWaveformFacetingSetup,
            noOpStationDefinitionFacetingSetup,
            SIGNAL_DETECTION_HYPOTHESIS,
            unpopulatedFacetingDefinition,
            unpopulatedHypothesis,
            noOpAccessorVerifier,
            noOpWaveformFacetingVerifier,
            noOpStationDefinitionFacetingVerifier),
        arguments(
            noOpAccessorSetup,
            noOpWaveformFacetingSetup,
            noOpStationDefinitionFacetingSetup,
            unpopulatedHypothesis,
            unpopulatedFacetingDefinition,
            unpopulatedHypothesis,
            noOpAccessorVerifier,
            noOpWaveformFacetingVerifier,
            noOpStationDefinitionFacetingVerifier),
        arguments(
            singleResultSetup,
            facetWaveformSetup,
            facetStationDefinitionSetup,
            unpopulatedHypothesis,
            signalDetectionHypothesisFacetingDefinition,
            SIGNAL_DETECTION_HYPOTHESIS,
            singleResultVerifier,
            facetWaveformVerifier,
            facetStationDefinitionVerifier),
        arguments(
            noOpAccessorSetup,
            facetWaveformSetup,
            facetStationDefinitionSetup,
            SIGNAL_DETECTION_HYPOTHESIS,
            signalDetectionHypothesisFacetingDefinition,
            SIGNAL_DETECTION_HYPOTHESIS,
            noOpAccessorVerifier,
            facetWaveformVerifier,
            facetStationDefinitionVerifier));
  }

  @ParameterizedTest
  @MethodSource("getPopulateFacetsGenerationalSdhArguments")
  void testPopulateFacetsGenerationalSignalDetectionHypothesis(
      Consumer<SignalDetectionAccessor> accessorMockSetup,
      Consumer<WaveformFacetingUtility> waveformFacetingMockSetup,
      Consumer<StationDefinitionFacetingUtility> stationDefinitionFacetingMockSetup,
      SignalDetectionHypothesis initial,
      FacetingDefinition facetingDefinition,
      SignalDetectionHypothesis expected,
      Consumer<SignalDetectionAccessor> accessorVerifier,
      BiConsumer<WaveformFacetingUtility, Integer> waveformFacetingVerifier,
      BiConsumer<StationDefinitionFacetingUtility, Integer> stationDefinitionFacetingVerifier,
      int wantedNumberOfInvocations) {

    accessorMockSetup.accept(signalDetectionAccessor);
    waveformFacetingMockSetup.accept(waveformFacetingUtility);
    stationDefinitionFacetingMockSetup.accept(stationDefinitionFacetingUtility);

    SignalDetectionHypothesis actual =
        signalDetectionFacetingUtility.populateFacets(initial, facetingDefinition);

    assertEquals(expected, actual);
    accessorVerifier.accept(signalDetectionAccessor);
    waveformFacetingVerifier.accept(waveformFacetingUtility, (wantedNumberOfInvocations * 2));
    stationDefinitionFacetingVerifier.accept(
        stationDefinitionFacetingUtility, wantedNumberOfInvocations);
    verifyNoMoreInteractions(
        signalDetectionAccessor, waveformFacetingUtility, stationDefinitionFacetingUtility);
  }

  static Stream<Arguments> getPopulateFacetsGenerationalSdhArguments() {

    Consumer<SignalDetectionAccessor> singleResultSetup0 =
        signalDetectionAccessor ->
            when(signalDetectionAccessor.findHypothesesByIds(anyList()))
                .thenAnswer(
                    invocation -> {
                      Object argument = invocation.getArguments()[0];
                      if (argument.equals(List.of(SIGNAL_DETECTION_HYPOTHESIS_ID))) {
                        return List.of(SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT);
                      } else if (argument.equals(List.of(SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_2))) {
                        return List.of(SIGNAL_DETECTION_HYPOTHESIS_WITH_PARENT_POPULATED);
                      } else if (argument.equals(List.of(SIGNAL_DETECTION_HYPOTHESIS_ID_STAGE_3))) {
                        return List.of(SIGNAL_DETECTION_HYPOTHESIS_WITH_MULTIPLE_PARENTS_POPULATED);
                      }
                      return List.of();
                    });

    Consumer<SignalDetectionAccessor> singleResultVerifier =
        signalDetectionAccessor ->
            verify(signalDetectionAccessor)
                .findHypothesesByIds(List.of(SIGNAL_DETECTION_HYPOTHESIS_ID));

    Consumer<StationDefinitionFacetingUtility> facetStationDefinitionSetup =
        stationDefinitionFacetingUtility -> {
          when(stationDefinitionFacetingUtility.populateFacets(
                  STATION, stationFacetingDefinition, effectiveTime))
              .thenReturn(STATION);
          when(stationDefinitionFacetingUtility.populateFacets(
                  CHANNEL, channelFacetingDefinition, effectiveTime))
              .thenReturn(CHANNEL);
        };

    BiConsumer<StationDefinitionFacetingUtility, Integer> facetStationDefinitionVerifier =
        (stationDefinitionFacetingUtility, wantedNumberOfInvocations) -> {
          verify(stationDefinitionFacetingUtility, times(wantedNumberOfInvocations))
              .populateFacets(STATION, stationFacetingDefinition, effectiveTime);
          verify(stationDefinitionFacetingUtility, times(wantedNumberOfInvocations * 2))
              .populateFacets(CHANNEL, channelFacetingDefinition, effectiveTime);
        };

    BiConsumer<WaveformFacetingUtility, Integer> facetWaveformVerifier =
        (waveformFacetingUtility, wantedNumberOfInvocations) ->
            verify(waveformFacetingUtility, times(wantedNumberOfInvocations))
                .populateFacets(CHANNEL_SEGMENT, channelSegmentFacetingDefinition);

    FacetingDefinition facetingDefinitionWithUnpopulatedParentDefinition =
        signalDetectionHypothesisFacetingDefinition.toBuilder()
            .addFacetingDefinitions(
                "parentSignalDetectionHypothesis",
                FacetingDefinition.builder()
                    .setClassType(SignalDetectionHypothesis.class.getSimpleName())
                    .setPopulated(false)
                    .setFacetingDefinitions(Map.of())
                    .build())
            .build();

    FacetingDefinition facetingDefinitionWithParentDefinition =
        signalDetectionHypothesisFacetingDefinition.toBuilder()
            .addFacetingDefinitions(
                "parentSignalDetectionHypothesis",
                signalDetectionHypothesisFacetingDefinition.toBuilder()
                    .addFacetingDefinitions(
                        "parentSignalDetectionHypothesis",
                        parentSignalDetectionHypothesisFacetingDefinition.toBuilder()
                            .addFacetingDefinitions(
                                "parentSignalDetectionHypothesis",
                                parentSignalDetectionHypothesisFacetingDefinition)
                            .build())
                    .build())
            .build();

    FacetingDefinition facetingDefinitionWithParentDefinitions =
        signalDetectionHypothesisFacetingDefinition.toBuilder()
            .addFacetingDefinitions(
                "parentSignalDetectionHypothesis",
                signalDetectionHypothesisFacetingDefinition.toBuilder()
                    .addFacetingDefinitions(
                        "parentSignalDetectionHypothesis",
                        parentSignalDetectionHypothesisFacetingDefinition.toBuilder()
                            .addFacetingDefinitions(
                                "parentSignalDetectionHypothesis",
                                parentSignalDetectionHypothesisFacetingDefinition.toBuilder()
                                    .addFacetingDefinitions(
                                        "parentSignalDetectionHypothesis",
                                        parentSignalDetectionHypothesisFacetingDefinition)
                                    .build())
                            .build())
                    .build())
            .build();

    return Stream.of(
        arguments(
            singleResultSetup0,
            facetWaveformSetup,
            facetStationDefinitionSetup,
            SIGNAL_DETECTION_HYPOTHESIS_WITH_MULTIPLE_PARENT_ENTITY_REFERENCES,
            facetingDefinitionWithParentDefinitions,
            SIGNAL_DETECTION_HYPOTHESIS_WITH_MULTIPLE_PARENTS_POPULATED,
            noOpAccessorVerifier,
            facetWaveformVerifier,
            facetStationDefinitionVerifier,
            3),
        arguments(
            noOpAccessorSetup,
            facetWaveformSetup,
            facetStationDefinitionSetup,
            SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3B,
            facetingDefinitionWithUnpopulatedParentDefinition,
            SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3B_ENTITY,
            noOpAccessorVerifier,
            facetWaveformVerifier,
            facetStationDefinitionVerifier,
            1),
        arguments(
            noOpAccessorSetup,
            facetWaveformSetup,
            facetStationDefinitionSetup,
            SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3B_ENTITY,
            signalDetectionHypothesisFacetingDefinition,
            SIGNAL_DETECTION_HYPOTHESIS_POPULATED_PARENT_3B_ENTITY,
            noOpAccessorVerifier,
            facetWaveformVerifier,
            facetStationDefinitionVerifier,
            1),
        arguments(
            noOpAccessorVerifier,
            facetWaveformSetup,
            facetStationDefinitionSetup,
            SIGNAL_DETECTION_HYPOTHESIS_WITH_PARENT_POPULATED,
            facetingDefinitionWithParentDefinition,
            SIGNAL_DETECTION_HYPOTHESIS_WITH_PARENT_POPULATED,
            noOpAccessorVerifier,
            facetWaveformVerifier,
            facetStationDefinitionVerifier,
            2),
        arguments(
            singleResultSetup0,
            facetWaveformSetup,
            facetStationDefinitionSetup,
            SIGNAL_DETECTION_HYPOTHESIS_WITH_PARENT_ENTITY_REFERENCE,
            facetingDefinitionWithParentDefinition,
            SIGNAL_DETECTION_HYPOTHESIS_WITH_PARENT_POPULATED,
            singleResultVerifier,
            facetWaveformVerifier,
            facetStationDefinitionVerifier,
            2));
  }

  @ParameterizedTest
  @MethodSource("getPopulateFacetsValidationFeatureMeasurementArguments")
  void testPopulateFacetsFeatureMeasurementValidation(
      Class<? extends Exception> expectedException,
      String expectedMessage,
      FeatureMeasurement<?> initial,
      FacetingDefinition facetingDefinition,
      Instant effectiveTime) {

    Exception exception =
        assertThrows(
            expectedException,
            () ->
                signalDetectionFacetingUtility.populateFacets(
                    initial, facetingDefinition, effectiveTime));
    assertEquals(expectedMessage, exception.getMessage());
  }

  static Stream<Arguments> getPopulateFacetsValidationFeatureMeasurementArguments() {
    return Stream.of(
        arguments(
            NullPointerException.class,
            "Initial FeatureMeasurement cannot be null",
            null,
            featureMeasurementFacetingDefinition,
            effectiveTime),
        arguments(
            NullPointerException.class,
            "FacetingDefinition cannot be null",
            PHASE_FEATURE_MEASUREMENT,
            null,
            effectiveTime),
        arguments(
            NullPointerException.class,
            "EffectiveTime cannot be null",
            PHASE_FEATURE_MEASUREMENT,
            featureMeasurementFacetingDefinition,
            null),
        arguments(
            IllegalStateException.class,
            "FacetingDefinition must be for FeatureMeasurement",
            PHASE_FEATURE_MEASUREMENT,
            channelFacetingDefinition,
            effectiveTime),
        arguments(
            IllegalStateException.class,
            "FeatureMeasurement parent must be populated",
            PHASE_FEATURE_MEASUREMENT,
            featureMeasurementFacetingDefinition.toBuilder()
                .setPopulated(false)
                .setFacetingDefinitions(Map.of())
                .build(),
            effectiveTime));
  }

  @Test
  void testPopulateFacetsFeatureMeasurement() {
    var filterDescription =
        LinearFilterDescription.from(
            Optional.empty(),
            Optional.empty(),
            true,
            FilterType.LINEAR,
            Optional.of(1.0),
            Optional.of(2.0),
            1,
            false,
            PassBandType.BAND_PASS,
            LinearFilterType.FIR_HAMMING,
            Optional.empty());

    var filterDefinition =
        FilterDefinition.from("MyFilter", Optional.of("Filter this!"), filterDescription);

    var analysisWaveform =
        WaveformAndFilterDefinition.builder()
            .setFilterDefinition(filterDefinition)
            .setWaveform(WaveformTestFixtures.singleStationEpochStart100RandomSamples())
            .setFilterDefinitionUsage(FilterDefinitionUsage.ONSET)
            .build();

    var fmWithAnalysisWaveform =
        PHASE_FEATURE_MEASUREMENT.toBuilder().setAnalysisWaveform(analysisWaveform).build();

    when(stationDefinitionFacetingUtility.populateFacets(
            fmWithAnalysisWaveform.getChannel(), channelFacetingDefinition, effectiveTime))
        .thenReturn(fmWithAnalysisWaveform.getChannel());

    doReturn(PHASE_FEATURE_MEASUREMENT.getMeasuredChannelSegment().orElseThrow())
        .when(waveformFacetingUtility)
        .populateFacets(
            fmWithAnalysisWaveform.getMeasuredChannelSegment().orElseThrow(),
            channelSegmentFacetingDefinition);

    FeatureMeasurement<?> faceted =
        signalDetectionFacetingUtility.populateFacets(
            fmWithAnalysisWaveform, featureMeasurementFacetingDefinition, effectiveTime);

    assertEquals(fmWithAnalysisWaveform, faceted);
    verify(stationDefinitionFacetingUtility)
        .populateFacets(
            fmWithAnalysisWaveform.getChannel(), channelFacetingDefinition, effectiveTime);
    verify(waveformFacetingUtility, times(2))
        .populateFacets(
            fmWithAnalysisWaveform.getMeasuredChannelSegment().orElseThrow(),
            channelSegmentFacetingDefinition);
    verifyNoMoreInteractions(stationDefinitionFacetingUtility, waveformFacetingUtility);
  }

  @Test
  void testPopulateFacetsFeatureMeasurementEnt() {
    var filterDescription =
        LinearFilterDescription.from(
            Optional.empty(),
            Optional.empty(),
            true,
            FilterType.LINEAR,
            Optional.of(1.0),
            Optional.of(2.0),
            1,
            false,
            PassBandType.BAND_PASS,
            LinearFilterType.FIR_HAMMING,
            Optional.empty());

    var filterDefinition =
        FilterDefinition.from("MyFilter", Optional.of("Filter this!"), filterDescription);

    var analysisWaveform =
        WaveformAndFilterDefinition.builder()
            .setFilterDefinition(filterDefinition)
            .setWaveform(WaveformTestFixtures.singleStationEpochStart100RandomSamples())
            .setFilterDefinitionUsage(FilterDefinitionUsage.ONSET)
            .build();

    var fmWithAnalysisWaveform =
        PHASE_FEATURE_MEASUREMENT.toBuilder().setAnalysisWaveform(analysisWaveform).build();

    var channelSegmentEntity =
        ChannelSegment.<Waveform>builder()
            .setId(fmWithAnalysisWaveform.getMeasuredChannelSegment().orElseThrow().getId())
            .build();

    var analysisWaveformEntity =
        analysisWaveform.toBuilder().setWaveform(channelSegmentEntity).build();

    var expectedFaceted =
        fmWithAnalysisWaveform.toBuilder()
            .setMeasuredChannelSegment(channelSegmentEntity)
            .setChannel(Channel.createEntityReference(CHANNEL))
            .setAnalysisWaveform(analysisWaveformEntity)
            .build();

    when(stationDefinitionFacetingUtility.populateFacets(
            fmWithAnalysisWaveform.getChannel(), channelFacetingDefinitionEntity, effectiveTime))
        .thenReturn(expectedFaceted.getChannel());

    doReturn(channelSegmentEntity)
        .when(waveformFacetingUtility)
        .populateFacets(
            PHASE_FEATURE_MEASUREMENT.getMeasuredChannelSegment().orElseThrow(),
            channelSegmentFacetingDefinitionEnt);

    FeatureMeasurement<?> faceted =
        signalDetectionFacetingUtility.populateFacets(
            fmWithAnalysisWaveform, featureMeasurementFacetingDefinitionEntChannel, effectiveTime);

    assertEquals(expectedFaceted, faceted);
    verify(stationDefinitionFacetingUtility)
        .populateFacets(
            PHASE_FEATURE_MEASUREMENT.getChannel(), channelFacetingDefinitionEntity, effectiveTime);
    verify(waveformFacetingUtility, times(2))
        .populateFacets(
            PHASE_FEATURE_MEASUREMENT.getMeasuredChannelSegment().orElseThrow(),
            channelSegmentFacetingDefinitionEnt);
    verifyNoMoreInteractions(stationDefinitionFacetingUtility, waveformFacetingUtility);
  }

  @Test
  void testPopulateFacetsNoMeasuredChannelSegment() {

    var testPFM =
        PHASE_FEATURE_MEASUREMENT.toBuilder().setMeasuredChannelSegment(Optional.empty()).build();

    when(stationDefinitionFacetingUtility.populateFacets(
            testPFM.getChannel(), channelFacetingDefinition, effectiveTime))
        .thenReturn(testPFM.getChannel());

    FeatureMeasurement<?> faceted =
        signalDetectionFacetingUtility.populateFacets(
            testPFM, featureMeasurementFacetingDefinition, effectiveTime);

    assertEquals(testPFM, faceted);
    verify(stationDefinitionFacetingUtility)
        .populateFacets(
            PHASE_FEATURE_MEASUREMENT.getChannel(), channelFacetingDefinition, effectiveTime);

    verifyNoMoreInteractions(stationDefinitionFacetingUtility, waveformFacetingUtility);
  }
}
