package gms.shared.signalenhancement.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableTable;
import com.google.common.collect.Tables;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.derivedchannel.coi.BeamTestFixtures;
import gms.shared.derivedchannel.coi.BeamformingTemplate;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.signaldetection.api.SignalDetectionAccessor;
import gms.shared.signaldetection.api.facet.SignalDetectionFacetingUtility;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signalenhancement.api.BeamformingTemplatesRequest;
import gms.shared.signalenhancement.api.ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair;
import gms.shared.signalenhancement.api.FilterDefinitionByFilterDefinitionUsage;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageByChannelSegment;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageBySignalDetectionHypothesis;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageForChannelSegmentsRequest;
import gms.shared.signalenhancement.api.FilterDefinitionByUsageForSignalDetectionHypothesesRequest;
import gms.shared.signalenhancement.api.FilterDefintionByUsageMapRequest;
import gms.shared.signalenhancement.api.FkSpectraTemplatesRequest;
import gms.shared.signalenhancement.api.ProcessingMaskDefinitionRequest;
import gms.shared.signalenhancement.api.RotationTemplateRequest;
import gms.shared.signalenhancement.api.SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair;
import gms.shared.signalenhancement.api.webclient.FkReviewablePhasesRequest;
import gms.shared.signalenhancement.coi.filter.FilterDefinitionIdForDistanceRange;
import gms.shared.signalenhancement.coi.filter.FilterDefsByUsageTable;
import gms.shared.signalenhancement.coi.filter.FilterDefsForDistRangesByUsage;
import gms.shared.signalenhancement.coi.filter.FilterList;
import gms.shared.signalenhancement.coi.filter.FilterListDefinition;
import gms.shared.signalenhancement.coi.fk.FkSpectraTemplate;
import gms.shared.signalenhancement.coi.rotation.RotationTemplate;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.signalenhancement.configuration.ProcessingMaskDefinitionConfiguration;
import gms.shared.signalenhancement.configuration.RotationConfiguration;
import gms.shared.signalenhancement.configuration.SignalEnhancementConfiguration;
import gms.shared.signalenhancement.configuration.testfixtures.ConfigurationTestUtility;
import gms.shared.signalenhancement.configuration.testfixtures.FilterName;
import gms.shared.signalenhancement.testfixtures.RotationTemplateTestFixtures;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelBandType;
import gms.shared.stationdefinition.coi.channel.ChannelInstrumentType;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.waveform.api.WaveformAccessor;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.io.File;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ExtendWith(MockitoExtension.class)
class SignalEnhancementConfigurationServiceTest {

  private static final String WILD_CARD = "*";
  private ConfigurationConsumerUtility configurationConsumerUtility;

  SignalEnhancementConfiguration signalEnhancementFilterConfiguration;
  ConfigurationTestUtility testUtility;
  SignalEnhancementConfigurationService signalEnhancementConfigurationService;
  Map<String, FilterDefinition> filterDefinitionMap;
  SignalDetectionHypothesis sigDetHyp;

  ProcessingMaskDefinitionConfiguration processingMaskDefinitionConfiguration;

  @Mock SignalDetectionFacetingUtility signalDetectionFacetingUtility;

  @Mock StationDefinitionAccessor stationDefinitionAccessor;

  @Mock WaveformAccessor waveformAccessor;

  @Mock SignalDetectionAccessor signalDetectionAccessor;

  @Mock RotationConfiguration rotationConfiguration;

  @BeforeAll
  void init() {
    var configurationRoot =
        Preconditions.checkNotNull(
                Thread.currentThread().getContextClassLoader().getResource("configuration-base"))
            .getPath();

    configurationConsumerUtility =
        ConfigurationConsumerUtility.builder(
                FileConfigurationRepository.create(new File(configurationRoot).toPath()))
            .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
            .build();

    processingMaskDefinitionConfiguration =
        new ProcessingMaskDefinitionConfiguration(configurationConsumerUtility);

    sigDetHyp =
        SignalDetectionHypothesis.builder()
            .setId(ConfigurationTestUtility.RANDOM_SIG_DET_HYP_ID)
            .build();
  }

  @BeforeEach
  void setUp() {
    signalEnhancementFilterConfiguration =
        spy(
            new SignalEnhancementConfiguration(
                stationDefinitionAccessor,
                configurationConsumerUtility,
                processingMaskDefinitionConfiguration));
    signalEnhancementFilterConfiguration.filterListDefinitionConfig =
        "global.filter-list-definition";
    signalEnhancementFilterConfiguration.filterMetadataConfig = "global.filter-metadata";
    processingMaskDefinitionConfiguration.processingMaskDefinitionConfig =
        "global.processing-mask-definition";

    testUtility = new ConfigurationTestUtility(configurationConsumerUtility);
    signalEnhancementConfigurationService =
        new SignalEnhancementConfigurationService(
            signalEnhancementFilterConfiguration,
            rotationConfiguration,
            stationDefinitionAccessor,
            signalDetectionFacetingUtility);
    filterDefinitionMap = testUtility.filterDefinitionMap();
  }

  @Test
  void testResolveFilterListDefinition() {
    FilterListDefinition filterListDefinition =
        signalEnhancementConfigurationService.filterListDefinition();

    List<FilterList> actualFilterList =
        filterListDefinition.getFilterLists().stream().collect(Collectors.toUnmodifiableList());

    List<FilterList> expectedFilterList =
        testUtility.filterListMap().values().stream().collect(Collectors.toUnmodifiableList());

    assertEquals(expectedFilterList, actualFilterList);
  }

  @Test
  void testMultipleChannelWithDifferentTiming() throws JsonProcessingException {
    var defaultChannel = ConfigurationTestUtility.getDefaultChannel();
    var cs1 =
        ConfigurationTestUtility.buildChannelSegment(defaultChannel, Instant.EPOCH.plusSeconds(10));
    var cs2 =
        ConfigurationTestUtility.buildChannelSegment(
            defaultChannel, Instant.EPOCH.plusSeconds(300));
    var defaultEventHypothesis = ConfigurationTestUtility.getDefaultEventHypothesis();
    var defaultNonCausalFilterDefinitionPairs = getDefaultNonCausalFilterDefinitionPairs();

    var request =
        FilterDefinitionByUsageForChannelSegmentsRequest.builder()
            .setChannelSegments(List.of(cs1, cs2))
            .setEventHypothesis(defaultEventHypothesis)
            .build();

    var actual =
        signalEnhancementConfigurationService
            .getDefaultFilterDefinitionByUsageForChannelSegments(request)
            .getKey();
    var expected = getChanSegFilterMap(List.of(cs1, cs2), defaultNonCausalFilterDefinitionPairs);

    assertEquals(
        expected.getChannelSegmentByFilterDefinition(),
        actual.getChannelSegmentByFilterDefinition());

    assertEquals(
        expected.getChannelSegmentByFilterDefinitionUsage(),
        actual.getChannelSegmentByFilterDefinitionUsage());

    assertEquals(
        expected.getChannelSegmentByFilterDefinitionByFilterDefinitionUsage(),
        actual.getChannelSegmentByFilterDefinitionByFilterDefinitionUsage());
  }

