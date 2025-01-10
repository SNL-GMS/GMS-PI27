package gms.shared.signaldetection.repository;

import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.AMPLITUDE_CONNECTOR_TYPE;
import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE;
import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.ARRIVAL_CONNECTOR_TYPE;
import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE;
import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.ASSOC_CONNECTOR_TYPE;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.AMPLITUDE_DAO;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_TEST_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_TEST_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ASSOC_DAO_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ASSOC_DAO_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ASSOC_TEST_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ASSOC_TEST_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_1_ACCT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.WFTAG_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.WFTAG_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.HYPOTHESIS_ID;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MEASURED_WAVEFORM_LAG_DURATION;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MEASURED_WAVEFORM_LEAD_DURATION;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.MONITORING_ORG;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_0;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID_2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID_TEST_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_ID_TEST_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_ID;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.SIGNAL_DETECTION_ID_3;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.WORKFLOW_DEFINITION_ID1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.WORKFLOW_DEFINITION_ID2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.WORKFLOW_DEFINITION_ID3;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.WFID_1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.WFID_3;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_TWO;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.getSiteForStation;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisConverterId;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesisId;
import gms.shared.signaldetection.converter.detection.SignalDetectionConverter;
import gms.shared.signaldetection.converter.detection.SignalDetectionHypothesisConverter;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.AmplitudeDynParsIntDao;
import gms.shared.signaldetection.dao.css.AmplitudeDynParsIntKey;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.ArrivalDynParsIntDao;
import gms.shared.signaldetection.dao.css.ArrivalDynParsIntKey;
import gms.shared.signaldetection.dao.css.enums.AmplitudeType;
import gms.shared.signaldetection.database.connector.AmplitudeDatabaseConnector;
import gms.shared.signaldetection.database.connector.AmplitudeDynParsIntDatabaseConnector;
import gms.shared.signaldetection.database.connector.ArrivalDatabaseConnector;
import gms.shared.signaldetection.database.connector.ArrivalDynParsIntDatabaseConnector;
import gms.shared.signaldetection.database.connector.AssocDatabaseConnector;
import gms.shared.signaldetection.database.connector.config.SignalDetectionBridgeDefinition;
import gms.shared.signaldetection.repository.utils.AccountValue;
import gms.shared.signaldetection.repository.utils.SignalDetectionHypothesisAssocIdComponents;
import gms.shared.signaldetection.repository.utils.SignalDetectionIdUtility;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WftagDatabaseConnector;
import gms.shared.stationdefinition.repository.BridgedChannelRepository;
import gms.shared.stationdefinition.repository.BridgedFilterDefinitionRepository;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.ignite.IgniteCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

@ExtendWith(MockitoExtension.class)
class BridgedSignalDetectionRepositoryTest {

  private static final String MEASURE_GROUP_NAME = "MEASURE";
  private static final String FK_GROUP_NAME = "FK";

  @Mock AmplitudeDatabaseConnector amplitudeDatabaseConnector;

  @Mock ArrivalDatabaseConnector currArrivalDatabaseConnector;

  @Mock ArrivalDatabaseConnector prevArrivalDatabaseConnector;

  @Mock ArrivalDynParsIntDatabaseConnector arrivalDynParsIntDatabaseConnector;

  @Mock AmplitudeDynParsIntDatabaseConnector amplitudeDynParsIntDatabaseConnector;

  @Mock AssocDatabaseConnector currAssocDatabaseConnector;

  @Mock AssocDatabaseConnector prevAssocDatabaseConnector;

  @Mock private SignalDetectionBridgeDatabaseConnectors signalDetectionBridgeDatabaseConnectors;

  @Mock SiteDatabaseConnector siteDatabaseConnector;

  @Mock WfdiscDatabaseConnector wfdiscDatabaseConnector;

  @Mock WftagDatabaseConnector wftagDatabaseConnector;

  @Mock SignalDetectionBridgeDefinition signalDetectionBridgeDefinition;

  @Mock private BridgedChannelRepository bridgedChannelRepository;

  @Mock private SignalDetectionIdUtility signalDetectionIdUtility;

  @Mock private SignalDetectionHypothesisConverter signalDetectionHypothesisConverter;

  @Mock private SignalDetectionConverter signalDetectionConverter;

  @Mock
  private IgniteCache<ChannelSegmentDescriptor, List<Long>> channelSegmentDescriptorWfidsCache;

  @Mock BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository;

  @Mock private Environment environment;

  @InjectMocks private SdhBridgeHelperUtility sdhChannelUtility;

  private static final String WORKFLOW_DEFINITION_ID1_NAME = WORKFLOW_DEFINITION_ID1.getName();
  private static final String WORKFLOW_DEFINITION_ID2_NAME = WORKFLOW_DEFINITION_ID2.getName();
  private static final String WORKFLOW_DEFINITION_ID3_NAME = WORKFLOW_DEFINITION_ID3.getName();

  private static final ImmutableMap<WorkflowDefinitionId, String> dbAccountStageMap =
      ImmutableMap.of(
          WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID1_NAME,
          WORKFLOW_DEFINITION_ID2, WORKFLOW_DEFINITION_ID2_NAME);

  private static final ImmutableMap<WorkflowDefinitionId, String> dbAccountMissingStageMap =
      ImmutableMap.of(WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID1_NAME);

  private BridgedSignalDetectionRepository repository;

  private static final List<UUID> SIGNAL_DETECTION_IDS =
      List.of(SIGNAL_DETECTION.getId(), SIGNAL_DETECTION_3.getId());

  private static final List<SignalDetectionHypothesisId> SIGNAL_DETECTION_HYPOTHESIS_IDS =
      List.of(
          SIGNAL_DETECTION_HYPOTHESIS_ID,
          SIGNAL_DETECTION_HYPOTHESIS_ID_3,
          SIGNAL_DETECTION_HYPOTHESIS_ID_2);

  private static final List<SignalDetectionHypothesisId> SIGNAL_DETECTION_HYPOTHESIS_IDS_2 =
      List.of(SIGNAL_DETECTION_HYPOTHESIS_ID_TEST_1, SIGNAL_DETECTION_HYPOTHESIS_ID_TEST_3);

  private static final Instant START_TIME = Instant.EPOCH;
  private static final Instant END_TIME = Instant.EPOCH.plusSeconds(300);

  private static final AccountValue<Long> SDH_ACCOUNT_ARRIVAL_ID_1 =
      AccountValue.create(WORKFLOW_DEFINITION_ID1_NAME, ARRIVAL_1.getId());

  private static final SignalDetectionHypothesisAssocIdComponents SDH_ASSOC_ID_COMPONENTS_1 =
      SignalDetectionHypothesisAssocIdComponents.create(
          WORKFLOW_DEFINITION_ID1_NAME, ARRIVAL_1.getId(), ASSOC_DAO_1.getId().getOriginId());

  @BeforeEach
  void setUp() {

    repository =
        new BridgedSignalDetectionRepository(
            signalDetectionBridgeDatabaseConnectors,
            siteDatabaseConnector,
            wfdiscDatabaseConnector,
            wftagDatabaseConnector,
            signalDetectionBridgeDefinition,
            sdhChannelUtility,
            signalDetectionIdUtility,
            signalDetectionHypothesisConverter,
            signalDetectionConverter,
            channelSegmentDescriptorWfidsCache,
            environment);
  }

  @Test
  void testFindByIdsNullIds() {
    assertThrows(
        NullPointerException.class, () -> repository.findByIds(null, WORKFLOW_DEFINITION_ID1));
  }

  @Test
  void testFindByIdsNullStageId() {
    assertThrows(
        NullPointerException.class, () -> repository.findByIds(SIGNAL_DETECTION_IDS, null));
  }

  @Test
  void testFindByIdsEmptyStage() {
    var ids = List.of(SIGNAL_DETECTION_ID);

    when(signalDetectionBridgeDefinition.getOrderedStages()).thenReturn(ImmutableList.of());

    assertTrue(repository.findByIds(ids, WORKFLOW_DEFINITION_ID2).isEmpty());
  }

  @ParameterizedTest
  @MethodSource("getFindByIdsArguments")
  void testFindByIds(
      List<SignalDetection> expectedValues,
      Consumer<SignalDetectionIdUtility> setupMocks,
      Consumer<SignalDetectionIdUtility> verifyMocks) {

    // initialize the db connector mocks
    initConnectorMocks();

    when(signalDetectionBridgeDefinition.getOrderedStages())
        .thenReturn(ImmutableList.of(WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID2));

    // current arrivals
    var currentArrivals = List.of(ARRIVAL_1);
    doReturn(currentArrivals)
        .when(currArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId()));

