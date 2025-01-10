package gms.shared.signalenhancement.controller;

import static com.google.common.base.Preconditions.checkNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import com.google.common.collect.ImmutableTable;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.derivedchannel.coi.BeamTestFixtures;
import gms.shared.derivedchannel.coi.BeamformingTemplate;
import gms.shared.frameworks.configuration.RetryConfig;
import gms.shared.frameworks.configuration.repository.FileConfigurationRepository;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
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
import gms.shared.signalenhancement.api.RotationTemplateByPhaseByStation;
import gms.shared.signalenhancement.api.RotationTemplateRequest;
import gms.shared.signalenhancement.api.SignalDetectionHypothesisFilterDefinitionByFilterDefinitionUsagePair;
import gms.shared.signalenhancement.api.webclient.FkReviewablePhasesRequest;
import gms.shared.signalenhancement.coi.filter.FilterDefinitionIdForDistanceRange;
import gms.shared.signalenhancement.coi.filter.FilterDefsByUsageTable;
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
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
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
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
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
import org.springframework.http.HttpStatus;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ExtendWith(MockitoExtension.class)
class SignalEnhancementConfigurationControllerTest {

  private static final String WILD_CARD = "*";
  private static final int CUSTOM_PARTIAL_RESPONSE_CODE = 209;
  private ConfigurationConsumerUtility configurationConsumerUtility;

  SignalEnhancementConfigurationController signalEnhancementConfigurationController;
  SignalEnhancementConfiguration signalEnhancementFilterConfiguration;

  ConfigurationTestUtility testUtility;
  SignalEnhancementConfigurationService signalEnhancementConfigurationService;
  Map<String, FilterDefinition> filterDefinitionMap;
  ProcessingMaskDefinitionConfiguration processingMaskDefinitionConfiguration;

  @Mock SignalDetectionFacetingUtility signalDetectionFacetingUtility;

  @Mock StationDefinitionAccessor stationDefinitionAccessor;

  @Mock RotationConfiguration rotationConfiguration;

  @BeforeAll
  void init() {
    var configurationRoot =
        checkNotNull(
                Thread.currentThread().getContextClassLoader().getResource("configuration-base"))
            .getPath();

    configurationConsumerUtility =
        ConfigurationConsumerUtility.builder(
                FileConfigurationRepository.create(new File(configurationRoot).toPath()))
            .retryConfiguration(RetryConfig.create(1, 2, ChronoUnit.SECONDS, 1))
            .build();

    processingMaskDefinitionConfiguration =
        new ProcessingMaskDefinitionConfiguration(configurationConsumerUtility);
  }

  @BeforeEach
  void setUp() {
    signalEnhancementFilterConfiguration =
        new SignalEnhancementConfiguration(
            stationDefinitionAccessor,
            configurationConsumerUtility,
            processingMaskDefinitionConfiguration);
    signalEnhancementFilterConfiguration.filterListDefinitionConfig =
        "global.filter-list-definition";
    signalEnhancementFilterConfiguration.filterMetadataConfig = "global.filter-metadata";
    processingMaskDefinitionConfiguration.processingMaskDefinitionConfig =
        "global.processing-mask-definition";
    signalEnhancementFilterConfiguration.signalEnhancementBeamformingConfig =
        "global.beamforming-configuration";

    testUtility = new ConfigurationTestUtility(configurationConsumerUtility);
    signalEnhancementConfigurationService =
        new SignalEnhancementConfigurationService(
            signalEnhancementFilterConfiguration,
            rotationConfiguration,
            stationDefinitionAccessor,
            signalDetectionFacetingUtility);
    filterDefinitionMap = testUtility.filterDefinitionMap();

    signalEnhancementConfigurationController =
        new SignalEnhancementConfigurationController(signalEnhancementConfigurationService);
  }

