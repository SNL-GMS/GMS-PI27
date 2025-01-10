package gms.shared.signaldetection.repository;

import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE;
import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE;
import static gms.shared.signaldetection.repository.utils.SignalDetectionAccessorTestFixtures.AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.AMPID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.AmplitudeDynParsIntDao;
import gms.shared.signaldetection.dao.css.AmplitudeDynParsIntKey;
import gms.shared.signaldetection.dao.css.ArrivalDynParsIntDao;
import gms.shared.signaldetection.dao.css.ArrivalDynParsIntKey;
import gms.shared.signaldetection.dao.css.enums.AmplitudeType;
import gms.shared.signaldetection.database.connector.AmplitudeDynParsIntDatabaseConnector;
import gms.shared.signaldetection.database.connector.ArrivalDynParsIntDatabaseConnector;
import gms.shared.signaldetection.repository.utils.AmplitudeDaoAndChannelAssociation;
import gms.shared.signaldetection.util.SourcedWfdisc;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.WfTagKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.repository.BridgedChannelRepository;
import gms.shared.stationdefinition.repository.BridgedFilterDefinitionRepository;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SdhBridgeHelperUtilityTest {

  @Mock private BridgedChannelRepository bridgedChannelRepository;

  @Mock private SignalDetectionBridgeDatabaseConnectors signalDetectionBridgeDatabaseConnectors;

  @Mock private BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository;

  @InjectMocks private SdhBridgeHelperUtility sdhBridgeHelperUtility;

  @Mock private ArrivalDynParsIntDatabaseConnector arrivalDynParsIntDatabaseConnector;

  @Mock private AmplitudeDynParsIntDatabaseConnector amplitudeDynParsIntDatabaseConnector;

  private static final long BASE_WFID = 100L;

  private static final long BASE_ARID = 200L;

  private static final long BASE_FILTERID = 300L;

  private static final String BASE_STAGEID = "MY-STAGE";

  private static final String BASE_RAW_FILTERED_NAME =
      "RAW" + BASE_ARID + BASE_FILTERID + BASE_WFID + BASE_STAGEID;

  private static final String BASE_RAW_UNFILTERED_NAME =
      "RAW" + BASE_ARID + BASE_WFID + BASE_STAGEID;

  private static final String BASE_DERIVED_FILTERED_NAME =
      "DERIVED" + BASE_ARID + BASE_FILTERID + BASE_WFID + BASE_STAGEID;

  private static final String BASE_DERIVED_UNFILTERED_NAME =
      "DERIVED" + BASE_ARID + BASE_WFID + BASE_STAGEID;

  private static final String DEFAULT_CHANNAL_NAME = "DEFAULT";

  @ParameterizedTest
  @MethodSource("testCreateFilteredChannelForArrivalRawSource")
  void testCreateFilteredChannelForArrivalRaw(boolean fdReturned) {

    var mockWfdisc = Mockito.mock(WfdiscDao.class);

    Mockito.when(mockWfdisc.getId()).thenReturn(BASE_WFID);

    var sourcedWfdisc = SourcedWfdisc.create(mockWfdisc);

    var workflowDefinitionId = WorkflowDefinitionId.from(BASE_STAGEID);

    var arivalDpiList = List.<ArrivalDynParsIntDao>of();

    if (fdReturned) {
      Mockito.when(
              bridgedChannelRepository.filteredRawChannelFromWfdisc(
                  eq(List.of(BASE_WFID)), any(), any(), eq(BASE_FILTERID)))
          .thenReturn(Channel.createVersionReference(BASE_RAW_FILTERED_NAME, Instant.EPOCH));

      var adpiDao = mock(ArrivalDynParsIntDao.class);
      var key1 = new ArrivalDynParsIntKey();

      key1.setArid(0);
      key1.setGroupName("ONSET");

      when(adpiDao.getArrivalDynParsIntKey()).thenReturn(key1);
      when(adpiDao.getIvalue()).thenReturn(BASE_FILTERID);

      arivalDpiList = List.of(adpiDao);

    } else {
      Mockito.when(
              bridgedChannelRepository.rawChannelFromWfdisc(eq(List.of(BASE_WFID)), any(), any()))
          .thenReturn(Channel.createVersionReference(BASE_RAW_UNFILTERED_NAME, Instant.EPOCH));
    }

    Mockito.when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(Set.of(BASE_ARID)))
        .thenReturn(arivalDpiList);

    Mockito.when(
            signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                BASE_STAGEID, ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(arrivalDynParsIntDatabaseConnector);

    var optionalChannel =
        sdhBridgeHelperUtility.createFilteredChannelForArrival(
            sourcedWfdisc, BASE_ARID, workflowDefinitionId);

    Assertions.assertTrue(optionalChannel.isPresent());

    var expectedName = fdReturned ? BASE_RAW_FILTERED_NAME : BASE_RAW_UNFILTERED_NAME;

    Assertions.assertEquals(expectedName, optionalChannel.get().getName());
  }

  private static Stream<Arguments> testCreateFilteredChannelForArrivalRawSource() {
    return Stream.of(Arguments.arguments(true), Arguments.arguments(false));
  }

  @ParameterizedTest
  @MethodSource("testCreateFilteredChannelForArrivalDerivedSource")
  void testCreateFilteredChannelForArrivalDerived(boolean fdReturned) {

    var mockWfdisc = Mockito.mock(WfdiscDao.class);

    Mockito.when(mockWfdisc.getId()).thenReturn(BASE_WFID);

    var wfTagKey = new WfTagKey();

    var wfTagDao = new WfTagDao();
    wfTagDao.setWfTagKey(wfTagKey);

    var sourcedWfdisc = SourcedWfdisc.create(mockWfdisc, wfTagDao);

    var workflowDefinitionId = WorkflowDefinitionId.from(BASE_STAGEID);

    var arivalDpiList = List.<ArrivalDynParsIntDao>of();

    if (fdReturned) {
      Mockito.when(
              bridgedChannelRepository.filteredBeamedChannelFromWfdisc(
                  eq(List.of(BASE_WFID)), any(), any(), any(), any(), eq(BASE_FILTERID)))
          .thenReturn(Channel.createVersionReference(BASE_DERIVED_FILTERED_NAME, Instant.EPOCH));

      var adpiDao = mock(ArrivalDynParsIntDao.class);
      var key1 = new ArrivalDynParsIntKey();

      key1.setArid(0);
      key1.setGroupName("ONSET");

      when(adpiDao.getArrivalDynParsIntKey()).thenReturn(key1);
      when(adpiDao.getIvalue()).thenReturn(BASE_FILTERID);

      arivalDpiList = List.of(adpiDao);

    } else {
      Mockito.when(
              bridgedChannelRepository.beamedChannelFromWfdisc(
                  eq(List.of(BASE_WFID)), any(), any(), any(), any()))
          .thenReturn(Channel.createVersionReference(BASE_DERIVED_UNFILTERED_NAME, Instant.EPOCH));
    }

    Mockito.when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(Set.of(BASE_ARID)))
        .thenReturn(arivalDpiList);

    Mockito.when(
            signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                BASE_STAGEID, ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(arrivalDynParsIntDatabaseConnector);

    var optionalChannel =
        sdhBridgeHelperUtility.createFilteredChannelForArrival(
            sourcedWfdisc, BASE_ARID, workflowDefinitionId);

    Assertions.assertTrue(optionalChannel.isPresent());

    var expectedName = fdReturned ? BASE_DERIVED_FILTERED_NAME : BASE_DERIVED_UNFILTERED_NAME;

    Assertions.assertEquals(expectedName, optionalChannel.get().getName());
  }

  private static Stream<Arguments> testCreateFilteredChannelForArrivalDerivedSource() {
    return Stream.of(Arguments.arguments(true), Arguments.arguments(false));
  }

  @ParameterizedTest
  @MethodSource("testCreateFilteredChannelForAmplitudeRawSource")
  void testCreateFilteredChannelForAmplitudeRaw(boolean fdReturned) {

    var mockWfdisc = Mockito.mock(WfdiscDao.class);

    Mockito.when(mockWfdisc.getId()).thenReturn(BASE_WFID);

    var sourcedWfdisc = SourcedWfdisc.create(mockWfdisc);

    var workflowDefinitionId = WorkflowDefinitionId.from(BASE_STAGEID);

    var ampDpiList = List.<AmplitudeDynParsIntDao>of();

    if (fdReturned) {
      Mockito.when(
              bridgedChannelRepository.filteredRawChannelFromWfdisc(
                  eq(List.of(BASE_WFID)), any(), any(), eq(BASE_FILTERID)))
          .thenReturn(Channel.createVersionReference(BASE_RAW_FILTERED_NAME, Instant.EPOCH));

      var adpiDao = mock(AmplitudeDynParsIntDao.class);
      var key1 = new AmplitudeDynParsIntKey();

      key1.setAmpid(0);
      key1.setGroupName("ONSET");

      // when(adpiDao.getAmplitudeDynParsIntKey()).thenReturn(key1);
      when(adpiDao.getIvalue()).thenReturn(BASE_FILTERID);

      ampDpiList = List.of(adpiDao);
    } else {
      Mockito.when(
              bridgedChannelRepository.rawChannelFromWfdisc(eq(List.of(BASE_WFID)), any(), any()))
          .thenReturn(Channel.createVersionReference(BASE_RAW_UNFILTERED_NAME, Instant.EPOCH));
    }

    Mockito.when(amplitudeDynParsIntDatabaseConnector.findFilterAdpisByIds(Set.of(BASE_ARID)))
        .thenReturn(ampDpiList);

    Mockito.when(
            signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                BASE_STAGEID, AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(amplitudeDynParsIntDatabaseConnector);

    var amplitudeDao = Mockito.mock(AmplitudeDao.class);

    Mockito.when(amplitudeDao.getAmplitudeType())
        .thenReturn(AmplitudeType.AMPLITUDE_A5_OVER_2.getName());

    Mockito.when(amplitudeDao.getId()).thenReturn(BASE_ARID);

    var optionalChannel =
        sdhBridgeHelperUtility.createFilteredChannelForAmplitude(
            sourcedWfdisc, amplitudeDao, workflowDefinitionId);

    var expectedName = fdReturned ? BASE_RAW_FILTERED_NAME : BASE_RAW_UNFILTERED_NAME;

    Assertions.assertEquals(expectedName, optionalChannel.get().getName());
  }

  private static Stream<Arguments> testCreateFilteredChannelForAmplitudeRawSource() {
    return Stream.of(Arguments.arguments(true), Arguments.arguments(false));
  }

  @Test
  void testCreateAmplitudeAssociations() {

    var mockWfdisc = Mockito.mock(WfdiscDao.class);

    Mockito.when(mockWfdisc.getId()).thenReturn(BASE_WFID);
    Mockito.when(mockWfdisc.getTime()).thenReturn(Instant.MIN);
    Mockito.when(mockWfdisc.getEndTime()).thenReturn(Instant.MIN);

    var sourcedWfdisc = SourcedWfdisc.create(mockWfdisc);

    var workflowDefinitionId = WorkflowDefinitionId.from(BASE_STAGEID);

    Mockito.when(
            bridgedChannelRepository.filteredRawChannelFromWfdisc(
                eq(List.of(BASE_WFID)), any(), any(), eq(BASE_FILTERID)))
        .thenReturn(Channel.createVersionReference(BASE_DERIVED_FILTERED_NAME, Instant.EPOCH));

    var adpiDao = mock(AmplitudeDynParsIntDao.class);
    var key1 = new AmplitudeDynParsIntKey();

    key1.setAmpid(0);
    key1.setGroupName("ONSET");

    when(adpiDao.getIvalue()).thenReturn(BASE_FILTERID);

    var ampDpiList = List.of(adpiDao);

    var amplitudeDao = Mockito.mock(AmplitudeDao.class);

    Mockito.when(amplitudeDao.getAmplitudeType())
        .thenReturn(AmplitudeType.AMPLITUDE_A5_OVER_2.getName());

    Mockito.when(amplitudeDao.getId()).thenReturn(BASE_ARID);

    var amplitudeDaos = List.of(amplitudeDao);

    Mockito.when(amplitudeDynParsIntDatabaseConnector.findFilterAdpisByIds(Set.of(BASE_ARID)))
        .thenReturn(ampDpiList);

    Mockito.when(
            signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                BASE_STAGEID, AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(amplitudeDynParsIntDatabaseConnector);

    var ampChannelPairs =
        sdhBridgeHelperUtility.createAmplitudeDaoChannelMap(
            amplitudeDaos, sourcedWfdisc, workflowDefinitionId);

    var ampChannel =
        ampChannelPairs.stream()
            .filter(pair -> pair.getKey().equals(amplitudeDao))
            .findAny()
            .map(Pair::getValue)
            .get();

    Assertions.assertEquals(BASE_DERIVED_FILTERED_NAME, ampChannel.getName());
  }

  @Test
  void testCreateAnalysisWaveformNominal() {

    var mockWfdisc = Mockito.mock(WfdiscDao.class);

    Mockito.when(mockWfdisc.getId()).thenReturn(BASE_WFID);
    Mockito.when(mockWfdisc.getTime()).thenReturn(Instant.MIN);
    Mockito.when(mockWfdisc.getEndTime()).thenReturn(Instant.MAX);

    var wfTagKey = new WfTagKey();

    var wfTagDao = new WfTagDao();
    wfTagDao.setWfTagKey(wfTagKey);

    var sourcedWfdisc = SourcedWfdisc.create(mockWfdisc, wfTagDao);

    var workflowDefinitionId = WorkflowDefinitionId.from(BASE_STAGEID);

    var adpiDao = mock(ArrivalDynParsIntDao.class);
    var key1 = new ArrivalDynParsIntKey();

    key1.setArid(0);
    key1.setGroupName("ONSET");

    when(adpiDao.getArrivalDynParsIntKey()).thenReturn(key1);
    when(adpiDao.getIvalue()).thenReturn(BASE_FILTERID);

    var arivalDpiList = List.of(adpiDao);

    Mockito.when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(Set.of(BASE_ARID)))
        .thenReturn(arivalDpiList);

    Mockito.when(
            signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                BASE_STAGEID, ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(arrivalDynParsIntDatabaseConnector);

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

    Mockito.when(
            bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(
                Set.of(BASE_FILTERID)))
        .thenReturn(Map.of(BASE_FILTERID, filterDefinition));

    var channel = Channel.createVersionReference("Test", Instant.EPOCH);

    Mockito.when(
            bridgedChannelRepository.beamedChannelFromWfdisc(
                eq(List.of(BASE_WFID)), any(), any(), any(), any()))
        .thenReturn(channel);

    var actual =
        sdhBridgeHelperUtility.createAnalysisWaveform(
            sourcedWfdisc, BASE_ARID, workflowDefinitionId);

    Assertions.assertEquals(filterDefinition, actual.getFilterDefinition().get());

    Assertions.assertEquals(FilterDefinitionUsage.ONSET, actual.getFilterDefinitionUsage().get());

    Assertions.assertEquals(Instant.MIN, actual.getWaveform().getId().getStartTime());
    Assertions.assertEquals(Instant.MIN, actual.getWaveform().getId().getCreationTime());
    Assertions.assertEquals(Instant.MAX, actual.getWaveform().getId().getEndTime());

    Assertions.assertEquals(channel, actual.getWaveform().getId().getChannel());
  }

  @Test
  void testCreateAnalysisWaveformNoFd() {

    var mockWfdisc = Mockito.mock(WfdiscDao.class);

    Mockito.when(mockWfdisc.getId()).thenReturn(BASE_WFID);
    Mockito.when(mockWfdisc.getTime()).thenReturn(Instant.MIN);
    Mockito.when(mockWfdisc.getEndTime()).thenReturn(Instant.MAX);

    var wfTagKey = new WfTagKey();

    var wfTagDao = new WfTagDao();
    wfTagDao.setWfTagKey(wfTagKey);

    var sourcedWfdisc = SourcedWfdisc.create(mockWfdisc, wfTagDao);

    var workflowDefinitionId = WorkflowDefinitionId.from(BASE_STAGEID);

    var adpiDao = mock(ArrivalDynParsIntDao.class);
    var key1 = new ArrivalDynParsIntKey();

    key1.setArid(0);
    key1.setGroupName("ONSET");

    when(adpiDao.getArrivalDynParsIntKey()).thenReturn(key1);
    when(adpiDao.getIvalue()).thenReturn(BASE_FILTERID);

    var arivalDpiList = List.of(adpiDao);

    Mockito.when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(Set.of(BASE_ARID)))
        .thenReturn(arivalDpiList);

    Mockito.when(
            signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                BASE_STAGEID, ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(arrivalDynParsIntDatabaseConnector);

    Mockito.when(
            bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(
                Set.of(BASE_FILTERID)))
        .thenReturn(Map.of());

    var channel = Channel.createVersionReference("Test", Instant.EPOCH);

    Mockito.when(
            bridgedChannelRepository.beamedChannelFromWfdisc(
                eq(List.of(BASE_WFID)), any(), any(), any(), any()))
        .thenReturn(channel);

    var actual =
        sdhBridgeHelperUtility.createAnalysisWaveform(
            sourcedWfdisc, BASE_ARID, workflowDefinitionId);

    Assertions.assertTrue(actual.getFilterDefinition().isEmpty());

    Assertions.assertEquals(FilterDefinitionUsage.ONSET, actual.getFilterDefinitionUsage().get());

    Assertions.assertEquals(Instant.MIN, actual.getWaveform().getId().getStartTime());
    Assertions.assertEquals(Instant.MIN, actual.getWaveform().getId().getCreationTime());
    Assertions.assertEquals(Instant.MAX, actual.getWaveform().getId().getEndTime());

    Assertions.assertEquals(channel, actual.getWaveform().getId().getChannel());
  }

  @Test
  void testCreateAnalysisWaveformNoAdpiBeam() {

    var mockWfdisc = Mockito.mock(WfdiscDao.class);

    Mockito.when(mockWfdisc.getId()).thenReturn(BASE_WFID);
    Mockito.when(mockWfdisc.getTime()).thenReturn(Instant.MIN);
    Mockito.when(mockWfdisc.getEndTime()).thenReturn(Instant.MAX);

    var wfTagKey = new WfTagKey();

    var wfTagDao = new WfTagDao();
    wfTagDao.setWfTagKey(wfTagKey);

    var sourcedWfdisc = SourcedWfdisc.create(mockWfdisc, wfTagDao);

    var workflowDefinitionId = WorkflowDefinitionId.from(BASE_STAGEID);

    Mockito.when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(Set.of(BASE_ARID)))
        .thenReturn(List.of());

    Mockito.when(
            signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                BASE_STAGEID, ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(arrivalDynParsIntDatabaseConnector);

    var channel = Channel.createVersionReference("Test", Instant.EPOCH);

    Mockito.when(
            bridgedChannelRepository.beamedChannelFromWfdisc(
                eq(List.of(BASE_WFID)), any(), any(), any(), any()))
        .thenReturn(channel);

    var actual =
        sdhBridgeHelperUtility.createAnalysisWaveform(
            sourcedWfdisc, BASE_ARID, workflowDefinitionId);

    Assertions.assertTrue(actual.getFilterDefinition().isEmpty());

    Assertions.assertEquals(FilterDefinitionUsage.FK, actual.getFilterDefinitionUsage().get());

    Assertions.assertEquals(Instant.MIN, actual.getWaveform().getId().getStartTime());
    Assertions.assertEquals(Instant.MIN, actual.getWaveform().getId().getCreationTime());
    Assertions.assertEquals(Instant.MAX, actual.getWaveform().getId().getEndTime());

    Assertions.assertEquals(channel, actual.getWaveform().getId().getChannel());
  }

  @Test
  void testCreateAnalysisWaveformNoAdpiRaw() {

    var mockWfdisc = Mockito.mock(WfdiscDao.class);

    Mockito.when(mockWfdisc.getId()).thenReturn(BASE_WFID);
    Mockito.when(mockWfdisc.getTime()).thenReturn(Instant.MIN);
    Mockito.when(mockWfdisc.getEndTime()).thenReturn(Instant.MAX);

    var sourcedWfdisc = SourcedWfdisc.create(mockWfdisc);

    var workflowDefinitionId = WorkflowDefinitionId.from(BASE_STAGEID);

    Mockito.when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(Set.of(BASE_ARID)))
        .thenReturn(List.of());

    Mockito.when(
            signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                BASE_STAGEID, ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(arrivalDynParsIntDatabaseConnector);

    var channel = Channel.createVersionReference("Test", Instant.EPOCH);

    Mockito.when(
            bridgedChannelRepository.rawChannelFromWfdisc(eq(List.of(BASE_WFID)), any(), any()))
        .thenReturn(channel);

    var actual =
        sdhBridgeHelperUtility.createAnalysisWaveform(
            sourcedWfdisc, BASE_ARID, workflowDefinitionId);

    Assertions.assertTrue(actual.getFilterDefinition().isEmpty());

    Assertions.assertEquals(FilterDefinitionUsage.ONSET, actual.getFilterDefinitionUsage().get());

    Assertions.assertEquals(Instant.MIN, actual.getWaveform().getId().getStartTime());
    Assertions.assertEquals(Instant.MIN, actual.getWaveform().getId().getCreationTime());
    Assertions.assertEquals(Instant.MAX, actual.getWaveform().getId().getEndTime());

    Assertions.assertEquals(channel, actual.getWaveform().getId().getChannel());
  }

  @Test
  void testCreateAmplitudeAnalysisWaveform() {

    var mockWfdisc = Mockito.mock(WfdiscDao.class);

    Mockito.when(mockWfdisc.getTime()).thenReturn(Instant.MIN);
    Mockito.when(mockWfdisc.getEndTime()).thenReturn(Instant.MAX);

    var wfTagKey = new WfTagKey();

    var wfTagDao = new WfTagDao();
    wfTagDao.setWfTagKey(wfTagKey);

    var sourcedWfdisc = SourcedWfdisc.create(mockWfdisc, wfTagDao);

    var workflowDefinitionId = WorkflowDefinitionId.from(BASE_STAGEID);

    List<AmplitudeDaoAndChannelAssociation> amplitudeAssociations =
        List.of(AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2);

    var ampdpiDao = mock(AmplitudeDynParsIntDao.class);
    var ampKey = new AmplitudeDynParsIntKey();

    ampKey.setAmpid(AMPLITUDE_ASSOCIATION_AMPTYPE_A5_2.getAmplitudeDao().getId());
    ampKey.setGroupName("MEASURE");
    ampKey.setParamName("FILTERID");

    when(ampdpiDao.getAmplitudeDynParsIntKey()).thenReturn(ampKey);
    when(ampdpiDao.getIvalue()).thenReturn(BASE_FILTERID);

    var amplitudeDpiList = List.of(ampdpiDao);

    Mockito.when(amplitudeDynParsIntDatabaseConnector.findFilterAdpisByIds(any()))
        .thenReturn(amplitudeDpiList);

    Mockito.when(
            signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
                BASE_STAGEID, AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(amplitudeDynParsIntDatabaseConnector);

    var filterDescription =
        LinearFilterDescription.from(
            Optional.empty(),
            Optional.empty(),
            true,
            FilterType.LINEAR,
            Optional.of(2.0),
            Optional.of(5.0),
            3,
            false,
            PassBandType.BAND_PASS,
            LinearFilterType.IIR_BUTTERWORTH,
            Optional.empty());

    var filterDefinition =
        FilterDefinition.from(
            "Amplitude Filter", Optional.of("Filter comments"), filterDescription);

    Mockito.when(bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(any()))
        .thenReturn(Map.of(BASE_FILTERID, filterDefinition));

    var actual =
        sdhBridgeHelperUtility.createAmplitudeAnalysisWaveforms(
            sourcedWfdisc, amplitudeAssociations, workflowDefinitionId);

    var waveformAndFD = actual.get(AMPID);

    Assertions.assertNotNull(waveformAndFD.getWaveform());

    Assertions.assertEquals(filterDefinition, waveformAndFD.getFilterDefinition().get());

    Assertions.assertEquals(
        FilterDefinitionUsage.AMPLITUDE, waveformAndFD.getFilterDefinitionUsage().get());
  }
}