  @Test
  void testMultipleChannelWithTheSameTiming() throws JsonProcessingException {
    var defaultChannel = ConfigurationTestUtility.getDefaultChannel();
    var cs1 = ConfigurationTestUtility.buildChannelSegment(defaultChannel, Instant.MIN);
    var cs2 = ConfigurationTestUtility.buildChannelSegment(defaultChannel, Instant.MIN);
    var defaultEventHypothesis = ConfigurationTestUtility.getDefaultEventHypothesis();
    var defaultNonCausalFilterDefinitionPairs = getDefaultNonCausalFilterDefinitionPairs();

    var request =
        FilterDefinitionByUsageForChannelSegmentsRequest.builder()
            .setChannelSegments(List.of(cs1, cs2))
            .setEventHypothesis(defaultEventHypothesis)
            .build();

    var actual =
        signalEnhancementConfigurationService.getDefaultFilterDefinitionByUsageForChannelSegments(
            request);
    var expected = getChanSegFilterMap(List.of(cs1), defaultNonCausalFilterDefinitionPairs);

    assertEquals(expected, actual.getKey());
    assertFalse(actual.getValue());
  }

  @ParameterizedTest
  @MethodSource("inputFilterDefinitionUsageForChannel")
  void testInputGetDefaultFilterDefinitionByUsageForSignalDetectionHypothesis(
      String station,
      String channelGroup,
      ChannelBandType channelBand,
      ChannelInstrumentType channelInstrument,
      ChannelOrientationType channelOrientation,
      double channelLatitude,
      double channelLongitude,
      PhaseType phaseType,
      Collection<ProcessingMask> maskedBy,
      double eventHypothesisLatitude,
      double eventHypothesisLongitude,
      List<Pair<FilterDefinitionUsage, FilterName>> expectedFilterDefinitionsPairs) {
    // TODO verify whether maskedBy is needed. currently set for parameterized tests

    var sdh =
        ConfigurationTestUtility.buildSignalDetectionHypothesis(
            station,
            channelGroup,
            channelBand,
            channelInstrument,
            channelOrientation,
            Location.from(channelLatitude, channelLongitude, 0, 0),
            phaseType);

    var eventHypothesis =
        ConfigurationTestUtility.buildEventHypothesis(
            Location.from(eventHypothesisLatitude, eventHypothesisLongitude, 0, 0));

    var request =
        FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
            .setEventHypothesis(eventHypothesis)
            .setSignalDetectionsHypotheses(List.of(sdh))
            .build();

    var actual =
        signalEnhancementConfigurationService
            .getDefaultFilterDefinitionByUsageForSignalDetectionHypothesis(request);

    var expected = getSigDetFilterMap(sigDetHyp, expectedFilterDefinitionsPairs);

    assertEquals(expected, actual.getKey());
    assertFalse(actual.getValue());
  }

  @ParameterizedTest
  @MethodSource("inputFilterDefinitionUsageForChannel")
  void testInputSignalDetectionHypothesisWithVersionedChannels(
      String station,
      String channelGroup,
      ChannelBandType channelBand,
      ChannelInstrumentType channelInstrument,
      ChannelOrientationType channelOrientation,
      double channelLatitude,
      double channelLongitude,
      PhaseType phaseType,
      Collection<ProcessingMask> maskedBy,
      double eventHypothesisLatitude,
      double eventHypothesisLongitude,
      List<Pair<FilterDefinitionUsage, FilterName>> expectedFilterDefinitionsPairs) {
    // TODO verify whether maskedBy is needed. currently set for parameterized tests

    var sdh =
        ConfigurationTestUtility
            .buildSignalDetectionHypothesisWithVersionChannelInFeatureMeasurement(
                station,
                channelGroup,
                channelBand,
                channelInstrument,
                channelOrientation,
                Location.from(channelLatitude, channelLongitude, 0, 0),
                phaseType);

    var eventHypothesis =
        ConfigurationTestUtility.buildEventHypothesis(
            Location.from(eventHypothesisLatitude, eventHypothesisLongitude, 0, 0));

    Mockito.when(
            stationDefinitionAccessor.findChannelsByNameAndTime(Mockito.<String>anyList(), any()))
        .thenReturn(
            List.of(
                ConfigurationTestUtility.buildChannel(
                    station,
                    channelGroup,
                    channelBand,
                    channelInstrument,
                    channelOrientation,
                    Location.from(channelLatitude, channelLongitude, 0, 0),
                    Optional.empty())));

    var request =
        FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
            .setEventHypothesis(eventHypothesis)
            .setSignalDetectionsHypotheses(List.of(sdh))
            .build();

    var actual =
        signalEnhancementConfigurationService
            .getDefaultFilterDefinitionByUsageForSignalDetectionHypothesis(request);

    var expected = getSigDetFilterMap(sigDetHyp, expectedFilterDefinitionsPairs);

    assertEquals(expected, actual.getKey());
    assertFalse(actual.getValue());
  }

  @ParameterizedTest
  @MethodSource("inputFilterDefinitionUsageForChannel")
  void testForFacetedSignalDetectionHypothesis(
      String station,
      String channelGroup,
      ChannelBandType channelBand,
      ChannelInstrumentType channelInstrument,
      ChannelOrientationType channelOrientation,
      double channelLatitude,
      double channelLongitude,
      PhaseType phaseType,
      Collection<ProcessingMask> maskedBy,
      double eventHypothesisLatitude,
      double eventHypothesisLongitude,
      List<Pair<FilterDefinitionUsage, FilterName>> expectedFilterDefinitionsPairs) {
    // TODO verify whether maskedBy is needed. currently set for parameterized tests

    var sdh =
        ConfigurationTestUtility.buildSignalDetectionHypothesis(
            station,
            channelGroup,
            channelBand,
            channelInstrument,
            channelOrientation,
            Location.from(channelLatitude, channelLongitude, 0, 0),
            phaseType);
    var facetedSdh = sdh.toEntityReference();
    var eventHypothesis =
        ConfigurationTestUtility.buildEventHypothesis(
            Location.from(eventHypothesisLatitude, eventHypothesisLongitude, 0, 0));

    var request =
        FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
            .setEventHypothesis(eventHypothesis)
            .setSignalDetectionsHypotheses(List.of(facetedSdh))
            .build();

    Mockito.when(signalDetectionFacetingUtility.populateFacets(Mockito.any(), Mockito.any()))
        .thenReturn(sdh);
    var actual =
        signalEnhancementConfigurationService
            .getDefaultFilterDefinitionByUsageForSignalDetectionHypothesis(request);
    var expected = getSigDetFilterMap(sigDetHyp, expectedFilterDefinitionsPairs);

    assertEquals(expected, actual.getKey());
    assertFalse(actual.getValue());
  }