    // current assocs
    var currentAssocs = List.of(ASSOC_DAO_3);
    doReturn(currentAssocs)
        .when(currAssocDatabaseConnector)
        .findAssocsByArids(List.of(ARRIVAL_1.getId()));

    // prev arrivals
    var prevArrivals = List.of(ARRIVAL_1, ARRIVAL_3);
    doReturn(prevArrivals)
        .when(prevArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId()));

    // prev assocs
    var prevAssocs = List.of(ASSOC_DAO_1);
    doReturn(prevAssocs)
        .when(prevAssocDatabaseConnector)
        .findAssocsByArids(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId()));

    when(signalDetectionBridgeDefinition.getMonitoringOrganization()).thenReturn(MONITORING_ORG);
    when(signalDetectionConverter.convert(any()))
        .thenReturn(Optional.of(SIGNAL_DETECTION), Optional.of(SIGNAL_DETECTION_3));

    setupMocks.accept(signalDetectionIdUtility);
    List<SignalDetection> signalDetections =
        repository.findByIds(SIGNAL_DETECTION_IDS, WORKFLOW_DEFINITION_ID2);
    assertTrue(signalDetections.size() > 0);
    verifyMocks.accept(signalDetectionIdUtility);

    signalDetections.forEach(sd -> assertTrue(expectedValues.contains(sd)));
    expectedValues.forEach(ev -> assertTrue(signalDetections.contains(ev)));
    verify(signalDetectionBridgeDefinition, times(6)).getOrderedStages();
    verify(signalDetectionBridgeDefinition, times(3)).getMonitoringOrganization();
    verify(signalDetectionConverter, times(3)).convert(any());
    verifyNoMoreInteractions(
        signalDetectionIdUtility,
        signalDetectionBridgeDefinition,
        signalDetectionConverter,
        channelSegmentDescriptorWfidsCache);
  }

  @ParameterizedTest
  @MethodSource("getFindByIdsArguments")
  void testFindByIdsNullPrevious(
      List<SignalDetection> expectedValues,
      Consumer<SignalDetectionIdUtility> setupMocks,
      Consumer<SignalDetectionIdUtility> verifyMocks) {

    // initialize the db connector mocks
    initCurrentConnectorMocks();

    when(signalDetectionBridgeDefinition.getOrderedStages())
        .thenReturn(ImmutableList.of(WORKFLOW_DEFINITION_ID1));

    // current arrivals
    var currentArrivals = List.of(ARRIVAL_1, ARRIVAL_3);
    doReturn(currentArrivals)
        .when(currArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId()));

    // current assocs
    var currentAssocs = List.of(ASSOC_DAO_1);
    doReturn(currentAssocs)
        .when(currAssocDatabaseConnector)
        .findAssocsByArids(List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId()));

    when(signalDetectionBridgeDefinition.getMonitoringOrganization()).thenReturn(MONITORING_ORG);
    when(signalDetectionConverter.convert(any()))
        .thenReturn(Optional.of(SIGNAL_DETECTION), Optional.of(SIGNAL_DETECTION_3));

    setupMocks.accept(signalDetectionIdUtility);
    List<SignalDetection> signalDetections =
        repository.findByIds(SIGNAL_DETECTION_IDS, WORKFLOW_DEFINITION_ID1);
    assertTrue(signalDetections.size() > 0);
    signalDetections.forEach(sd -> assertTrue(expectedValues.contains(sd)));
    verifyMocks.accept(signalDetectionIdUtility);

    verifyNoMoreInteractions(
        signalDetectionIdUtility,
        signalDetectionBridgeDefinition,
        signalDetectionConverter,
        channelSegmentDescriptorWfidsCache);
  }

  @Test
  void testFindHypothesesByIdsArrivalsNoAssocs() {
    // initialize current and previous stage connectors
    initMultiStageConnectorMocks();

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            any(), eq(ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE)))
        .thenReturn(arrivalDynParsIntDatabaseConnector);

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            any(), eq(AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE)))
        .thenReturn(amplitudeDynParsIntDatabaseConnector);

    when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(any())).thenReturn(List.of());

    List<SignalDetectionHypothesis> expectedValues =
        List.of(SIGNAL_DETECTION_HYPOTHESIS_0, SIGNAL_DETECTION_HYPOTHESIS);

    when(signalDetectionBridgeDefinition.getOrderedStages())
        .thenReturn(
            ImmutableList.of(
                WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID2, WORKFLOW_DEFINITION_ID3));
    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage()).thenReturn(dbAccountStageMap);

    var idComponents1 = SDH_ACCOUNT_ARRIVAL_ID_1;
    doReturn(idComponents1)
        .when(signalDetectionIdUtility)
        .getAccountArrivalIdFromSdhId(SIGNAL_DETECTION_HYPOTHESIS_ID.getId());

    var idComponents2 = AccountValue.create(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_3.getId());
    doReturn(idComponents2)
        .when(signalDetectionIdUtility)
        .getAccountArrivalIdFromSdhId(SIGNAL_DETECTION_HYPOTHESIS_ID_2.getId());

    // create arrival current and previous stage connector mock returns
    List<ArrivalDao> currArrivals1 = List.of(ARRIVAL_1);
    doReturn(currArrivals1)
        .when(currArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_1.getId()));
    List<ArrivalDao> currArrivals2 = List.of(ARRIVAL_3);
    doReturn(currArrivals2)
        .when(currArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_3.getId()));
    List<ArrivalDao> prevArrivals = List.of(ARRIVAL_3);
    doReturn(prevArrivals)
        .when(prevArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_3.getId()));

    // create assoc current and previous stage connector mock returns
    doReturn(List.of())
        .when(currAssocDatabaseConnector)
        .findAssocsByArids(List.of(ARRIVAL_1.getId()));

    when(signalDetectionIdUtility.getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(
            ARRIVAL_3.getId(), WORKFLOW_DEFINITION_ID1_NAME))
        .thenReturn(SIGNAL_DETECTION_HYPOTHESIS_3.getId().getId());

    // find current stage wftags and wfdiscs
    when(wftagDatabaseConnector.findWfTagsByArIds(List.of(ARRIVAL_1.getId())))
        .thenReturn(List.of(WFTAG_1));
    when(wfdiscDatabaseConnector.findWfdiscsByWfids(anyCollection()))
        .thenReturn(List.of(WFDISC_TEST_DAO_1, WFDISC_TEST_DAO_3));

    // find previous stage wftags and wfdiscs
    when(wftagDatabaseConnector.findWfTagsByArIds(List.of(ARRIVAL_3.getId())))
        .thenReturn(List.of(WFTAG_3));
    when(wfdiscDatabaseConnector.findWfdiscsByWfids(anyCollection()))
        .thenReturn(List.of(WFDISC_TEST_DAO_1, WFDISC_TEST_DAO_3));

    // find curr/prev stage amplitudes
    doReturn(List.of(AMPLITUDE_DAO))
        .when(amplitudeDatabaseConnector)
        .findAmplitudesByArids(anyCollection());

    when(signalDetectionBridgeDefinition.getMonitoringOrganization()).thenReturn(MONITORING_ORG);

    doReturn(SIGNAL_DETECTION_HYPOTHESIS_ID_3.getSignalDetectionId())
        .when(signalDetectionIdUtility)
        .getOrCreateSignalDetectionIdfromArid(ARRIVAL_3.getId());

    doReturn(SIGNAL_DETECTION_HYPOTHESIS_ID.getSignalDetectionId())
        .when(signalDetectionIdUtility)
        .getOrCreateSignalDetectionIdfromArid(ARRIVAL_1.getId());

    // Since WFTAGs were returned above when queried for, we must assume these channels will be
    // built as derived channels
    // i.e. with record type and record ID provided
    doReturn(CHANNEL)
        .when(bridgedChannelRepository)
        .beamedChannelFromWfdisc(
            List.of((long) WFID_3),
            TagName.ARID,
            ARRIVAL_3.getId(),
            WFDISC_TEST_DAO_3.getTime(),
            WFDISC_TEST_DAO_3.getEndTime());

    doReturn(CHANNEL)
        .when(bridgedChannelRepository)
        .beamedChannelFromWfdisc(
            List.of((long) WFID_1),
            TagName.ARID,
            ARRIVAL_1.getId(),
            WFDISC_TEST_DAO_3.getTime(),
            WFDISC_TEST_DAO_3.getEndTime());

    doReturn(Optional.of(SIGNAL_DETECTION_HYPOTHESIS))
        .when(signalDetectionHypothesisConverter)
        .convert(
            eq(
                SignalDetectionHypothesisConverterId.from(
                    WORKFLOW_DEFINITION_ID2_NAME,
                    SIGNAL_DETECTION_HYPOTHESIS_ID_3.getSignalDetectionId(),
                    Optional.of(SIGNAL_DETECTION_HYPOTHESIS_3.getId().getId()))),
            any(),
            eq(Optional.empty()),
            eq(MONITORING_ORG),
            any(),
            any(),
            any());

    doReturn(Optional.of(SIGNAL_DETECTION_HYPOTHESIS_0))
        .when(signalDetectionHypothesisConverter)
        .convert(
            eq(
                SignalDetectionHypothesisConverterId.from(
                    WORKFLOW_DEFINITION_ID1_NAME,
                    SIGNAL_DETECTION_HYPOTHESIS_ID.getSignalDetectionId(),
                    Optional.empty())),
            any(),
            eq(Optional.empty()),
            eq(MONITORING_ORG),
            any(),
            any(),
            any());

    doReturn(new String[] {}).when(environment).getActiveProfiles();
    List<SignalDetectionHypothesis> signalDetectionHypotheses =
        repository.findHypothesesByIds(
            List.of(SIGNAL_DETECTION_HYPOTHESIS_ID, SIGNAL_DETECTION_HYPOTHESIS_ID_2));

    assertEquals(2, signalDetectionHypotheses.size());
    signalDetectionHypotheses.forEach(sdh -> assertTrue(expectedValues.contains(sdh)));

    verify(signalDetectionBridgeDefinition, times(5)).getOrderedStages();

    verify(signalDetectionBridgeDefinition, times(2)).getMonitoringOrganization();
    verify(signalDetectionIdUtility).getOrCreateSignalDetectionIdfromArid(ARRIVAL_1.getId());
    verify(signalDetectionIdUtility).getOrCreateSignalDetectionIdfromArid(ARRIVAL_3.getId());

    // Since WFTAGs were returned above when queried for, we must assume these channels will be
    // built as derived channels
    // i.e. with record type and record ID provided
    verify(bridgedChannelRepository, times(2))
        .beamedChannelFromWfdisc(
            List.of((long) WFID_3),
            TagName.ARID,
            ARRIVAL_3.getId(),
            WFDISC_TEST_DAO_3.getTime(),
            WFDISC_TEST_DAO_3.getEndTime());
    verify(channelSegmentDescriptorWfidsCache, times(2))
        .put(any(ChannelSegmentDescriptor.class), anyList());
    verify(signalDetectionHypothesisConverter, times(2))
        .convert(
            any(SignalDetectionHypothesisConverterId.class),
            any(),
            any(),
            eq(MONITORING_ORG),
            any(),
            any(),
            any());
    verify(signalDetectionIdUtility, times(2))
        .getAssocIdComponentsFromSignalDetectionHypothesisId(any());

    verifyNoMoreInteractions(
        signalDetectionBridgeDefinition,
        signalDetectionIdUtility,
        bridgedChannelRepository,
        channelSegmentDescriptorWfidsCache);
  }

  @Test
  void testFindHypothesesByIdsArrivalsNoAssocsFiltered() {
    // initialize current and previous stage connectors
    initMultiStageConnectorMocks();

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

    doReturn(Map.of(100L, filterDefinition))
        .when(bridgedFilterDefinitionRepository)
        .loadFilterDefinitionsForFilterIds(any());

    var mockDao1 = mock(ArrivalDynParsIntDao.class);
    var key1 = new ArrivalDynParsIntKey();

    key1.setArid(0);
    key1.setGroupName("ONSET");

    when(mockDao1.getArrivalDynParsIntKey()).thenReturn(key1);
    when(mockDao1.getIvalue()).thenReturn(100L);

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            any(), eq(ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE)))
        .thenReturn(arrivalDynParsIntDatabaseConnector);

    when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(any()))
        .thenReturn(List.of(mockDao1));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            any(), eq(AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE)))
        .thenReturn(amplitudeDynParsIntDatabaseConnector);

    List<SignalDetectionHypothesis> expectedValues =
        List.of(SIGNAL_DETECTION_HYPOTHESIS_0, SIGNAL_DETECTION_HYPOTHESIS);

    when(signalDetectionBridgeDefinition.getOrderedStages())
        .thenReturn(
            ImmutableList.of(
                WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID2, WORKFLOW_DEFINITION_ID3));
    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage()).thenReturn(dbAccountStageMap);

    var idComponents1 = SDH_ACCOUNT_ARRIVAL_ID_1;
    doReturn(idComponents1)
        .when(signalDetectionIdUtility)
        .getAccountArrivalIdFromSdhId(SIGNAL_DETECTION_HYPOTHESIS_ID.getId());

    var idComponents2 = AccountValue.create(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_3.getId());
    doReturn(idComponents2)
        .when(signalDetectionIdUtility)
        .getAccountArrivalIdFromSdhId(SIGNAL_DETECTION_HYPOTHESIS_ID_2.getId());

    // create arrival current and previous stage connector mock returns
    List<ArrivalDao> currArrivals1 = List.of(ARRIVAL_1);
    doReturn(currArrivals1)
        .when(currArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_1.getId()));
    List<ArrivalDao> currArrivals2 = List.of(ARRIVAL_3);
    doReturn(currArrivals2)
        .when(currArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_3.getId()));
    List<ArrivalDao> prevArrivals = List.of(ARRIVAL_3);
    doReturn(prevArrivals)
        .when(prevArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_3.getId()));

    // create assoc current and previous stage connector mock returns
    doReturn(List.of())
        .when(currAssocDatabaseConnector)
        .findAssocsByArids(List.of(ARRIVAL_1.getId()));

    when(signalDetectionIdUtility.getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(
            ARRIVAL_3.getId(), WORKFLOW_DEFINITION_ID1_NAME))
        .thenReturn(SIGNAL_DETECTION_HYPOTHESIS_3.getId().getId());

    // find current stage wftags and wfdiscs
    when(wftagDatabaseConnector.findWfTagsByArIds(List.of(ARRIVAL_1.getId())))
        .thenReturn(List.of(WFTAG_1));
    when(wfdiscDatabaseConnector.findWfdiscsByWfids(anyCollection()))
        .thenReturn(List.of(WFDISC_TEST_DAO_1, WFDISC_TEST_DAO_3));

    // find previous stage wftags and wfdiscs
    when(wftagDatabaseConnector.findWfTagsByArIds(List.of(ARRIVAL_3.getId())))
        .thenReturn(List.of(WFTAG_3));
    when(wfdiscDatabaseConnector.findWfdiscsByWfids(anyCollection()))
        .thenReturn(List.of(WFDISC_TEST_DAO_1, WFDISC_TEST_DAO_3));

    // find curr/prev stage amplitudes
    doReturn(List.of(AMPLITUDE_DAO))
        .when(amplitudeDatabaseConnector)
        .findAmplitudesByArids(anyCollection());

    when(signalDetectionBridgeDefinition.getMonitoringOrganization()).thenReturn(MONITORING_ORG);

    doReturn(SIGNAL_DETECTION_HYPOTHESIS_ID_3.getSignalDetectionId())
        .when(signalDetectionIdUtility)
        .getOrCreateSignalDetectionIdfromArid(ARRIVAL_3.getId());

    doReturn(SIGNAL_DETECTION_HYPOTHESIS_ID.getSignalDetectionId())
        .when(signalDetectionIdUtility)
        .getOrCreateSignalDetectionIdfromArid(ARRIVAL_1.getId());

    doReturn(CHANNEL)
        .when(bridgedChannelRepository)
        .filteredBeamedChannelFromWfdisc(
            List.of((long) WFID_3),
            TagName.ARID,
            ARRIVAL_3.getId(),
            WFDISC_TEST_DAO_3.getTime(),
            WFDISC_TEST_DAO_3.getEndTime(),
            100L);

    doReturn(CHANNEL)
        .when(bridgedChannelRepository)
        .filteredBeamedChannelFromWfdisc(
            List.of((long) WFID_1),
            TagName.ARID,
            ARRIVAL_1.getId(),
            WFDISC_TEST_DAO_3.getTime(),
            WFDISC_TEST_DAO_3.getEndTime(),
            100L);

    doReturn(CHANNEL)
        .when(bridgedChannelRepository)
        .beamedChannelFromWfdisc(
            List.of((long) WFID_3),
            TagName.ARID,
            ARRIVAL_3.getId(),
            WFDISC_TEST_DAO_3.getTime(),
            WFDISC_TEST_DAO_3.getEndTime());

    doReturn(CHANNEL)
        .when(bridgedChannelRepository)
        .beamedChannelFromWfdisc(
            List.of((long) WFID_1),
            TagName.ARID,
            ARRIVAL_1.getId(),
            WFDISC_TEST_DAO_3.getTime(),
            WFDISC_TEST_DAO_3.getEndTime());

    doReturn(Optional.of(SIGNAL_DETECTION_HYPOTHESIS))
        .when(signalDetectionHypothesisConverter)
        .convert(
            eq(
                SignalDetectionHypothesisConverterId.from(
                    WORKFLOW_DEFINITION_ID2_NAME,
                    SIGNAL_DETECTION_HYPOTHESIS_ID_3.getSignalDetectionId(),
                    Optional.of(SIGNAL_DETECTION_HYPOTHESIS_3.getId().getId()))),
            any(),
            eq(Optional.empty()),
            eq(MONITORING_ORG),
            any(),
            any(),
            any());

    doReturn(Optional.of(SIGNAL_DETECTION_HYPOTHESIS_0))
        .when(signalDetectionHypothesisConverter)
        .convert(
            eq(
                SignalDetectionHypothesisConverterId.from(
                    WORKFLOW_DEFINITION_ID1_NAME,
                    SIGNAL_DETECTION_HYPOTHESIS_ID.getSignalDetectionId(),
                    Optional.empty())),
            any(),
            eq(Optional.empty()),
            eq(MONITORING_ORG),
            any(),
            any(),
            any());

    doReturn(new String[] {}).when(environment).getActiveProfiles();
    List<SignalDetectionHypothesis> signalDetectionHypotheses =
        repository.findHypothesesByIds(
            List.of(SIGNAL_DETECTION_HYPOTHESIS_ID, SIGNAL_DETECTION_HYPOTHESIS_ID_2));

    assertEquals(2, signalDetectionHypotheses.size());
    signalDetectionHypotheses.forEach(sdh -> assertTrue(expectedValues.contains(sdh)));

    verify(signalDetectionBridgeDefinition, times(5)).getOrderedStages();

    verify(signalDetectionBridgeDefinition, times(2)).getMonitoringOrganization();
    verify(signalDetectionIdUtility).getOrCreateSignalDetectionIdfromArid(ARRIVAL_1.getId());
    verify(signalDetectionIdUtility).getOrCreateSignalDetectionIdfromArid(ARRIVAL_3.getId());

    verify(bridgedChannelRepository)
        .filteredBeamedChannelFromWfdisc(
            List.of((long) WFID_3),
            TagName.ARID,
            ARRIVAL_3.getId(),
            WFDISC_TEST_DAO_3.getTime(),
            WFDISC_TEST_DAO_3.getEndTime(),
            100L);
    verify(channelSegmentDescriptorWfidsCache, times(2))
        .put(any(ChannelSegmentDescriptor.class), anyList());
    verify(signalDetectionHypothesisConverter, times(2))
        .convert(
            any(SignalDetectionHypothesisConverterId.class),
            any(),
            any(),
            eq(MONITORING_ORG),
            any(),
            any(),
            any());
    verify(signalDetectionIdUtility, times(2))
        .getAssocIdComponentsFromSignalDetectionHypothesisId(any());

    verifyNoMoreInteractions(
        signalDetectionBridgeDefinition,
        signalDetectionIdUtility,
        bridgedChannelRepository,
        channelSegmentDescriptorWfidsCache);
  }

  @Test
  void testFindHypothesesByIdsArrivalsAndAssocs() {
    initStageTwoConnectorMocks();

    doReturn(new String[] {}).when(environment).getActiveProfiles();

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            any(), eq(ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE)))
        .thenReturn(arrivalDynParsIntDatabaseConnector);

    when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(any())).thenReturn(List.of());

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            any(), eq(AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE)))
        .thenReturn(amplitudeDynParsIntDatabaseConnector);

    List<SignalDetectionHypothesis> expectedValues =
        List.of(
            SIGNAL_DETECTION_HYPOTHESIS_0,
            SIGNAL_DETECTION_HYPOTHESIS,
            SIGNAL_DETECTION_HYPOTHESIS_2);

    when(signalDetectionBridgeDefinition.getOrderedStages())
        .thenReturn(
            ImmutableList.of(
                WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID2, WORKFLOW_DEFINITION_ID3));

    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage()).thenReturn(dbAccountStageMap);

    var idComponents1 = AccountValue.create(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_TEST_1.getId());
    doReturn(idComponents1)
        .when(signalDetectionIdUtility)
        .getAccountArrivalIdFromSdhId(SIGNAL_DETECTION_HYPOTHESIS_ID.getId());

    var idComponents2 = AccountValue.create(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_TEST_3.getId());
    doReturn(idComponents2)
        .when(signalDetectionIdUtility)
        .getAccountArrivalIdFromSdhId(SIGNAL_DETECTION_HYPOTHESIS_ID_2.getId());

    var assocIdComponents1 =
        SignalDetectionHypothesisAssocIdComponents.create(
            WORKFLOW_DEFINITION_ID2_NAME,
            ASSOC_TEST_1.getId().getArrivalId(),
            ASSOC_TEST_1.getId().getOriginId());
    doReturn(assocIdComponents1)
        .when(signalDetectionIdUtility)
        .getAssocIdComponentsFromSignalDetectionHypothesisId(
            SIGNAL_DETECTION_HYPOTHESIS_ID.getId());

    var assocIdComponents2 =
        SignalDetectionHypothesisAssocIdComponents.create(
            WORKFLOW_DEFINITION_ID2_NAME,
            ASSOC_TEST_3.getId().getArrivalId(),
            ASSOC_TEST_3.getId().getOriginId());
    doReturn(assocIdComponents2)
        .when(signalDetectionIdUtility)
        .getAssocIdComponentsFromSignalDetectionHypothesisId(
            SIGNAL_DETECTION_HYPOTHESIS_ID_2.getId());

    // ---------------------------------------------------------
    // create arrival current and previous stage connector mock returns
    List<ArrivalDao> currArrivals = List.of(ARRIVAL_TEST_1, ARRIVAL_TEST_3);
    doReturn(currArrivals)
        .when(currArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_TEST_1.getId(), ARRIVAL_TEST_3.getId()));
    List<ArrivalDao> prevArrivals = List.of(ARRIVAL_TEST_1);
    doReturn(prevArrivals)
        .when(prevArrivalDatabaseConnector)
        .findArrivalsByArids(List.of(ARRIVAL_TEST_1.getId(), ARRIVAL_TEST_3.getId()));

    // create assoc current and previous stage connector mock returns
    doReturn(List.of(ASSOC_TEST_1, ASSOC_TEST_3))
        .when(currAssocDatabaseConnector)
        .findAssocsByArids(List.of(ARRIVAL_TEST_1.getId(), ARRIVAL_TEST_3.getId()));

    // find current stage wftags and wfdiscs
    when(wftagDatabaseConnector.findWfTagsByArIds(
            List.of(ARRIVAL_TEST_1.getId(), ARRIVAL_TEST_3.getId())))
        .thenReturn(List.of());
    when(wfdiscDatabaseConnector.findWfDiscVersionAfterEffectiveTime(anyCollection()))
        .thenReturn(List.of(WFDISC_TEST_DAO_1, WFDISC_TEST_DAO_3));

    // find curr/prev stage amplitudes
    doReturn(List.of(AMPLITUDE_DAO))
        .when(amplitudeDatabaseConnector)
        .findAmplitudesByArids(List.of(ARRIVAL_TEST_1.getId(), ARRIVAL_TEST_3.getId()));

    when(currAssocDatabaseConnector.findAssocsByAridsAndOrids(
            List.of(
                Pair.of(ASSOC_TEST_1.getId().getArrivalId(), ASSOC_TEST_1.getId().getOriginId()),
                Pair.of(ASSOC_TEST_3.getId().getArrivalId(), ASSOC_TEST_3.getId().getOriginId()))))
        .thenReturn(List.of(ASSOC_TEST_1, ASSOC_TEST_3));
    when(prevAssocDatabaseConnector.findAssocsByAridsAndOrids(
            List.of(
                Pair.of(ASSOC_TEST_1.getId().getArrivalId(), ASSOC_TEST_1.getId().getOriginId()),
                Pair.of(ASSOC_TEST_3.getId().getArrivalId(), ASSOC_TEST_3.getId().getOriginId()))))
        .thenReturn(List.of(ASSOC_TEST_3));
    // ---------------------------------------------------------

    when(signalDetectionBridgeDefinition.getMonitoringOrganization()).thenReturn(MONITORING_ORG);

    doReturn(SIGNAL_DETECTION_HYPOTHESIS_ID_3.getSignalDetectionId())
        .when(signalDetectionIdUtility)
        .getOrCreateSignalDetectionIdfromArid(ARRIVAL_TEST_3.getId());

    doReturn(SIGNAL_DETECTION_HYPOTHESIS_ID.getSignalDetectionId())
        .when(signalDetectionIdUtility)
        .getOrCreateSignalDetectionIdfromArid(ARRIVAL_TEST_1.getId());

    when(signalDetectionIdUtility.getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(
            ARRIVAL_TEST_1.getId(), WORKFLOW_DEFINITION_ID1_NAME))
        .thenReturn(SIGNAL_DETECTION_HYPOTHESIS_ID.getId());

    when(signalDetectionIdUtility.getOrCreateSignalDetectionHypothesisIdFromAridOridAndStageId(
            ASSOC_TEST_3.getId().getArrivalId(),
            ASSOC_TEST_3.getId().getOriginId(),
            WORKFLOW_DEFINITION_ID1_NAME))
        .thenReturn(SIGNAL_DETECTION_HYPOTHESIS_ID_2.getId());

    // Since no WFTAGs are returned above when queried for, we must assume these channels will be
    // built as raw channels
    // i.e. without record type or record ID provided
    doReturn(CHANNEL)
        .when(bridgedChannelRepository)
        .rawChannelFromWfdisc(
            List.of((long) WFID_3), WFDISC_TEST_DAO_3.getTime(), WFDISC_TEST_DAO_3.getEndTime());

    doReturn(CHANNEL_TWO)
        .when(bridgedChannelRepository)
        .rawChannelFromWfdisc(
            List.of((long) WFID_1), WFDISC_TEST_DAO_3.getTime(), WFDISC_TEST_DAO_3.getEndTime());

    doReturn(Optional.of(SIGNAL_DETECTION_HYPOTHESIS_0))
        .when(signalDetectionHypothesisConverter)
        .convert(
            eq(
                SignalDetectionHypothesisConverterId.from(
                    WORKFLOW_DEFINITION_ID2_NAME,
                    SIGNAL_DETECTION_HYPOTHESIS_ID_3.getSignalDetectionId(),
                    Optional.of(SIGNAL_DETECTION_HYPOTHESIS_ID_2.getId()))),
            any(),
            eq(Optional.of(ASSOC_TEST_3)),
            eq(MONITORING_ORG),
            any(),
            any(),
            any());

    doReturn(Optional.of(SIGNAL_DETECTION_HYPOTHESIS))
        .when(signalDetectionHypothesisConverter)
        .convert(
            eq(
                SignalDetectionHypothesisConverterId.from(
                    WORKFLOW_DEFINITION_ID2_NAME,
                    SIGNAL_DETECTION_HYPOTHESIS_ID_3.getSignalDetectionId(),
                    Optional.empty())),
            any(),
            eq(Optional.empty()),
            eq(MONITORING_ORG),
            any(),
            any(),
            any());

    doReturn(Optional.of(SIGNAL_DETECTION_HYPOTHESIS_2))
        .when(signalDetectionHypothesisConverter)
        .convert(
            eq(
                SignalDetectionHypothesisConverterId.from(
                    WORKFLOW_DEFINITION_ID2_NAME,
                    SIGNAL_DETECTION_HYPOTHESIS_ID.getSignalDetectionId(),
                    Optional.of(SIGNAL_DETECTION_HYPOTHESIS_ID.getId()))),
            any(),
            eq(Optional.of(ASSOC_TEST_1)),
            eq(MONITORING_ORG),
            any(),
            any(),
            any());

    List<SignalDetectionHypothesis> signalDetectionHypotheses =
        repository.findHypothesesByIds(
            List.of(SIGNAL_DETECTION_HYPOTHESIS_ID, SIGNAL_DETECTION_HYPOTHESIS_ID_2));

    assertEquals(3, signalDetectionHypotheses.size());
    signalDetectionHypotheses.forEach(sdh -> assertTrue(expectedValues.contains(sdh)));

    // Since no WFTAGs are returned above when queried for, we must assume these channels will be
    // built as raw channels
    // i.e. without record type or record ID provided
    verify(bridgedChannelRepository, times(4))
        .rawChannelFromWfdisc(
            List.of((long) WFID_3), WFDISC_TEST_DAO_3.getTime(), WFDISC_TEST_DAO_3.getEndTime());

    verify(bridgedChannelRepository, times(2))
        .rawChannelFromWfdisc(
            List.of((long) WFID_1), WFDISC_TEST_DAO_3.getTime(), WFDISC_TEST_DAO_3.getEndTime());
  }

  @Test
  void testFindHypothesesByIdsArrivalsAndAssocsMissingStageAccount() {

    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage())
        .thenReturn(dbAccountMissingStageMap);
    doReturn(new String[] {}).when(environment).getActiveProfiles();
    var idComponents1 = AccountValue.create(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_TEST_1.getId());
    doReturn(idComponents1)
        .when(signalDetectionIdUtility)
        .getAccountArrivalIdFromSdhId(SIGNAL_DETECTION_HYPOTHESIS_ID.getId());

    var idComponents2 = AccountValue.create(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_TEST_3.getId());
    doReturn(idComponents2)
        .when(signalDetectionIdUtility)
        .getAccountArrivalIdFromSdhId(SIGNAL_DETECTION_HYPOTHESIS_ID_2.getId());

    var assocIdComponents1 =
        SignalDetectionHypothesisAssocIdComponents.create(
            WORKFLOW_DEFINITION_ID2_NAME,
            ASSOC_TEST_1.getId().getArrivalId(),
            ASSOC_TEST_1.getId().getOriginId());
    doReturn(assocIdComponents1)
        .when(signalDetectionIdUtility)
        .getAssocIdComponentsFromSignalDetectionHypothesisId(
            SIGNAL_DETECTION_HYPOTHESIS_ID.getId());

    var assocIdComponents2 =
        SignalDetectionHypothesisAssocIdComponents.create(
            WORKFLOW_DEFINITION_ID2_NAME,
            ASSOC_TEST_3.getId().getArrivalId(),
            ASSOC_TEST_3.getId().getOriginId());
    doReturn(assocIdComponents2)
        .when(signalDetectionIdUtility)
        .getAssocIdComponentsFromSignalDetectionHypothesisId(
            SIGNAL_DETECTION_HYPOTHESIS_ID_2.getId());

    List<SignalDetectionHypothesis> signalDetectionHypotheses =
        repository.findHypothesesByIds(
            List.of(SIGNAL_DETECTION_HYPOTHESIS_ID, SIGNAL_DETECTION_HYPOTHESIS_ID_2));

    assertEquals(0, signalDetectionHypotheses.size());
  }

  @Test
  void testFindByStationsAndTimeMissingStage() {
    when(signalDetectionBridgeDefinition.getOrderedStages())
        .thenReturn(ImmutableList.of(WORKFLOW_DEFINITION_ID1));

    assertEquals(
        0,
        repository
            .findByStationsAndTime(
                List.of(STATION),
                START_TIME,
                END_TIME,
                WORKFLOW_DEFINITION_ID2,
                List.of(SIGNAL_DETECTION))
            .size());
  }

  @ParameterizedTest
  @MethodSource("getFindByStationsAndTime")
  void testFindByStationsAndTime(
      List<SignalDetection> expectedValues,
      Consumer<SignalDetectionIdUtility> setupMocks,
      Consumer<SignalDetectionIdUtility> verifyMocks) {

    // current stage connector mocks
    doReturn(amplitudeDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, AMPLITUDE_CONNECTOR_TYPE);
    doReturn(currAssocDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ASSOC_CONNECTOR_TYPE);

    // previous stage connectors exist
    lenient()
        .doReturn(true)
        .when(signalDetectionBridgeDatabaseConnectors)
        .connectorExistsForPreviousStage(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_CONNECTOR_TYPE);

    // initialize the arrival db connectors (others aren't used)
    doReturn(currArrivalDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_CONNECTOR_TYPE);
    doReturn(prevArrivalDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForPreviousStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_CONNECTOR_TYPE);

    when(signalDetectionBridgeDefinition.getOrderedStages())
        .thenReturn(ImmutableList.of(WORKFLOW_DEFINITION_ID1, WORKFLOW_DEFINITION_ID2));

    when(prevArrivalDatabaseConnector.findArrivalsByArids(
            List.of(ARRIVAL_1.getId(), ARRIVAL_3.getId())))
        .thenReturn(List.of());
    when(currArrivalDatabaseConnector.findArrivals(
            List.of(STATION.getName()),
            List.of(ARRIVAL_1.getId()),
            START_TIME,
            END_TIME,
            MEASURED_WAVEFORM_LEAD_DURATION,
            MEASURED_WAVEFORM_LAG_DURATION))
        .thenReturn(List.of(ARRIVAL_1, ARRIVAL_3));

    when(signalDetectionBridgeDefinition.getMonitoringOrganization()).thenReturn(MONITORING_ORG);
    when(signalDetectionBridgeDefinition.getMeasuredWaveformLeadDuration())
        .thenReturn(MEASURED_WAVEFORM_LEAD_DURATION);
    when(signalDetectionBridgeDefinition.getMeasuredWaveformLagDuration())
        .thenReturn(MEASURED_WAVEFORM_LAG_DURATION);

    when(signalDetectionConverter.convert(any())).thenReturn(Optional.of(SIGNAL_DETECTION_3));
    when(siteDatabaseConnector.findSitesByReferenceStationAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(getSiteForStation()));

    setupMocks.accept(signalDetectionIdUtility);
    List<SignalDetection> signalDetections =
        repository.findByStationsAndTime(
            List.of(STATION),
            START_TIME,
            END_TIME,
            WORKFLOW_DEFINITION_ID2,
            List.of(SIGNAL_DETECTION));
    assertTrue(signalDetections.size() > 0);
    signalDetections.forEach(sd -> assertTrue(expectedValues.contains(sd)));
    verifyMocks.accept(signalDetectionIdUtility);
  }

  /** Initialize current stage db connectors for arrival and assoc */
  private void initCurrentConnectorMocks() {
    doReturn(amplitudeDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID1_NAME, AMPLITUDE_CONNECTOR_TYPE);
    doReturn(currArrivalDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID1_NAME, ARRIVAL_CONNECTOR_TYPE);
    doReturn(currAssocDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID1_NAME, ASSOC_CONNECTOR_TYPE);
  }

  /** Initialize individual stage db connectors in the main signal detection db connectors */
  private void initConnectorMocks() {

    // current stage connector mocks
    doReturn(amplitudeDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, AMPLITUDE_CONNECTOR_TYPE);
    doReturn(currArrivalDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_CONNECTOR_TYPE);
    doReturn(currAssocDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ASSOC_CONNECTOR_TYPE);

    doReturn(amplitudeDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID1_NAME, AMPLITUDE_CONNECTOR_TYPE);

    // previous stage connector mocks
    doReturn(prevArrivalDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForPreviousStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_CONNECTOR_TYPE);
    doReturn(prevAssocDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForPreviousStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ASSOC_CONNECTOR_TYPE);

    // previous stage connectors exist
    lenient()
        .doReturn(true)
        .when(signalDetectionBridgeDatabaseConnectors)
        .connectorExistsForPreviousStage(eq(WORKFLOW_DEFINITION_ID2_NAME), any());
  }

  /** Initialize multi-stage db connectors in the main signal detection db connectors */
  private void initMultiStageConnectorMocks() {

    // current stage connector mocks
    doReturn(amplitudeDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID1_NAME, AMPLITUDE_CONNECTOR_TYPE);
    doReturn(amplitudeDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, AMPLITUDE_CONNECTOR_TYPE);

    doReturn(currArrivalDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID1_NAME, ARRIVAL_CONNECTOR_TYPE);
    doReturn(currArrivalDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_CONNECTOR_TYPE);

    doReturn(currAssocDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID1_NAME, ASSOC_CONNECTOR_TYPE);
    doReturn(currAssocDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ASSOC_CONNECTOR_TYPE);

    // previous stage connector mocks
    doReturn(prevArrivalDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForPreviousStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_CONNECTOR_TYPE);

    // previous stage connectors exist
    lenient()
        .doReturn(true)
        .when(signalDetectionBridgeDatabaseConnectors)
        .connectorExistsForPreviousStage(eq(WORKFLOW_DEFINITION_ID2_NAME), any());
    lenient()
        .doReturn(true)
        .when(signalDetectionBridgeDatabaseConnectors)
        .connectorExistsForPreviousStage(eq(WORKFLOW_DEFINITION_ID3_NAME), any());
  }

  /** Initialize two-stage db connectors in the main signal detection db connectors */
  private void initStageTwoConnectorMocks() {

    // current stage connector mocks
    doReturn(amplitudeDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, AMPLITUDE_CONNECTOR_TYPE);

    doReturn(currArrivalDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_CONNECTOR_TYPE);

    doReturn(currAssocDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForCurrentStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ASSOC_CONNECTOR_TYPE);

    // previous stage connector mocks
    doReturn(prevArrivalDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForPreviousStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ARRIVAL_CONNECTOR_TYPE);

    doReturn(prevAssocDatabaseConnector)
        .when(signalDetectionBridgeDatabaseConnectors)
        .getConnectorForPreviousStageOrThrow(WORKFLOW_DEFINITION_ID2_NAME, ASSOC_CONNECTOR_TYPE);

    // previous stage connectors exist
    lenient()
        .doReturn(true)
        .when(signalDetectionBridgeDatabaseConnectors)
        .connectorExistsForPreviousStage(eq(WORKFLOW_DEFINITION_ID2_NAME), any());
    lenient()
        .doReturn(true)
        .when(signalDetectionBridgeDatabaseConnectors)
        .connectorExistsForPreviousStage(eq(WORKFLOW_DEFINITION_ID3_NAME), any());
  }

  // Create find signal detection by ids arguments
  static Stream<Arguments> getFindByIdsArguments() {
    List<SignalDetection> expectedValues = List.of(SIGNAL_DETECTION, SIGNAL_DETECTION_3);
    Consumer<SignalDetectionIdUtility> twoAridSetup =
        sdUtil -> {
          when(sdUtil.getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID))
              .thenReturn(ARRIVAL_1.getId());
          when(sdUtil.getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID_3))
              .thenReturn(ARRIVAL_3.getId());
        };
    Consumer<SignalDetectionIdUtility> twoAridVerification =
        sdUtil -> {
          verify(sdUtil).getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID);
          verify(sdUtil).getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID_3);
          verifyNoMoreInteractions(sdUtil);
        };

    return Stream.of(arguments(expectedValues, twoAridSetup, twoAridVerification));
  }

  // Create find signal detections by stations and time
  static Stream<Arguments> getFindByStationsAndTime() {
    List<SignalDetection> expectedValues = List.of(SIGNAL_DETECTION_3);
    Consumer<SignalDetectionIdUtility> aridSetup =
        sdUtil -> {
          when(sdUtil.getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID))
              .thenReturn(ARRIVAL_1.getId());
        };
    Consumer<SignalDetectionIdUtility> aridVerification =
        sdUtil -> {
          verify(sdUtil).getAridForSignalDetectionUUID(SIGNAL_DETECTION_ID);
          verifyNoMoreInteractions(sdUtil);
        };

    return Stream.of(arguments(expectedValues, aridSetup, aridVerification));
  }

  @Test
  void testFindFilterRecordsForSignalDetectionHypothesesUsingArrival() {
    when(signalDetectionIdUtility.getAccountArrivalIdFromSdhId(HYPOTHESIS_ID))
        .thenReturn(SDH_ACCOUNT_ARRIVAL_ID_1);

    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage())
        .thenReturn(
            ImmutableMap.of(WORKFLOW_DEFINITION_ID1, SDH_ACCOUNT_ARRIVAL_ID_1.getAccount()));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            WORKFLOW_DEFINITION_ID1_NAME, ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(Optional.of(arrivalDynParsIntDatabaseConnector));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            WORKFLOW_DEFINITION_ID1_NAME, AMPLITUDE_CONNECTOR_TYPE))
        .thenReturn(Optional.of(amplitudeDatabaseConnector));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            WORKFLOW_DEFINITION_ID1_NAME, AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(Optional.of(amplitudeDynParsIntDatabaseConnector));

    var adpiMock = mock(ArrivalDynParsIntDao.class);
    var adpiKeyMock = mock(ArrivalDynParsIntKey.class);
    when(adpiMock.getArrivalDynParsIntKey()).thenReturn(adpiKeyMock);
    long filterId = 0L;
    when(adpiMock.getIvalue()).thenReturn(filterId);
    when(adpiKeyMock.getArid()).thenReturn(SDH_ACCOUNT_ARRIVAL_ID_1.getValue());
    when(adpiKeyMock.getGroupName()).thenReturn(FK_GROUP_NAME);
    when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(
            List.of(SDH_ACCOUNT_ARRIVAL_ID_1.getValue())))
        .thenReturn(List.of(adpiMock));

    var results =
        assertDoesNotThrow(
            () ->
                repository.findFilterRecordsForSignalDetectionHypotheses(
                    List.of(SIGNAL_DETECTION_HYPOTHESIS)));
    var resultsTable = results.results();

    assertFalse(results.isPartial());
    assertEquals(1, resultsTable.size());
    assertEquals(
        filterId,
        resultsTable.get(
            SIGNAL_DETECTION_HYPOTHESIS.toEntityReference(), FilterDefinitionUsage.FK));
  }

  @Test
  void testFindFilterRecordsForSignalDetectionHypothesesUsingAssoc() {
    when(signalDetectionIdUtility.getAccountArrivalIdFromSdhId(HYPOTHESIS_ID)).thenReturn(null);

    when(signalDetectionIdUtility.getAssocIdComponentsFromSignalDetectionHypothesisId(
            HYPOTHESIS_ID))
        .thenReturn(SDH_ASSOC_ID_COMPONENTS_1);

    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage())
        .thenReturn(
            ImmutableMap.of(
                WORKFLOW_DEFINITION_ID1, SDH_ASSOC_ID_COMPONENTS_1.getLegacyDatabaseAccountId()));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            WORKFLOW_DEFINITION_ID1_NAME, ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(Optional.of(arrivalDynParsIntDatabaseConnector));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            WORKFLOW_DEFINITION_ID1_NAME, AMPLITUDE_CONNECTOR_TYPE))
        .thenReturn(Optional.of(amplitudeDatabaseConnector));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            WORKFLOW_DEFINITION_ID1_NAME, AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(Optional.of(amplitudeDynParsIntDatabaseConnector));

    var adpiMock = mock(ArrivalDynParsIntDao.class);
    var adpiKeyMock = mock(ArrivalDynParsIntKey.class);
    when(adpiMock.getArrivalDynParsIntKey()).thenReturn(adpiKeyMock);
    long filterId = 0L;
    when(adpiMock.getIvalue()).thenReturn(filterId);
    when(adpiKeyMock.getArid()).thenReturn(SDH_ASSOC_ID_COMPONENTS_1.getArid());
    when(adpiKeyMock.getGroupName()).thenReturn(FK_GROUP_NAME);
    when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(
            List.of(SDH_ASSOC_ID_COMPONENTS_1.getArid())))
        .thenReturn(List.of(adpiMock));

    var results =
        assertDoesNotThrow(
            () ->
                repository.findFilterRecordsForSignalDetectionHypotheses(
                    List.of(SIGNAL_DETECTION_HYPOTHESIS)));
    var resultsTable = results.results();

    assertFalse(results.isPartial());
    assertEquals(1, resultsTable.size());
    assertEquals(
        filterId,
        resultsTable.get(
            SIGNAL_DETECTION_HYPOTHESIS.toEntityReference(), FilterDefinitionUsage.FK));
  }

  @Test
  void testFindFilterRecordsForSignalDetectionHypothesesUsingAmplitude() {
    var stage = WORKFLOW_DEFINITION_ID1;
    var account = STAGE_1_ACCT;

    var sdh = SIGNAL_DETECTION_HYPOTHESIS;
    var amplitudeDao = AMPLITUDE_DAO;

    var ampid = amplitudeDao.getId();
    var arid = amplitudeDao.getArrivalId();
    var filterId = 0L;
    var groupName = MEASURE_GROUP_NAME;

    var adpiKey = new AmplitudeDynParsIntKey();
    adpiKey.setAmpid(ampid);
    adpiKey.setGroupName(groupName);
    var adpi = new AmplitudeDynParsIntDao();
    adpi.setAmplitudeDynParsIntKey(adpiKey);
    adpi.setIvalue(filterId);

    when(signalDetectionIdUtility.getAccountArrivalIdFromSdhId(sdh.getId().getId()))
        .thenReturn(AccountValue.create(account, arid));

    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage())
        .thenReturn(ImmutableMap.of(stage, account));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            stage.getName(), ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(Optional.of(arrivalDynParsIntDatabaseConnector));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            stage.getName(), AMPLITUDE_CONNECTOR_TYPE))
        .thenReturn(Optional.of(amplitudeDatabaseConnector));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            stage.getName(), AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(Optional.of(amplitudeDynParsIntDatabaseConnector));

    when(amplitudeDatabaseConnector.findAmplitudesByArids(List.of(arid)))
        .thenReturn(List.of(amplitudeDao));

    when(amplitudeDynParsIntDatabaseConnector.findFilterAdpisByIds((Set.of(amplitudeDao.getId()))))
        .thenReturn(List.of(adpi));

    var results =
        assertDoesNotThrow(
            () -> repository.findFilterRecordsForSignalDetectionHypotheses(List.of(sdh)));
    var resultsTable = results.results();

    assertFalse(results.isPartial());
    assertEquals(1, resultsTable.size());
    assertEquals(
        filterId,
        resultsTable.get(
            SIGNAL_DETECTION_HYPOTHESIS.toEntityReference(), FilterDefinitionUsage.AMPLITUDE));
  }

  @ParameterizedTest
  @MethodSource("missingConnectorArgs")
  void testFindFilterRecordsForSignalDetectionHypothesesMissingConnectorsReturnPartialResults(
      Optional<ArrivalDynParsIntDatabaseConnector> arrDpiConnector,
      Optional<AmplitudeDatabaseConnector> amplitudeConnector,
      Optional<AmplitudeDynParsIntDatabaseConnector> ampDpiConnector) {
    var stage = WORKFLOW_DEFINITION_ID1;
    var sdh = SIGNAL_DETECTION_HYPOTHESIS;
    var account = STAGE_1_ACCT;
    var arid = ARRIVAL_1.getId();

    when(signalDetectionIdUtility.getAccountArrivalIdFromSdhId(sdh.getId().getId()))
        .thenReturn(AccountValue.create(account, arid));

    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage())
        .thenReturn(ImmutableMap.of(stage, account));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            stage.getName(), ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(arrDpiConnector);

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            stage.getName(), AMPLITUDE_CONNECTOR_TYPE))
        .thenReturn(amplitudeConnector);

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            stage.getName(), AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(ampDpiConnector);

    var results =
        assertDoesNotThrow(
            () -> repository.findFilterRecordsForSignalDetectionHypotheses(List.of(sdh)));

    assertTrue(results.isPartial());
  }

  static Stream<Arguments> missingConnectorArgs() {
    Optional<ArrivalDynParsIntDatabaseConnector> arrDpiConnector =
        Optional.of(mock(ArrivalDynParsIntDatabaseConnector.class));
    Optional<AmplitudeDatabaseConnector> amplitudeConnector =
        Optional.of(mock(AmplitudeDatabaseConnector.class));
    Optional<AmplitudeDynParsIntDatabaseConnector> ampDpiConnector =
        Optional.of(mock(AmplitudeDynParsIntDatabaseConnector.class));

    return Stream.of(
        arguments(arrDpiConnector, amplitudeConnector, Optional.empty()),
        arguments(arrDpiConnector, Optional.empty(), ampDpiConnector),
        arguments(arrDpiConnector, Optional.empty(), Optional.empty()),
        arguments(Optional.empty(), amplitudeConnector, ampDpiConnector),
        arguments(Optional.empty(), amplitudeConnector, Optional.empty()),
        arguments(Optional.empty(), Optional.empty(), ampDpiConnector),
        arguments(Optional.empty(), Optional.empty(), Optional.empty()));
  }

  @Test
  void testFindFilterRecordsForSignalDetectionHypothesesRemovesDuplicateHypotheses() {
    when(signalDetectionIdUtility.getAccountArrivalIdFromSdhId(HYPOTHESIS_ID))
        .thenReturn(SDH_ACCOUNT_ARRIVAL_ID_1);

    when(signalDetectionBridgeDefinition.getDatabaseAccountByStage())
        .thenReturn(
            ImmutableMap.of(WORKFLOW_DEFINITION_ID1, SDH_ACCOUNT_ARRIVAL_ID_1.getAccount()));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            WORKFLOW_DEFINITION_ID1_NAME, ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(Optional.of(arrivalDynParsIntDatabaseConnector));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            WORKFLOW_DEFINITION_ID1_NAME, AMPLITUDE_CONNECTOR_TYPE))
        .thenReturn(Optional.of(amplitudeDatabaseConnector));

    when(signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStage(
            WORKFLOW_DEFINITION_ID1_NAME, AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE))
        .thenReturn(Optional.of(amplitudeDynParsIntDatabaseConnector));

    var adpiMock = mock(ArrivalDynParsIntDao.class);
    var adpiKeyMock = mock(ArrivalDynParsIntKey.class);
    when(adpiMock.getArrivalDynParsIntKey()).thenReturn(adpiKeyMock);
    long filterId = 0L;
    when(adpiMock.getIvalue()).thenReturn(filterId);
    when(adpiKeyMock.getArid()).thenReturn(SDH_ACCOUNT_ARRIVAL_ID_1.getValue());
    when(adpiKeyMock.getGroupName()).thenReturn(FK_GROUP_NAME);
    when(arrivalDynParsIntDatabaseConnector.findFilterAdpisByIds(
            List.of(SDH_ACCOUNT_ARRIVAL_ID_1.getValue())))
        .thenReturn(List.of(adpiMock));

    var results =
        assertDoesNotThrow(
            () ->
                repository.findFilterRecordsForSignalDetectionHypotheses(
                    List.of(SIGNAL_DETECTION_HYPOTHESIS, SIGNAL_DETECTION_HYPOTHESIS)));

    var resultsList = results.results();

    assertFalse(results.isPartial());
    assertEquals(1, resultsList.size());
    assertEquals(
        filterId,
        resultsList.get(SIGNAL_DETECTION_HYPOTHESIS.toEntityReference(), FilterDefinitionUsage.FK));
  }

  @Test
  void testFindFilterRecordsForSignalDetectionHypothesesMissingLegacyIdReturnsNoResult() {
    when(signalDetectionIdUtility.getAccountArrivalIdFromSdhId(HYPOTHESIS_ID)).thenReturn(null);

    var results =
        assertDoesNotThrow(
            () ->
                repository.findFilterRecordsForSignalDetectionHypotheses(
                    List.of(SIGNAL_DETECTION_HYPOTHESIS)));
    assertTrue(results.isPartial());
    assertTrue(results.results().isEmpty());
  }

  @Test
  void testFindFilterRecordsForSignalDetectionHypothesesUnknownLegacyAccountReturnsNoResult() {

    var results =
        assertDoesNotThrow(
            () ->
                repository.findFilterRecordsForSignalDetectionHypotheses(
                    List.of(SIGNAL_DETECTION_HYPOTHESIS)));
    assertTrue(results.isPartial());
    assertTrue(results.results().isEmpty());
  }

  @ParameterizedTest
  @MethodSource("prioritizedAmpSource")
  void testFindPrioritizedA5Over2AmpDao(
      ArrivalDao arrivalDao, List<AmplitudeDao> amplitudeDaos, Optional<AmplitudeDao> expectedAmp) {
    assertEquals(expectedAmp, repository.findPrioritizedA5Over2AmpDao(arrivalDao, amplitudeDaos));
  }

  private static Stream<Arguments> prioritizedAmpSource() {
    final double arrAmp = 111.111;
    final double arrPer = 0.222;
    final double nonArrAmp = 999.999;
    final double nonArrPer = 0.999;
    final String a5Over2TypeName = AmplitudeType.AMPLITUDE_A5_OVER_2.getName();

    var arrival = new ArrivalDao();
    arrival.setAmplitude(arrAmp);
    arrival.setPeriod(arrPer);

    var matchingA52Amp1 = new AmplitudeDao();
    matchingA52Amp1.setId(1L);
    matchingA52Amp1.setAmplitudeType(a5Over2TypeName);
    matchingA52Amp1.setAmplitude(arrAmp);
    matchingA52Amp1.setPeriod(arrPer);

    var matchingA52Amp2 = new AmplitudeDao();
    matchingA52Amp2.setId(2L);
    matchingA52Amp2.setAmplitudeType(a5Over2TypeName);
    matchingA52Amp2.setAmplitude(arrAmp);
    matchingA52Amp2.setPeriod(arrPer);

    var nonMatchingAmpA52Amp3 = new AmplitudeDao();
    nonMatchingAmpA52Amp3.setId(3L);
    nonMatchingAmpA52Amp3.setAmplitudeType(a5Over2TypeName);

    nonMatchingAmpA52Amp3.setAmplitude(nonArrAmp);
    nonMatchingAmpA52Amp3.setPeriod(arrPer);

    var nonMatchingPerA52Amp4 = new AmplitudeDao();
    nonMatchingPerA52Amp4.setId(4L);
    nonMatchingPerA52Amp4.setAmplitudeType(a5Over2TypeName);
    nonMatchingPerA52Amp4.setAmplitude(arrAmp);
    nonMatchingPerA52Amp4.setPeriod(nonArrPer);

    var matchingNonA52Amp5 = new AmplitudeDao();
    matchingNonA52Amp5.setId(5L);
    matchingNonA52Amp5.setAmplitudeType("NonA52");
    matchingNonA52Amp5.setAmplitude(arrAmp);
    matchingNonA52Amp5.setPeriod(arrPer);

    var nonMatchingNonA52Amp6 = new AmplitudeDao();
    nonMatchingNonA52Amp6.setId(6L);
    nonMatchingNonA52Amp6.setAmplitudeType("NonA52");
    nonMatchingNonA52Amp6.setAmplitude(nonArrAmp);
    nonMatchingNonA52Amp6.setPeriod(nonArrPer);

    return Stream.of(
        // A5/2 Matching takes priority
        Arguments.arguments(
            arrival, List.of(matchingA52Amp1, nonMatchingAmpA52Amp3), Optional.of(matchingA52Amp1)),
        Arguments.arguments(
            arrival, List.of(matchingA52Amp2, nonMatchingPerA52Amp4), Optional.of(matchingA52Amp2)),
        Arguments.arguments(
            arrival, List.of(matchingA52Amp2, matchingNonA52Amp5), Optional.of(matchingA52Amp2)),
        // No A5/2 matches, so highest A5/2 AMPID takes priority
        Arguments.arguments(
            arrival,
            List.of(nonMatchingAmpA52Amp3, nonMatchingPerA52Amp4),
            Optional.of(nonMatchingPerA52Amp4)),
        Arguments.arguments(
            arrival,
            List.of(nonMatchingAmpA52Amp3, nonMatchingPerA52Amp4, matchingNonA52Amp5),
            Optional.of(nonMatchingPerA52Amp4)),
        // Single A5/2 match failed, so highest A5/2 AMPID takes priority
        Arguments.arguments(
            arrival, List.of(matchingA52Amp1, matchingA52Amp2), Optional.of(matchingA52Amp2)),
        Arguments.arguments(
            arrival,
            List.of(matchingA52Amp1, matchingA52Amp2, matchingNonA52Amp5),
            Optional.of(matchingA52Amp2)),
        Arguments.arguments(
            arrival,
            List.of(matchingA52Amp1, matchingA52Amp2, nonMatchingAmpA52Amp3),
            Optional.of(nonMatchingAmpA52Amp3)),
        Arguments.arguments(
            arrival,
            List.of(matchingA52Amp1, matchingA52Amp2, nonMatchingAmpA52Amp3, nonMatchingPerA52Amp4),
            Optional.of(nonMatchingPerA52Amp4)),
        Arguments.arguments(
            arrival,
            List.of(matchingA52Amp1, matchingA52Amp2, nonMatchingAmpA52Amp3, nonMatchingNonA52Amp6),
            Optional.of(nonMatchingAmpA52Amp3)),
        // Singleton Cases
        Arguments.arguments(arrival, List.of(matchingA52Amp1), Optional.of(matchingA52Amp1)),
        Arguments.arguments(
            arrival, List.of(nonMatchingAmpA52Amp3), Optional.of(nonMatchingAmpA52Amp3)),
        // No result cases
        Arguments.arguments(arrival, List.of(matchingNonA52Amp5), Optional.empty()),
        Arguments.arguments(arrival, List.of(nonMatchingNonA52Amp6), Optional.empty()),
        Arguments.arguments(
            arrival, List.of(matchingNonA52Amp5, nonMatchingNonA52Amp6), Optional.empty()));
  }
}