  @Test
  void testGetBeamformingTemplate() {
    Station txarStation = BeamTestFixtures.TXAR_STATION;
    PhaseType pt = PhaseType.P;
    BeamType bt = BeamTestFixtures.TXAR_BEAMFORMING_TEMPLATE.getBeamDescription().getBeamType();
    var secServiceMock = Mockito.mock(SignalEnhancementConfigurationService.class);

    var request =
        BeamformingTemplatesRequest.builder()
            .setStations(List.of(txarStation))
            .setBeamType(bt)
            .setPhases(List.of(pt))
            .build();

    var templatesTable =
        ImmutableTable.of(
            txarStation.getName(), pt.getLabel(), Mockito.mock(BeamformingTemplate.class));

    Mockito.when(secServiceMock.getBeamformingTemplates(request)).thenReturn(templatesTable);

    var result =
        new SignalEnhancementConfigurationController(secServiceMock)
            .getBeamformingTemplates(request);

    assertEquals(HttpStatus.OK.value(), result.getStatusCode().value());
    assertEquals(templatesTable, result.getBody());
  }

  @Test
  void testGetBeamformingTemplatesPartialResponse() {
    var asarStation = Station.createEntityReference("ASAR");
    var pdarStation = Station.createEntityReference("PDAR");
    var txarStation = Station.createEntityReference("TXAR");
    BeamType bt = BeamTestFixtures.TXAR_BEAMFORMING_TEMPLATE.getBeamDescription().getBeamType();
    var secServiceMock = Mockito.mock(SignalEnhancementConfigurationService.class);

    var request =
        BeamformingTemplatesRequest.builder()
            .setStations(List.of(asarStation, pdarStation, txarStation))
            .setBeamType(bt)
            .setPhases(List.of(PhaseType.P, PhaseType.S))
            .build();

    var partialTable =
        ImmutableTable.<String, String, BeamformingTemplate>builder()
            .put(
                asarStation.getName(),
                PhaseType.P.toString(),
                Mockito.mock(BeamformingTemplate.class))
            .put(
                asarStation.getName(),
                PhaseType.S.toString(),
                Mockito.mock(BeamformingTemplate.class))
            .put(
                pdarStation.getName(),
                PhaseType.S.toString(),
                Mockito.mock(BeamformingTemplate.class))
            .put(
                txarStation.getName(),
                PhaseType.P.toString(),
                Mockito.mock(BeamformingTemplate.class))
            .build();

    Mockito.when(secServiceMock.getBeamformingTemplates(request)).thenReturn(partialTable);

    var result =
        new SignalEnhancementConfigurationController(secServiceMock)
            .getBeamformingTemplates(request);

    assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, result.getStatusCode().value());
    assertEquals(partialTable, result.getBody());
  }

  @Test
  void testGetFkSpectraTemplates() {
    var asarStation = Station.createEntityReference("ASAR");
    var secServiceMock = Mockito.mock(SignalEnhancementConfigurationService.class);

    var request = new FkSpectraTemplatesRequest(List.of(asarStation), List.of(PhaseType.P));
    var templatesTable =
        ImmutableTable.of(
            asarStation.getName(), PhaseType.P.toString(), Mockito.mock(FkSpectraTemplate.class));

    Mockito.when(secServiceMock.getFkSpectraTemplates(request)).thenReturn(templatesTable);

    var result =
        new SignalEnhancementConfigurationController(secServiceMock).getFkSpectraTemplates(request);

    assertEquals(HttpStatus.OK.value(), result.getStatusCode().value());
    assertEquals(templatesTable, result.getBody());
  }

  @Test
  void testGetFkSpectraTemplatesPartialResponse() {
    var asarStation = Station.createEntityReference("ASAR");
    var pdarStation = Station.createEntityReference("PDAR");
    var txarStation = Station.createEntityReference("TXAR");
    var secServiceMock = Mockito.mock(SignalEnhancementConfigurationService.class);

    var request =
        new FkSpectraTemplatesRequest(
            List.of(asarStation, pdarStation, txarStation), List.of(PhaseType.P, PhaseType.S));
    var partialTable =
        ImmutableTable.<String, String, FkSpectraTemplate>builder()
            .put(
                asarStation.getName(),
                PhaseType.P.toString(),
                Mockito.mock(FkSpectraTemplate.class))
            .put(
                asarStation.getName(),
                PhaseType.S.toString(),
                Mockito.mock(FkSpectraTemplate.class))
            .put(
                pdarStation.getName(),
                PhaseType.S.toString(),
                Mockito.mock(FkSpectraTemplate.class))
            .put(
                txarStation.getName(),
                PhaseType.P.toString(),
                Mockito.mock(FkSpectraTemplate.class))
            .build();

    Mockito.when(secServiceMock.getFkSpectraTemplates(request)).thenReturn(partialTable);

    var result =
        new SignalEnhancementConfigurationController(secServiceMock).getFkSpectraTemplates(request);

    assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, result.getStatusCode().value());
    assertEquals(partialTable, result.getBody());
  }

  @Test
  void testGetFkReviewablePhases() {
    var asarStation = Station.createEntityReference("ASAR");
    var activity = WorkflowDefinitionId.from("Some Activity");
    var secServiceMock = Mockito.mock(SignalEnhancementConfigurationService.class);

    var request = new FkReviewablePhasesRequest(List.of(asarStation), activity);
    var reviewablePhasesMap = Map.of(asarStation, Set.of(PhaseType.P));
    Mockito.when(secServiceMock.getFkReviewablePhases(request)).thenReturn(reviewablePhasesMap);

    var result =
        new SignalEnhancementConfigurationController(secServiceMock).getFkReviewablePhases(request);
    var expectedBody =
        reviewablePhasesMap.entrySet().stream()
            .collect(Collectors.toMap(entry -> entry.getKey().getName(), Entry::getValue));

    assertEquals(HttpStatus.OK.value(), result.getStatusCode().value());
    assertEquals(expectedBody, result.getBody());
  }

  @Test
  void testGetFkReviewablePhasesPartialResponse() {
    var asarStation = Station.createEntityReference("ASAR");
    var pdarStation = Station.createEntityReference("PDAR");
    var txarStation = Station.createEntityReference("TXAR");
    var activity = WorkflowDefinitionId.from("Some Activity");
    var secServiceMock = Mockito.mock(SignalEnhancementConfigurationService.class);

    var request =
        new FkReviewablePhasesRequest(List.of(asarStation, pdarStation, txarStation), activity);
    var partialReviewablePhasesMap =
        Map.of(asarStation, Set.of(PhaseType.P), txarStation, Set.of(PhaseType.P, PhaseType.S));
    Mockito.when(secServiceMock.getFkReviewablePhases(request))
        .thenReturn(partialReviewablePhasesMap);

    var result =
        new SignalEnhancementConfigurationController(secServiceMock).getFkReviewablePhases(request);
    var expectedBody =
        partialReviewablePhasesMap.entrySet().stream()
            .collect(Collectors.toMap(entry -> entry.getKey().getName(), Entry::getValue));

    assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, result.getStatusCode().value());
    assertEquals(expectedBody, result.getBody());
  }

  @Test
  void testGetDefaultFilterDefinitionsByUsageMap() {
    var channel = Channel.createEntityReference("Channel1");
    var phaseType = PhaseType.I;
    var secServiceMock = Mockito.mock(SignalEnhancementConfigurationService.class);

    var request = new FilterDefintionByUsageMapRequest(Set.of(channel), Set.of(phaseType));

    var dummyFd = Mockito.mock(FilterDefinition.class);
    given(dummyFd.getUniqueIdentifier()).willReturn(UUID.nameUUIDFromBytes("1".getBytes()));
    var dummyFdForDr = new FilterDefinitionIdForDistanceRange(dummyFd.getUniqueIdentifier());
    var dummyFdByUsageMap = Map.of(FilterDefinitionUsage.FK, List.of(dummyFdForDr));

    var fdIdByUsageTable =
        ImmutableTable
            .<String, PhaseType,
                Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                builder()
            .put(channel.getName(), phaseType, dummyFdByUsageMap)
            .put(channel.getName(), PhaseType.UNSET, dummyFdByUsageMap)
            .build();

    var globalDefaultsMap =
        Map.of(
            FilterDefinitionUsage.FK,
            List.of(
                new FilterDefinitionIdForDistanceRange(
                    dummyFd.getUniqueIdentifier(), Optional.empty())));

    var filterDefinitionsById = Map.of(dummyFd.getUniqueIdentifier(), dummyFd);

    var table =
        new FilterDefsByUsageTable(fdIdByUsageTable, globalDefaultsMap, filterDefinitionsById);

    Mockito.when(secServiceMock.getDefaultDefinitionByUsageMap(any())).thenReturn(table);

    var result =
        new SignalEnhancementConfigurationController(secServiceMock)
            .getDefaultFilterDefinitionsByUsageMap(request);

    assertEquals(HttpStatus.OK.value(), result.getStatusCode().value());
    assertEquals(table, result.getBody());
  }

  @Test
  void testGetDefaultFilterDefinitionsByUsageMap209() {
    var channel = Channel.createEntityReference("Channel1");
    var phaseType = PhaseType.I;
    var secServiceMock = Mockito.mock(SignalEnhancementConfigurationService.class);

    var request = new FilterDefintionByUsageMapRequest(Set.of(channel), Set.of(phaseType));

    var fd1 = Mockito.mock(FilterDefinition.class);
    given(fd1.getUniqueIdentifier()).willReturn(UUID.nameUUIDFromBytes("1".getBytes()));
    var fdForDr1 = new FilterDefinitionIdForDistanceRange(fd1.getUniqueIdentifier());
    var fdByUsageMap1 = Map.of(FilterDefinitionUsage.FK, List.of(fdForDr1));

    var fdIdByUsageTable =
        ImmutableTable
            .<String, PhaseType,
                Map<FilterDefinitionUsage, List<FilterDefinitionIdForDistanceRange>>>
                of(channel.getName(), PhaseType.UNSET, fdByUsageMap1);

    var filterDefinitionsById = Map.of(fd1.getUniqueIdentifier(), fd1);

    var globalDefaultsMap =
        Map.of(
            FilterDefinitionUsage.FK,
            List.of(
                new FilterDefinitionIdForDistanceRange(
                    fd1.getUniqueIdentifier(), Optional.empty())));

    var table =
        new FilterDefsByUsageTable(fdIdByUsageTable, globalDefaultsMap, filterDefinitionsById);

    Mockito.when(secServiceMock.getDefaultDefinitionByUsageMap(any())).thenReturn(table);

    var result =
        new SignalEnhancementConfigurationController(secServiceMock)
            .getDefaultFilterDefinitionsByUsageMap(request);

    assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, result.getStatusCode().value());
    assertEquals(table, result.getBody());
  }

  @Test
  void testGetRotationTemplates() {
    var asarStation = Station.createEntityReference("ASAR");
    var phaseType = PhaseType.I;
    var secServiceMock = Mockito.mock(SignalEnhancementConfigurationService.class);

    var request = new RotationTemplateRequest(Set.of(asarStation), Set.of(phaseType));

    var rotationTemplate = RotationTemplateTestFixtures.ROTATION_TEMPLATE_CHANNEL;

    var rotationTemplateTable =
        ImmutableTable.<Station, PhaseType, RotationTemplate>of(
            asarStation, phaseType, rotationTemplate);

    var expectedResult = new RotationTemplateByPhaseByStation(rotationTemplateTable);

    Mockito.when(secServiceMock.getRotationTemplates(any())).thenReturn(rotationTemplateTable);

    var result =
        new SignalEnhancementConfigurationController(secServiceMock).getRotationTemplates(request);

    assertEquals(HttpStatus.OK.value(), result.getStatusCode().value());
    assertEquals(expectedResult, result.getBody());
  }

  @Test
  void testResolveFilterListDefinition() {
    FilterListDefinition filterListDefinition =
        signalEnhancementConfigurationController.getFilterListsDefinition();

    List<FilterList> actualFilterList =
        filterListDefinition.getFilterLists().stream().collect(Collectors.toUnmodifiableList());

    List<FilterList> expectedFilterList =
        testUtility.filterListMap().values().stream().collect(Collectors.toUnmodifiableList());

    Assertions.assertEquals(expectedFilterList, actualFilterList);
  }

  @Test
  void testGetProcessingMaskDefinitionsGoodChannel() {

    var channelVersion1 = Channel.createVersionReference("CMAR.CM01.SHZ", Instant.EPOCH);
    var stationGroup = StationGroup.createEntityReference("Primary");

    var responseEntity =
        signalEnhancementConfigurationController.getProcessingMaskDefinitions(
            ProcessingMaskDefinitionRequest.create(
                Set.of("AMPLITUDE_MEASUREMENT_BEAM"), Set.of(channelVersion1), Set.of("P", "S")));

    Assertions.assertEquals(HttpStatus.OK.value(), responseEntity.getStatusCode().value());

    var result = responseEntity.getBody();

    Assertions.assertNotNull(result);
    Assertions.assertEquals(1, result.getProcessingMaskDefinitionByPhaseByChannel().size());

    result
        .getProcessingMaskDefinitionByPhaseByChannel()
        .get(0)
        .getProcessingMaskDefinitionByPhase()
        .forEach(
            (phase, pmdList) ->
                pmdList.forEach(
                    actual -> {
                      // Use the assumed-to-be-tested configuration utility as the
                      // source of truth and compare against it.
                      var expected =
                          signalEnhancementFilterConfiguration.getProcessingMaskDefinition(
                              actual.processingOperation(), channelVersion1, phase);
                      Assertions.assertEquals(expected, actual);
                    }));
  }

  @Test
  void testGetProcessingMaskDefinitionsBadChannel() {

    var channelVersion1 = Channel.createVersionReference("ABCD.EFGH.IJK", Instant.EPOCH);
    var stationGroup = StationGroup.createEntityReference("Primary");

    var responseEntity =
        signalEnhancementConfigurationController.getProcessingMaskDefinitions(
            ProcessingMaskDefinitionRequest.create(
                Set.of("AMPLITUDE_MEASUREMENT_BEAM"), Set.of(channelVersion1), Set.of("P", "S")));

    Assertions.assertEquals(
        SignalEnhancementConfigurationController.CUSTOM_PARTIAL_RESPONSE_CODE,
        responseEntity.getStatusCode().value());
  }

  @Test
  void testGetProcessingMaskDefinitionsCustomResponseCode() {

    var channelVersion1 = Channel.createVersionReference("BHZ", Instant.EPOCH);

    var stationGroup = StationGroup.createEntityReference("Primary");

    var invalidPhaseResponseEntity =
        signalEnhancementConfigurationController.getProcessingMaskDefinitions(
            ProcessingMaskDefinitionRequest.create(
                Set.of("AMPLITUDE_MEASUREMENT_BEAM"), Set.of(channelVersion1), Set.of("P", "JK")));

    Assertions.assertEquals(
        CUSTOM_PARTIAL_RESPONSE_CODE, invalidPhaseResponseEntity.getStatusCode().value());

    var invalidOperationResponseEntity =
        signalEnhancementConfigurationController.getProcessingMaskDefinitions(
            ProcessingMaskDefinitionRequest.create(
                Set.of("NOPE"), Set.of(channelVersion1), Set.of("P")));

    Assertions.assertEquals(
        CUSTOM_PARTIAL_RESPONSE_CODE, invalidOperationResponseEntity.getStatusCode().value());
  }

  @Test
  void testNullFacetingChannel() {
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
        signalEnhancementConfigurationController
            .getDefaultFilterDefinitionByUsageForChannelSegments(request);

    Assertions.assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, actual.getStatusCode().value());

    assertTrue(actual.hasBody());

    var responseBody = actual.getBody();
    if (responseBody != null) {
      var filterDefinitionByUsageByChannelSegment =
          responseBody.getFilterDefinitionByUsageByChannelSegment();
      assertTrue(filterDefinitionByUsageByChannelSegment.isEmpty());
    }
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
        signalEnhancementConfigurationController
            .getByDefaultFilterDefinitionByUsageForSignalDetectionHypotheses(request);

    Assertions.assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, actual.getStatusCode().value());

    assertTrue(actual.hasBody());

    var responseBody = actual.getBody();
    if (responseBody != null) {
      var filterDefinitionByUsageByChannelSegment =
          responseBody.getFilterDefinitionByUsageBySignalDetectionHypothesis();
      assertTrue(filterDefinitionByUsageByChannelSegment.isEmpty());
    }
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
        signalEnhancementConfigurationController
            .getByDefaultFilterDefinitionByUsageForSignalDetectionHypotheses(request);

    Assertions.assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, actual.getStatusCode().value());

    assertTrue(actual.hasBody());

    var responseBody = actual.getBody();
    if (responseBody != null) {
      var filterDefinitionByUsageByChannelSegment =
          responseBody.getFilterDefinitionByUsageBySignalDetectionHypothesis();
      assertTrue(filterDefinitionByUsageByChannelSegment.isEmpty());
    }
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
    // TODO verify whether maskedBy is needed.  currently set for parameterized tests
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
        signalEnhancementConfigurationController
            .getByDefaultFilterDefinitionByUsageForSignalDetectionHypotheses(request);
    var expected = getSigDetFilterMap(sdh.toEntityReference(), expectedFilterDefinitionsPairs);

    Assertions.assertEquals(expected, actual.getBody());
    Assertions.assertEquals(HttpStatus.OK.value(), actual.getStatusCode().value());
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
            maskedBy);
    var eventHypothesis =
        ConfigurationTestUtility.buildEventHypothesis(
            Location.from(eventHypothesisLatitude, eventHypothesisLongitude, 0, 0));
    var request =
        FilterDefinitionByUsageForChannelSegmentsRequest.builder()
            .setChannelSegments(List.of(cs))
            .setEventHypothesis(eventHypothesis)
            .build();
    var actual =
        signalEnhancementConfigurationController
            .getDefaultFilterDefinitionByUsageForChannelSegments(request);
    var expected = getChanSegFilterMap(cs, expectedFilterDefinitionsPairs);

    Assertions.assertEquals(expected, actual.getBody());
    Assertions.assertEquals(HttpStatus.OK.value(), actual.getStatusCode().value());
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
            "AS31",
            ChannelBandType.BROADBAND,
            ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
            ChannelOrientationType.VERTICAL,
            -23.665,
            133.905,
            PhaseType.P,
            List.of(),
            -23.665,
            134.905,
            List.of(
                Pair.of(
                    FilterDefinitionUsage.DETECTION, FilterName.BW_IIR_LP_0_0_4_2_1_HZ_NON_CAUSAL),
                Pair.of(FilterDefinitionUsage.FK, FilterName.BW_IIR_LP_0_0_4_2_1_HZ_NON_CAUSAL),
                Pair.of(FilterDefinitionUsage.ONSET, FilterName.BW_IIR_LP_0_0_4_2_1_HZ_NON_CAUSAL),
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
      ChannelSegment<Waveform> chanSeg,
      List<Pair<FilterDefinitionUsage, FilterName>> filterDefintionByFilterDefinitionUsuagePairs) {
    FilterDefinitionByFilterDefinitionUsage filterDefinitionByFilterDefinitionUsage =
        FilterDefinitionByFilterDefinitionUsage.from(
            filterDefintionByFilterDefinitionUsuagePairs.stream()
                .map(
                    pair ->
                        Pair.of(
                            pair.getLeft(), filterDefinitionMap.get(pair.getRight().toString())))
                .collect(Collectors.toMap(pair -> pair.getLeft(), pair -> pair.getRight())));
    return FilterDefinitionByUsageByChannelSegment.from(
        List.of(
            ChannelSegmentFilterDefinitionByFilterDefinitionUsagePair.builder()
                .setChannelSegment(chanSeg)
                .setFilterDefinitionByFilterDefinitionUsage(filterDefinitionByFilterDefinitionUsage)
                .build()));
  }
}