  @ParameterizedTest
  @MethodSource("inputFilterDefinitionUsageForChannel")
  void testInputGetDefaultUsageForChannelSegment(
      String station,
      String channelGroup,
      ChannelBandType channelBand,
      ChannelInstrumentType channelInstrument,
      ChannelOrientationType channelOrientation,
      double channelLatitude,
      double channelLongitude,
      PhaseType phaseType,
      Collection<ProcessingMask> maskedBy,
      double eventHypothesisLatitude,
      double eventHypothesisLongitude,
      List<Pair<FilterDefinitionUsage, FilterName>> expectedFilterDefinitionsPairs) {

    var cs =
        ConfigurationTestUtility.buildChannelSegment(
            station,
            channelGroup,
            channelBand,
            channelInstrument,
            channelOrientation,
            Location.from(channelLatitude, channelLongitude, 0, 0),
            phaseType,
            maskedBy); // TODO Add ProcessingMask stuff here
    var eventHypothesis =
        ConfigurationTestUtility.buildEventHypothesis(
            Location.from(eventHypothesisLatitude, eventHypothesisLongitude, 0, 0));

    var request =
        FilterDefinitionByUsageForChannelSegmentsRequest.builder()
            .setChannelSegments(List.of(cs))
            .setEventHypothesis(eventHypothesis)
            .build();

    var actual =
        signalEnhancementConfigurationService.getDefaultFilterDefinitionByUsageForChannelSegments(
            request);
    var expected = getChanSegFilterMap(List.of(cs), expectedFilterDefinitionsPairs);

    assertEquals(expected, actual.getKey());
    assertFalse(actual.getValue());
  }

  @ParameterizedTest
  @MethodSource("inputFilterDefinitionUsageForChannel")
  void testInputGetDefaultUsageForChannelSegmentWithFacetedChannel(
      String station,
      String channelGroup,
      ChannelBandType channelBand,
      ChannelInstrumentType channelInstrument,
      ChannelOrientationType channelOrientation,
      double channelLatitude,
      double channelLongitude,
      PhaseType phaseType,
      Collection<ProcessingMask> maskedBy,
      double eventHypothesisLatitude,
      double eventHypothesisLongitude,
      List<Pair<FilterDefinitionUsage, FilterName>> expectedFilterDefinitionsPairs) {

    var cs =
        ConfigurationTestUtility.buildChannelSegment(
            station,
            channelGroup,
            channelBand,
            channelInstrument,
            channelOrientation,
            Location.from(channelLatitude, channelLongitude, 0, 0),
            phaseType,
            maskedBy); // TODO Add ProcessingMask stuff here

    var csd = cs.getId();
    var channel = csd.getChannel();
    var facetedCs =
        cs.toBuilder()
            .setId(
                ChannelSegmentDescriptor.from(
                    channel.toEntityReference().toBuilder()
                        .setEffectiveAt(channel.getEffectiveAt())
                        .build(),
                    csd.getCreationTime(),
                    csd.getStartTime(),
                    csd.getEndTime()))
            .build();

    var eventHypothesis =
        ConfigurationTestUtility.buildEventHypothesis(
            Location.from(eventHypothesisLatitude, eventHypothesisLongitude, 0, 0));

    var request =
        FilterDefinitionByUsageForChannelSegmentsRequest.builder()
            .setChannelSegments(List.of(facetedCs))
            .setEventHypothesis(eventHypothesis)
            .build();

    Mockito.when(
            stationDefinitionAccessor.findChannelsByNameAndTime(Mockito.<String>anyList(), any()))
        .thenReturn(List.of(channel));

    var actual =
        signalEnhancementConfigurationService.getDefaultFilterDefinitionByUsageForChannelSegments(
            request);
    var expected = getChanSegFilterMap(List.of(facetedCs), expectedFilterDefinitionsPairs);

    assertEquals(expected, actual.getKey());
    assertFalse(actual.getValue());
  }

  @Test
  void testEmptyListFacetingChannel() {
    var defaultChannel = ConfigurationTestUtility.getDefaultChannel();
    var cs =
        ConfigurationTestUtility.buildChannelSegment(defaultChannel, Instant.EPOCH.plusSeconds(10));
    var defaultEventHypothesis = ConfigurationTestUtility.getDefaultEventHypothesis();
    var csd = cs.getId();

    var facetedCs =
        cs.toBuilder()
            .setId(
                ChannelSegmentDescriptor.from(
                    defaultChannel.toEntityReference().toBuilder()
                        .setEffectiveAt(defaultChannel.getEffectiveAt())
                        .build(),
                    csd.getCreationTime(),
                    csd.getStartTime(),
                    csd.getEndTime()))
            .build();

    var request =
        FilterDefinitionByUsageForChannelSegmentsRequest.builder()
            .setChannelSegments(List.of(facetedCs))
            .setEventHypothesis(defaultEventHypothesis)
            .build();

    Mockito.when(
            stationDefinitionAccessor.findChannelsByNameAndTime(Mockito.<String>anyList(), any()))
        .thenReturn(List.of());

    var actual =
        signalEnhancementConfigurationService.getDefaultFilterDefinitionByUsageForChannelSegments(
            request);

    assertTrue(actual.getValue());
    assertTrue(actual.getKey().getFilterDefinitionByUsageByChannelSegment().isEmpty());
  }

  @Test
  void testNullFacetingHypothesis() {
    var sdh = ConfigurationTestUtility.getDefaultSignalDetectionHypothesis();
    var defaultEventHypothesis = ConfigurationTestUtility.getDefaultEventHypothesis();

    SignalDetectionHypothesis facetedSdh = sdh.toEntityReference();

    var request =
        FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
            .setEventHypothesis(defaultEventHypothesis)
            .setSignalDetectionsHypotheses(List.of(facetedSdh))
            .build();

    Mockito.when(signalDetectionFacetingUtility.populateFacets(Mockito.any(), Mockito.any()))
        .thenReturn(null);

    var actual =
        signalEnhancementConfigurationService
            .getDefaultFilterDefinitionByUsageForSignalDetectionHypothesis(request);

    assertTrue(actual.getValue());
    assertTrue(actual.getKey().getFilterDefinitionByUsageBySignalDetectionHypothesis().isEmpty());
  }

  @Test
  void testNullFacetingChannelInSignalDetection() {
    String station = "ASAR";
    String channelGroup = "AS31";
    ChannelBandType channelBand = ChannelBandType.BROADBAND;
    ChannelInstrumentType channelInstrument = ChannelInstrumentType.HIGH_GAIN_SEISMOMETER;
    ChannelOrientationType channelOrientation = ChannelOrientationType.NORTH_SOUTH;
    PhaseType phaseType = PhaseType.P;
    double channelLatitude = -23.665;
    double channelLongitude = 133.905;

    var sdh =
        ConfigurationTestUtility
            .buildSignalDetectionHypothesisWithVersionChannelInFeatureMeasurement(
                station,
                channelGroup,
                channelBand,
                channelInstrument,
                channelOrientation,
                Location.from(channelLatitude, channelLongitude, 0, 0),
                phaseType);

    var defaultEventHypothesis = ConfigurationTestUtility.getDefaultEventHypothesis();

    Mockito.when(
            stationDefinitionAccessor.findChannelsByNameAndTime(Mockito.<String>anyList(), any()))
        .thenReturn(List.of());

    var request =
        FilterDefinitionByUsageForSignalDetectionHypothesesRequest.builder()
            .setEventHypothesis(defaultEventHypothesis)
            .setSignalDetectionsHypotheses(List.of(sdh))
            .build();

    var actual =
        signalEnhancementConfigurationService
            .getDefaultFilterDefinitionByUsageForSignalDetectionHypothesis(request);

    assertTrue(actual.getValue());
    assertTrue(actual.getKey().getFilterDefinitionByUsageBySignalDetectionHypothesis().isEmpty());
  }

  @Test
  void testGetProcessingMaskDefinitions() {
    var channelVersion1 = Channel.createVersionReference("CMAR.CM01.SHZ", Instant.EPOCH);
    var channelVersion2 = Channel.createVersionReference("CMAR.CM04.SHZ", Instant.EPOCH);

    var result =
        signalEnhancementConfigurationService.getProcessingMaskDefinitions(
            ProcessingMaskDefinitionRequest.create(
                Set.of("AMPLITUDE_MEASUREMENT_BEAM", "FK_SPECTRA"),
                Set.of(channelVersion1, channelVersion2),
                Set.of("P", "S")));

    assertNotNull(result);

    // Since we had 2 ProcessingOperations, 2 channels, and 2 phases, there
    // should be 2x2x2=8 definitions.
    int count =
        result.getProcessingMaskDefinitionByPhaseByChannel().stream()
            .flatMap(a -> a.getProcessingMaskDefinitionByPhase().values().stream())
            .mapToInt(b -> b.size())
            .sum();
    assertEquals(8, count);
  }

  @Test
  void testBeamformingTemplate() {
    var mockedSignalEnhancementConfig = Mockito.mock(SignalEnhancementConfiguration.class);
    var station1 = Station.createEntityReference("one");
    var station2 = Station.createEntityReference("two");
    var phaseType = PhaseType.I;
    var beamType = BeamType.CONTINUOUS_LOCATION;

    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            mockedSignalEnhancementConfig,
            rotationConfiguration,
            waveformAccessor,
            stationDefinitionAccessor,
            signalDetectionAccessor);

    BeamformingTemplatesRequest beamformingRequest =
        BeamformingTemplatesRequest.builder()
            .setBeamType(beamType)
            .setPhases(List.of(phaseType))
            .setStations(List.of(station1, station2))
            .build();

    Mockito.when(
            mockedSignalEnhancementConfig.getBeamformingTemplate(station1, phaseType, beamType))
        .thenReturn(Optional.of(BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE));
    Mockito.when(
            mockedSignalEnhancementConfig.getBeamformingTemplate(station2, phaseType, beamType))
        .thenReturn(Optional.of(BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE));

    Mockito.when(
            stationDefinitionAccessor.findStationsByNameAndTime(Mockito.<String>anyList(), any()))
        .thenReturn(List.of(station1, station2));

    var expected =
        ImmutableTable.<String, String, BeamformingTemplate>builder()
            .put(
                station1.getName(),
                phaseType.getLabel(),
                BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE)
            .put(
                station2.getName(),
                phaseType.getLabel(),
                BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE)
            .build();

    var results = serviceWithMock.getBeamformingTemplates(beamformingRequest);
    assertEquals(expected, results);
  }

  @Test
  void testBeamformingTemplateDuplicatePhase() {
    var mockedSignalEnhancementConfig = Mockito.mock(SignalEnhancementConfiguration.class);
    var station1 = Station.createEntityReference("one");
    var station2 = Station.createEntityReference("two");
    var phaseType = PhaseType.I;
    var phaseTypeDuplicate = PhaseType.I;
    var beamType = BeamType.CONTINUOUS_LOCATION;

    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            mockedSignalEnhancementConfig,
            rotationConfiguration,
            waveformAccessor,
            stationDefinitionAccessor,
            signalDetectionAccessor);

    BeamformingTemplatesRequest beamformingRequest =
        BeamformingTemplatesRequest.builder()
            .setBeamType(beamType)
            .setPhases(List.of(phaseType, phaseTypeDuplicate))
            .setStations(List.of(station1, station2))
            .build();

    Mockito.when(
            mockedSignalEnhancementConfig.getBeamformingTemplate(station1, phaseType, beamType))
        .thenReturn(Optional.of(BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE));
    Mockito.when(
            mockedSignalEnhancementConfig.getBeamformingTemplate(station2, phaseType, beamType))
        .thenReturn(Optional.of(BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE));

    Mockito.when(
            stationDefinitionAccessor.findStationsByNameAndTime(Mockito.<String>anyList(), any()))
        .thenReturn(List.of(station1, station2));

    var expected =
        ImmutableTable.<String, String, BeamformingTemplate>builder()
            .put(
                station1.getName(),
                phaseType.getLabel(),
                BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE)
            .put(
                station2.getName(),
                phaseTypeDuplicate.getLabel(),
                BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE)
            .build();

    var results = serviceWithMock.getBeamformingTemplates(beamformingRequest);
    assertEquals(expected, results);
  }

  @Test
  void testBeamformingTemplateDuplicateStation() {
    var mockedSignalEnhancementConfig = Mockito.mock(SignalEnhancementConfiguration.class);
    var station1 = Station.createEntityReference("one");
    var phaseType = PhaseType.I;
    var beamType = BeamType.CONTINUOUS_LOCATION;

    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            mockedSignalEnhancementConfig,
            rotationConfiguration,
            waveformAccessor,
            stationDefinitionAccessor,
            signalDetectionAccessor);

    BeamformingTemplatesRequest beamformingRequest =
        BeamformingTemplatesRequest.builder()
            .setBeamType(beamType)
            .setPhases(List.of(phaseType))
            .setStations(List.of(station1, station1))
            .build();

    Mockito.when(
            mockedSignalEnhancementConfig.getBeamformingTemplate(station1, phaseType, beamType))
        .thenReturn(Optional.of(BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE));

    Mockito.when(
            stationDefinitionAccessor.findStationsByNameAndTime(Mockito.<String>anyList(), any()))
        .thenReturn(List.of(station1));

    var expected =
        ImmutableTable.<String, String, BeamformingTemplate>builder()
            .put(
                station1.getName(),
                phaseType.getLabel(),
                BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE)
            .build();

    var results = serviceWithMock.getBeamformingTemplates(beamformingRequest);
    assertEquals(expected, results);
  }

  @Test
  void testOptionalReturnBeamformingTemplate() {
    var mockedSignalEnhancement = Mockito.mock(SignalEnhancementConfiguration.class);
    var station1 = Station.createEntityReference("one");
    var station2 = Station.createEntityReference("two");
    var phaseType = PhaseType.I;
    var beamType = BeamType.CONTINUOUS_LOCATION;
    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            mockedSignalEnhancement,
            rotationConfiguration,
            stationDefinitionAccessor,
            signalDetectionFacetingUtility);
    BeamformingTemplatesRequest beamformingRequest =
        BeamformingTemplatesRequest.builder()
            .setBeamType(beamType)
            .setPhases(List.of(phaseType))
            .setStations(List.of(station1, station2))
            .build();
    Mockito.when(mockedSignalEnhancement.getBeamformingTemplate(station1, phaseType, beamType))
        .thenReturn(Optional.empty());
    Mockito.when(mockedSignalEnhancement.getBeamformingTemplate(station2, phaseType, beamType))
        .thenReturn(Optional.empty());
    Mockito.when(mockedSignalEnhancement.getBeamformingTemplate(station1, phaseType, beamType))
        .thenReturn(Optional.of(BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE));
    Mockito.when(mockedSignalEnhancement.getBeamformingTemplate(station2, phaseType, beamType))
        .thenReturn(Optional.of(BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE));

    Mockito.when(
            stationDefinitionAccessor.findStationsByNameAndTime(Mockito.<String>anyList(), any()))
        .thenReturn(List.of(station1, station2));

    var expected =
        ImmutableTable.<String, String, BeamformingTemplate>builder()
            .put(
                station1.getName(),
                phaseType.getLabel(),
                BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE)
            .put(
                station2.getName(),
                phaseType.getLabel(),
                BeamTestFixtures.CONTINUOUS_BEAMFORMING_TEMPLATE)
            .build();

    var results = serviceWithMock.getBeamformingTemplates(beamformingRequest);
    assertEquals(expected, results);
  }

  @Test
  void testGetFkSpectraTemplates() {
    var secConfigMock = Mockito.mock(SignalEnhancementConfiguration.class);
    var asar = Station.createEntityReference("ASAR");
    var pdar = Station.createEntityReference("PDAR");
    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            secConfigMock,
            rotationConfiguration,
            stationDefinitionAccessor,
            signalDetectionFacetingUtility);

    var templateAsarP = Mockito.mock(FkSpectraTemplate.class);
    var templateAsarS = Mockito.mock(FkSpectraTemplate.class);
    var templatePdarP = Mockito.mock(FkSpectraTemplate.class);
    var templatePdarS = Mockito.mock(FkSpectraTemplate.class);

    var request =
        new FkSpectraTemplatesRequest(List.of(asar, pdar), List.of(PhaseType.P, PhaseType.S));

    Mockito.when(secConfigMock.getFkSpectraTemplate(asar, PhaseType.P)).thenReturn(templateAsarP);
    Mockito.when(secConfigMock.getFkSpectraTemplate(asar, PhaseType.S)).thenReturn(templateAsarS);
    Mockito.when(secConfigMock.getFkSpectraTemplate(pdar, PhaseType.P)).thenReturn(templatePdarP);
    Mockito.when(secConfigMock.getFkSpectraTemplate(pdar, PhaseType.S)).thenReturn(templatePdarS);

    Mockito.when(
            stationDefinitionAccessor.findStationsByNameAndTime(Mockito.<String>anyList(), any()))
        .thenReturn(List.of(asar, pdar));

    var expected =
        ImmutableTable.<String, String, FkSpectraTemplate>builder()
            .put(asar.getName(), PhaseType.P.toString(), templateAsarP)
            .put(asar.getName(), PhaseType.S.toString(), templateAsarS)
            .put(pdar.getName(), PhaseType.P.toString(), templatePdarP)
            .put(pdar.getName(), PhaseType.S.toString(), templatePdarS)
            .build();
    var results = serviceWithMock.getFkSpectraTemplates(request);

    assertEquals(expected, results);
  }

  @Test
  void testGetFkSpectraTemplatesIgnoreDuplicates() {
    var secConfigMock = Mockito.mock(SignalEnhancementConfiguration.class);
    var asar = Station.createEntityReference("ASAR");
    var pdar = Station.createEntityReference("PDAR");
    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            secConfigMock,
            rotationConfiguration,
            stationDefinitionAccessor,
            signalDetectionFacetingUtility);

    var templateAsarP = Mockito.mock(FkSpectraTemplate.class);
    var templateAsarS = Mockito.mock(FkSpectraTemplate.class);
    var templatePdarP = Mockito.mock(FkSpectraTemplate.class);
    var templatePdarS = Mockito.mock(FkSpectraTemplate.class);

    var request =
        new FkSpectraTemplatesRequest(
            List.of(asar, pdar, asar), List.of(PhaseType.P, PhaseType.S, PhaseType.P));

    Mockito.when(secConfigMock.getFkSpectraTemplate(asar, PhaseType.P)).thenReturn(templateAsarP);
    Mockito.when(secConfigMock.getFkSpectraTemplate(asar, PhaseType.S)).thenReturn(templateAsarS);
    Mockito.when(secConfigMock.getFkSpectraTemplate(pdar, PhaseType.P)).thenReturn(templatePdarP);
    Mockito.when(secConfigMock.getFkSpectraTemplate(pdar, PhaseType.S)).thenReturn(templatePdarS);

    Mockito.when(
            stationDefinitionAccessor.findStationsByNameAndTime(Mockito.<String>anyList(), any()))
        .thenReturn(List.of(asar, pdar));

    var expected =
        ImmutableTable.<String, String, FkSpectraTemplate>builder()
            .put(asar.getName(), PhaseType.P.toString(), templateAsarP)
            .put(asar.getName(), PhaseType.S.toString(), templateAsarS)
            .put(pdar.getName(), PhaseType.P.toString(), templatePdarP)
            .put(pdar.getName(), PhaseType.S.toString(), templatePdarS)
            .build();
    var results = serviceWithMock.getFkSpectraTemplates(request);

    assertEquals(expected, results);
  }

  @Test
  void testGetFkReviewablePhases() {
    var secConfigMock = Mockito.mock(SignalEnhancementConfiguration.class);
    var station1 = Station.createEntityReference("one");
    var station2 = Station.createEntityReference("two");
    var activity = WorkflowDefinitionId.from("Some Activity");
    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            secConfigMock,
            rotationConfiguration,
            stationDefinitionAccessor,
            signalDetectionFacetingUtility);

    var request = new FkReviewablePhasesRequest(List.of(station1, station2), activity);
    var phases1 = Set.of(PhaseType.P);
    var phases2 = Set.of(PhaseType.P, PhaseType.S);
    Mockito.when(secConfigMock.getFkReviewablePhases(station1.getName(), activity))
        .thenReturn(Optional.of(phases1));
    Mockito.when(secConfigMock.getFkReviewablePhases(station2.getName(), activity))
        .thenReturn(Optional.of(phases2));

    var expected = Map.of(station1, phases1, station2, phases2);
    var results = serviceWithMock.getFkReviewablePhases(request);

    assertEquals(expected, results);
  }

  @Test
  void testGetRotationTemplates() {
    var secConfigMock = Mockito.mock(SignalEnhancementConfiguration.class);
    var station1 = Station.createEntityReference("one");
    var station2 = Station.createEntityReference("two");
    var stationList = List.of(station1, station2);
    var phasesList = List.of(PhaseType.I, PhaseType.Is);

    var rotationTemplate = RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL;
    var rotationTemplate2 = RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL_GROUP;

    var request = new RotationTemplateRequest(stationList, phasesList);

    var expected =
        ImmutableTable.<Station, PhaseType, RotationTemplate>builder()
            .put(Tables.immutableCell(station1, PhaseType.I, rotationTemplate))
            .put(Tables.immutableCell(station1, PhaseType.Is, rotationTemplate))
            .put(Tables.immutableCell(station2, PhaseType.I, rotationTemplate2))
            .put(Tables.immutableCell(station2, PhaseType.Is, rotationTemplate2))
            .build();

    Mockito.when(rotationConfiguration.getRotationTemplate(station1, PhaseType.I))
        .thenReturn(rotationTemplate);
    Mockito.when(rotationConfiguration.getRotationTemplate(station1, PhaseType.Is))
        .thenReturn(rotationTemplate);
    Mockito.when(rotationConfiguration.getRotationTemplate(station2, PhaseType.I))
        .thenReturn(rotationTemplate2);
    Mockito.when(rotationConfiguration.getRotationTemplate(station2, PhaseType.Is))
        .thenReturn(rotationTemplate2);

    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            secConfigMock,
            rotationConfiguration,
            stationDefinitionAccessor,
            signalDetectionFacetingUtility);

    var results = serviceWithMock.getRotationTemplates(request);

    assertEquals(expected, results);
  }

  @Test
  void testGetRotationTemplatesReturnStationEntityRef() {
    var secConfigMock = Mockito.mock(SignalEnhancementConfiguration.class);
    var stationER = Station.createEntityReference("one");
    var station = Station.createVersionReference(stationER);

    var rotationTemplate = RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL;

    var request = new RotationTemplateRequest(List.of(station), List.of(PhaseType.UNSET));

    var expected =
        ImmutableTable.<Station, PhaseType, RotationTemplate>builder()
            .put(Tables.immutableCell(stationER, PhaseType.UNSET, rotationTemplate))
            .build();
    Mockito.when(rotationConfiguration.getRotationTemplate(stationER, PhaseType.UNSET))
        .thenReturn(rotationTemplate);
    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            secConfigMock,
            rotationConfiguration,
            stationDefinitionAccessor,
            signalDetectionFacetingUtility);

    var results = serviceWithMock.getRotationTemplates(request);

    assertEquals(expected, results);
  }

  @Test
  void testGetFkReviewablePhasesIgnoreDuplicateStations() {
    var secConfigMock = Mockito.mock(SignalEnhancementConfiguration.class);
    var station1 = Station.createEntityReference("one");
    var station2 = Station.createEntityReference("two");
    var activity = WorkflowDefinitionId.from("Some Activity");
    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            secConfigMock,
            rotationConfiguration,
            stationDefinitionAccessor,
            signalDetectionFacetingUtility);

    var request = new FkReviewablePhasesRequest(List.of(station1, station2, station1), activity);
    var phases1 = Set.of(PhaseType.P);
    var phases2 = Set.of(PhaseType.P, PhaseType.S);
    Mockito.when(secConfigMock.getFkReviewablePhases(station1.getName(), activity))
        .thenReturn(Optional.of(phases1));
    Mockito.when(secConfigMock.getFkReviewablePhases(station2.getName(), activity))
        .thenReturn(Optional.of(phases2));

    var expected = Map.of(station1, phases1, station2, phases2);
    var results = serviceWithMock.getFkReviewablePhases(request);

    assertEquals(expected, results);
  }

  @Test
  void testGetFkReviewablePhasesPartialResult() {
    var secConfigMock = Mockito.mock(SignalEnhancementConfiguration.class);
    var station1 = Station.createEntityReference("one");
    var station2 = Station.createEntityReference("two");
    var activity = WorkflowDefinitionId.from("Some Activity");
    var serviceWithMock =
        new SignalEnhancementConfigurationService(
            secConfigMock,
            rotationConfiguration,
            stationDefinitionAccessor,
            signalDetectionFacetingUtility);

    var request = new FkReviewablePhasesRequest(List.of(station1, station2), activity);
    var phases2 = Set.of(PhaseType.P, PhaseType.S);
    Mockito.when(secConfigMock.getFkReviewablePhases(station1.getName(), activity))
        .thenReturn(Optional.empty());
    Mockito.when(secConfigMock.getFkReviewablePhases(station2.getName(), activity))
        .thenReturn(Optional.of(phases2));

    var expected = Map.of(station2, phases2);
    var results = serviceWithMock.getFkReviewablePhases(request);

    assertEquals(expected, results);
  }

  static Stream<Arguments> inputFilterDefinitionUsageForChannel() {
    return Stream.of(
        arguments(
            "ASAR",
            "AS31",
            ChannelBandType.BROADBAND,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.NORTH_SOUTH,
            -23.665,
            133.905,
            PhaseType.P,
            List.of(),
            -23.665,
            134.905,
            List.of(
                Pair.of(
                    FilterDefinitionUsage.DETECTION, FilterName.BW_IIR_BP_0_5_1_5_3_HZ_NON_CAUSAL),
                Pair.of(FilterDefinitionUsage.FK, FilterName.BW_IIR_BP_0_5_1_5_3_HZ_NON_CAUSAL),
                Pair.of(FilterDefinitionUsage.ONSET, FilterName.BW_IIR_BP_0_5_1_5_3_HZ_NON_CAUSAL),
                Pair.of(
                    FilterDefinitionUsage.AMPLITUDE, FilterName.BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL))),
        arguments(
            "ASAR",
            "AS01",
            ChannelBandType.SHORT_PERIOD,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.VERTICAL,
            -23.665,
            133.905,
            PhaseType.P,
            List.of(),
            -23.665,
            134.905,
            List.of(
                Pair.of(FilterDefinitionUsage.DETECTION, FilterName.BW_IIR_BP_1_0_3_0_3_HZ_CAUSAL),
                Pair.of(FilterDefinitionUsage.FK, FilterName.BW_IIR_BP_0_5_4_0_3_HZ_NON_CAUSAL),
                Pair.of(FilterDefinitionUsage.ONSET, FilterName.BW_IIR_BP_4_0_8_0_3_HZ_CAUSAL),
                Pair.of(
                    FilterDefinitionUsage.AMPLITUDE, FilterName.BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL))),
        arguments(
            "VNDA",
            "VNDA1",
            ChannelBandType.SHORT_PERIOD,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.VERTICAL,
            -77.517,
            161.853,
            PhaseType.S,
            List.of(),
            -76.517,
            161.853,
            List.of(
                Pair.of(FilterDefinitionUsage.DETECTION, FilterName.BW_IIR_BP_1_5_3_0_3_HZ_CAUSAL),
                Pair.of(FilterDefinitionUsage.FK, FilterName.BW_IIR_BP_1_5_3_0_3_HZ_CAUSAL),
                Pair.of(FilterDefinitionUsage.ONSET, FilterName.BW_IIR_BP_1_5_3_0_3_HZ_CAUSAL),
                Pair.of(
                    FilterDefinitionUsage.AMPLITUDE, FilterName.BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL))),
        arguments(
            "VNDA",
            "VNDA1",
            ChannelBandType.SHORT_PERIOD,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.VERTICAL,
            -77.517,
            161.853,
            PhaseType.P,
            List.of(),
            -75.517,
            161.853,
            List.of(
                Pair.of(FilterDefinitionUsage.DETECTION, FilterName.BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL),
                Pair.of(FilterDefinitionUsage.FK, FilterName.BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL),
                Pair.of(FilterDefinitionUsage.ONSET, FilterName.BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL),
                Pair.of(
                    FilterDefinitionUsage.AMPLITUDE, FilterName.BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL))),
        arguments(
            "VNDA",
            "VNDA1",
            ChannelBandType.SHORT_PERIOD,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.VERTICAL,
            -77.517,
            161.853,
            PhaseType.P,
            List.of(),
            -70.517,
            161.853,
            List.of(
                Pair.of(FilterDefinitionUsage.DETECTION, FilterName.BW_IIR_BP_0_5_4_0_3_HZ_CAUSAL),
                Pair.of(FilterDefinitionUsage.FK, FilterName.BW_IIR_BP_0_4_3_5_3_HZ_CAUSAL),
                Pair.of(FilterDefinitionUsage.ONSET, FilterName.BW_IIR_BP_0_4_3_5_3_HZ_CAUSAL),
                Pair.of(
                    FilterDefinitionUsage.AMPLITUDE, FilterName.BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL))),
        arguments(
            WILD_CARD,
            WILD_CARD,
            ChannelBandType.UNKNOWN,
            ChannelInstrumentType.UNKNOWN,
            ChannelOrientationType.UNKNOWN,
            -77.517,
            161.853,
            PhaseType.UNKNOWN,
            List.of(),
            -70.517,
            161.853,
            List.of(
                Pair.of(FilterDefinitionUsage.DETECTION, FilterName.BW_IIR_BP_0_5_4_0_3_HZ_CAUSAL),
                Pair.of(FilterDefinitionUsage.FK, FilterName.BW_IIR_BP_0_4_3_5_3_HZ_CAUSAL),
                Pair.of(FilterDefinitionUsage.ONSET, FilterName.BW_IIR_BP_0_4_3_5_3_HZ_CAUSAL),
                Pair.of(
                    FilterDefinitionUsage.AMPLITUDE, FilterName.BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL))));
  }

  private FilterDefinitionByUsageBySignalDetectionHypothesis getSigDetFilterMap(
      SignalDetectionHypothesis signalDetectionHypothesis,
      List<Pair<FilterDefinitionUsage, FilterName>> filterDefintionByFilterDefinitionUsuagePairs) {
    FilterDefinitionByFilterDefinitionUsage filterDefinitionByFilterDefinitionUsage =
        FilterDefinitionByFilterDefinitionUsage.from(
            filterDefintionByFilterDefinitionUsuagePairs.stream()
                .map(
                    pair ->
                        Pair.of(
                            pair.getLeft(), filterDefinitionMap.get(pair.getRight().toString())))
                .collect(Collectors.toMap(pair -> pair.getLeft(), pair -> pair.getRight())));

    return FilterDefinitionByUsageBySignalDetectionHypothesis.from(
        List.of(
            SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair.builder()
                .setSignalDetectionHypothesis(signalDetectionHypothesis)
                .setFilterDefinitionByFilterDefinitionUsage(filterDefinitionByFilterDefinitionUsage)
                .build()));
  }

  private FilterDefinitionByUsageByChannelSegment getChanSegFilterMap(
      List<ChannelSegment<Waveform>> chanSegs,
      List<Pair<FilterDefinitionUsage, FilterName>> filterDefintionByFilterDefinitionUsuagePairs) {
    FilterDefinitionByFilterDefinitionUsage filterDefinitionByFilterDefinitionUsage =
        FilterDefinitionByFilterDefinitionUsage.from(
            filterDefintionByFilterDefinitionUsuagePairs.stream()
                .map(
                    pair ->
                        Pair.of(
                            pair.getLeft(), filterDefinitionMap.get(pair.getRight().toString())))
                .collect(Collectors.toMap(pair -> pair.getLeft(), pair -> pair.getRight())));

    List<ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair> pairs =
        chanSegs.stream()
            .map(
                chanSeg ->
                    ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair.builder()
                        .setChannelSegment(chanSeg)
                        .setFilterDefinitionByFilterDefinitionUsage(
                            filterDefinitionByFilterDefinitionUsage)
                        .build())
            .collect(Collectors.toList());

    return FilterDefinitionByUsageByChannelSegment.from(pairs);
  }

  private List<Pair<FilterDefinitionUsage, FilterName>> getDefaultNonCausalFilterDefinitionPairs() {
    return List.of(
        Pair.of(FilterDefinitionUsage.DETECTION, FilterName.BW_IIR_BP_0_5_1_5_3_HZ_NON_CAUSAL),
        Pair.of(FilterDefinitionUsage.FK, FilterName.BW_IIR_BP_0_5_1_5_3_HZ_NON_CAUSAL),
        Pair.of(FilterDefinitionUsage.ONSET, FilterName.BW_IIR_BP_0_5_1_5_3_HZ_NON_CAUSAL),
        Pair.of(FilterDefinitionUsage.AMPLITUDE, FilterName.BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL));
  }

  @ParameterizedTest
  @MethodSource("getDefaultFilterDefinitionsByUsageMapSource")
  void testGetDefaultFilterDefinitionsByUsageMap(
      FilterDefintionByUsageMapRequest request,
      FilterDefsForDistRangesByUsage dummy,
      FilterDefsByUsageTable expectedResult) {
    // We don't care about the underlying FD map structure.

    doReturn(dummy)
        .when(signalEnhancementFilterConfiguration)
        .getDefaultFilterDefinitionByUsageMap();

    doReturn(dummy)
        .when(signalEnhancementFilterConfiguration)
        .getDefaultFilterDefinitionByUsageMap(
            anyString(), anyString(), any(ChannelTypes.class), any(PhaseType.class));
    assertEquals(
        expectedResult,
        signalEnhancementConfigurationService.getDefaultDefinitionByUsageMap(request));
  }

  private static Stream<Arguments> getDefaultFilterDefinitionsByUsageMapSource() {
    var goodChannel2char = Channel.createEntityReference("STA.CG1.BZ");
    var goodChannel3char = Channel.createEntityReference("STA.CG1.BHZ");
    var goodDerivedChannel = Channel.createEntityReference("STA.BEAM.BHZ/some-beam-stuff");
    var badChannelNot3Parts = Channel.createEntityReference("STA.BHZ");
    var badChannelBadCodeLength = Channel.createEntityReference("STA.CG1.BHZ1");
    var badChannelEmptyPrecedingSlash = Channel.createEntityReference("/some-beam-stuff");

    var goodChannels = Set.of(goodChannel2char, goodChannel3char, goodDerivedChannel);
    var phases = Set.of(PhaseType.P, PhaseType.S);

    var dummyFd = Mockito.mock(FilterDefinition.class);
    given(dummyFd.getUniqueIdentifier()).willReturn(UUID.nameUUIDFromBytes("1".getBytes()));
    var dummyFdForDr = new FilterDefinitionIdForDistanceRange(dummyFd.getUniqueIdentifier());
    var dummyFdByUsageMap = Map.of(FilterDefinitionUsage.FK, List.of(dummyFdForDr));
    var dummyFdsById = Map.of(dummyFd.getUniqueIdentifier(), dummyFd);

    var dummyFdForDrByUsage = new FilterDefsForDistRangesByUsage(dummyFdByUsageMap, dummyFdsById);

    return Stream.of(
        Arguments.arguments(
            new FilterDefintionByUsageMapRequest(goodChannels, phases),
            dummyFdForDrByUsage,
            getDummyFilterDefsByUsageTable(goodChannels, phases, dummyFdForDrByUsage)),
        Arguments.arguments(
            new FilterDefintionByUsageMapRequest(
                Stream.of(goodChannels, Set.of(badChannelNot3Parts))
                    .flatMap(Collection::stream)
                    .collect(Collectors.toSet()),
                phases),
            dummyFdForDrByUsage,
            getDummyFilterDefsByUsageTable(goodChannels, phases, dummyFdForDrByUsage)),
        Arguments.arguments(
            new FilterDefintionByUsageMapRequest(
                Stream.of(goodChannels, Set.of(badChannelBadCodeLength))
                    .flatMap(Collection::stream)
                    .collect(Collectors.toSet()),
                phases),
            dummyFdForDrByUsage,
            getDummyFilterDefsByUsageTable(goodChannels, phases, dummyFdForDrByUsage)),
        Arguments.arguments(
            new FilterDefintionByUsageMapRequest(
                Stream.of(goodChannels, Set.of(badChannelEmptyPrecedingSlash))
                    .flatMap(Collection::stream)
                    .collect(Collectors.toSet()),
                phases),
            dummyFdForDrByUsage,
            getDummyFilterDefsByUsageTable(goodChannels, phases, dummyFdForDrByUsage)),
        // Handle 2 channels with same name but different structure
        Arguments.arguments(
            new FilterDefintionByUsageMapRequest(
                Stream.of(
                        goodChannels,
                        Set.of(goodChannel2char.toBuilder().setEffectiveAt(Instant.EPOCH).build()))
                    .flatMap(Collection::stream)
                    .collect(Collectors.toSet()),
                phases),
            dummyFdForDrByUsage,
            getDummyFilterDefsByUsageTable(goodChannels, phases, dummyFdForDrByUsage)));
  }

  private static FilterDefsByUsageTable getDummyFilterDefsByUsageTable(
      Collection<Channel> channels,
      Collection<PhaseType> phases,
      FilterDefsForDistRangesByUsage dummyFdsForDrByUsage) {
    var tableBuilder =
        ImmutableTable
            .<String, PhaseType,
                Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                builder();

    channels.stream()
        .forEach(
            channel ->
                phases.stream()
                    .forEach(
                        phase ->
                            tableBuilder.put(
                                channel.getName(),
                                phase,
                                dummyFdsForDrByUsage.filterDefIdsForDistanceRangesByUsage())));

    return new FilterDefsByUsageTable(
        tableBuilder.build(),
        dummyFdsForDrByUsage.filterDefIdsForDistanceRangesByUsage(),
        dummyFdsForDrByUsage.filterDefinitionsById());
  }
}
