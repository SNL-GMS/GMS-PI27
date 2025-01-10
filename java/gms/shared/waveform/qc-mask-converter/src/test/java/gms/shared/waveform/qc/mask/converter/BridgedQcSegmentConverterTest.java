package gms.shared.waveform.qc.mask.converter;

import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.PARENT_SEG_UIID;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_INFO_DAO1;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_INFO_DAO2;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_INFO_DAO_EMPTY_CHAN;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_INFO_DAO_EMPTY_STA;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_INFO_DAO_NAN_SAMPLE_RATE;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_INFO_DAO_NULL_CHAN;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_INFO_DAO_NULL_END_TIME;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_INFO_DAO_NULL_STA;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_INFO_DAO_NULL_START_TIME;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_SEG_DAO1;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_SEG_DAO2;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_SEG_DAO3;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_SEG_DAO4;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_SEG_DAO_EMPTY_AUTH;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_SEG_DAO_NULL_AUTH;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_SEG_DAO_NULL_LDDATE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;

import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.utilities.bridge.database.converter.NegativeNaInstantToDoubleConverter;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.mask.dao.QcMaskInfoDao;
import gms.shared.waveform.qc.mask.dao.QcMaskSegDao;
import gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures;
import gms.shared.waveform.qc.mask.util.QcSegmentUtility;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BridgedQcSegmentConverterTest {

  @Mock private StationDefinitionIdUtility stationDefinitionIdUtility;

  @Mock private StationDefinitionAccessor stationDefinitionAccessor;

  private QcSegmentConverter converter;

  private static final String COI_ID_STRING_DELIMITER = ".";

  @BeforeEach
  void setup() {
    converter = new BridgedQcSegmentConverter(stationDefinitionAccessor);
  }

  @Test
  void testNullParentSegmentId() {
    assertErrorThrown(
        NullPointerException.class,
        BridgedQcSegmentConverter.NULL_QC_SEG_ID,
        () ->
            converter.convertQcDaoObjectsToQcSegmentVersions(
                null, List.of(getSingleQcDaoObject())));
  }

  @Test
  void testNullQcDaoObjects() {
    assertErrorThrown(
        NullPointerException.class,
        BridgedQcSegmentConverter.NULL_QC_DAO_OBJECTS,
        () -> converter.convertQcDaoObjectsToQcSegmentVersions(PARENT_SEG_UIID, null));
  }

  @Test
  void testEmptyQcDaoObjects() {
    assertErrorThrown(
        IllegalArgumentException.class,
        BridgedQcSegmentConverter.EMPTY_QC_DAO_OBJECTS,
        () -> converter.convertQcDaoObjectsToQcSegmentVersions(PARENT_SEG_UIID, List.of()));
  }

  @Test
  void testNullChannel() {
    assertErrorThrown(
        NullPointerException.class,
        BridgedQcSegmentConverter.BLANK_CHANNEL,
        () ->
            converter.convertQcMaskDaosToQcDaoObjects(
                List.of(QCMASK_INFO_DAO_NULL_CHAN), List.of(QCMASK_SEG_DAO1)));
  }

  @Test
  void testEmptyChannel() {
    assertErrorThrown(
        IllegalArgumentException.class,
        BridgedQcSegmentConverter.BLANK_CHANNEL,
        () ->
            converter.convertQcMaskDaosToQcDaoObjects(
                List.of(QCMASK_INFO_DAO_EMPTY_CHAN), List.of(QCMASK_SEG_DAO1)));
  }

  @Test
  void testNullStation() {
    assertErrorThrown(
        NullPointerException.class,
        BridgedQcSegmentConverter.BLANK_STATION,
        () ->
            converter.convertQcMaskDaosToQcDaoObjects(
                List.of(QCMASK_INFO_DAO_NULL_STA), List.of(QCMASK_SEG_DAO1)));
  }

  @Test
  void testEmptyStation() {
    assertErrorThrown(
        IllegalArgumentException.class,
        BridgedQcSegmentConverter.BLANK_STATION,
        () ->
            converter.convertQcMaskDaosToQcDaoObjects(
                List.of(QCMASK_INFO_DAO_EMPTY_STA), List.of(QCMASK_SEG_DAO1)));
  }

  @Test
  void testNullStartTime() {
    assertErrorThrown(
        NullPointerException.class,
        BridgedQcSegmentConverter.NULL_START_TIME,
        () ->
            converter.convertQcMaskDaosToQcDaoObjects(
                List.of(QCMASK_INFO_DAO_NULL_START_TIME), List.of(QCMASK_SEG_DAO1)));
  }

  @Test
  void testNullEndTime() {
    assertErrorThrown(
        NullPointerException.class,
        BridgedQcSegmentConverter.NULL_END_TIME,
        () ->
            converter.convertQcMaskDaosToQcDaoObjects(
                List.of(QCMASK_INFO_DAO_NULL_END_TIME), List.of(QCMASK_SEG_DAO1)));
  }

  @Test
  void testNanSampleRate() {
    assertErrorThrown(
        IllegalArgumentException.class,
        BridgedQcSegmentConverter.NAN_SAMPLE_RATE,
        () ->
            converter.convertQcMaskDaosToQcDaoObjects(
                List.of(QCMASK_INFO_DAO_NAN_SAMPLE_RATE), List.of(QCMASK_SEG_DAO1)));
  }

  @Test
  void testNullAuthor() {
    assertErrorThrown(
        NullPointerException.class,
        BridgedQcSegmentConverter.BLANK_AUTHOR,
        () ->
            converter.convertQcMaskDaosToQcDaoObjects(
                List.of(QCMASK_INFO_DAO1), List.of(QCMASK_SEG_DAO_NULL_AUTH)));
  }

  @Test
  void testEmptyAuthor() {
    assertErrorThrown(
        IllegalArgumentException.class,
        BridgedQcSegmentConverter.BLANK_AUTHOR,
        () ->
            converter.convertQcMaskDaosToQcDaoObjects(
                List.of(QCMASK_INFO_DAO1), List.of(QCMASK_SEG_DAO_EMPTY_AUTH)));
  }

  @Test
  void testNullLoadDate() {
    assertErrorThrown(
        NullPointerException.class,
        BridgedQcSegmentConverter.NULL_LOAD_DATE,
        () ->
            converter.convertQcMaskDaosToQcDaoObjects(
                List.of(QCMASK_INFO_DAO1), List.of(QCMASK_SEG_DAO_NULL_LDDATE)));
  }

  @Test
  void testSingleQcMaskInfoDaoForSingleQcMaskSegDao() {
    List<QcDaoObject> qcDaoObjects = getMultipleQcDaoObjects();

    assertEquals(1, qcDaoObjects.size(), 0);

    assertEquals(QCMASK_INFO_DAO1.getChannel(), qcDaoObjects.get(0).getChannel());
    assertEquals(QCMASK_INFO_DAO1.getQcMaskId(), qcDaoObjects.get(0).getQcMaskId(), 0);

    assertEquals(
        QCMASK_SEG_DAO1.getQcMaskSegKey().getStartSample(),
        qcDaoObjects.get(0).getStartSample(),
        0);
    assertEquals(QCMASK_SEG_DAO1.getAuthor(), qcDaoObjects.get(0).getAuthor());
  }

  @Test
  void testSingleQcMaskInfoDaoForMultipleQcMaskSegDaos() {

    List<QcMaskInfoDao> qcMaskInfoDaos = List.of(QCMASK_INFO_DAO1);
    List<QcMaskSegDao> qcMaskSegDaos = List.of(QCMASK_SEG_DAO1, QCMASK_SEG_DAO2);

    List<QcDaoObject> qcDaoObjects =
        converter.convertQcMaskDaosToQcDaoObjects(qcMaskInfoDaos, qcMaskSegDaos);

    assertEquals(2, qcDaoObjects.size(), 0);

    assertEquals(QCMASK_INFO_DAO1.getChannel(), qcDaoObjects.get(1).getChannel());
    assertEquals(QCMASK_INFO_DAO1.getQcMaskId(), qcDaoObjects.get(1).getQcMaskId(), 0);

    assertEquals(
        QCMASK_SEG_DAO2.getQcMaskSegKey().getStartSample(),
        qcDaoObjects.get(1).getStartSample(),
        0);
    assertEquals(QCMASK_SEG_DAO2.getAuthor(), qcDaoObjects.get(1).getAuthor());
  }

  @Test
  void testMultipleQcMaskInfoDaoForMultipleQcMaskSegDaos() {

    List<QcMaskInfoDao> qcMaskInfoDaos = List.of(QCMASK_INFO_DAO1, QCMASK_INFO_DAO2);
    List<QcMaskSegDao> qcMaskSegDaos =
        List.of(QCMASK_SEG_DAO1, QCMASK_SEG_DAO2, QCMASK_SEG_DAO3, QCMASK_SEG_DAO4);

    List<QcDaoObject> qcDaoObjects =
        converter.convertQcMaskDaosToQcDaoObjects(qcMaskInfoDaos, qcMaskSegDaos);

    assertEquals(4, qcDaoObjects.size(), 0);

    assertEquals(QCMASK_INFO_DAO1.getChannel(), qcDaoObjects.get(1).getChannel());
    assertEquals(QCMASK_INFO_DAO1.getQcMaskId(), qcDaoObjects.get(1).getQcMaskId(), 0);

    assertEquals(QCMASK_INFO_DAO2.getChannel(), qcDaoObjects.get(3).getChannel());
    assertEquals(QCMASK_INFO_DAO2.getQcMaskId(), qcDaoObjects.get(3).getQcMaskId(), 0);

    assertEquals(
        QCMASK_SEG_DAO2.getQcMaskSegKey().getStartSample(),
        qcDaoObjects.get(1).getStartSample(),
        0);
    assertEquals(QCMASK_SEG_DAO2.getAuthor(), qcDaoObjects.get(1).getAuthor());

    assertEquals(
        QCMASK_SEG_DAO4.getQcMaskSegKey().getStartSample(),
        qcDaoObjects.get(3).getStartSample(),
        0);
    assertEquals(QCMASK_SEG_DAO4.getAuthor(), qcDaoObjects.get(3).getAuthor());
  }

  @Test
  void testEqualsMethod() {
    List<QcDaoObject> qcDaoObjects_A = getMultipleQcDaoObjects();

    List<QcDaoObject> qcDaoObjects_B = getMultipleQcDaoObjects();

    assertTrue(
        qcDaoObjects_A.get(0).equals(qcDaoObjects_B.get(0))
            && qcDaoObjects_B.get(0).equals(qcDaoObjects_A.get(0)));
  }

  @Test
  void testHashMethod() {
    List<QcDaoObject> qcDaoObjects_A = getMultipleQcDaoObjects();

    List<QcDaoObject> qcDaoObjects_B = getMultipleQcDaoObjects();

    assertEquals(qcDaoObjects_A.get(0).hashCode(), qcDaoObjects_B.get(0).hashCode());
  }

  @Test
  void testQcDaoObjectCreation() {
    List<QcDaoObject> qcDaoObjects = getMultipleQcDaoObjects();

    QcDaoObject daoObject = new QcDaoObject(qcDaoObjects.get(0));

    assertTrue(qcDaoObjects.get(0).equals(daoObject) && daoObject.equals(qcDaoObjects.get(0)));
  }

  @ParameterizedTest
  @MethodSource("validateDaos")
  void testQcDaoObjectVerification(
      List<QcMaskInfoDao> qcMaskInfoDaos,
      List<QcMaskSegDao> qcMaskSegDaos,
      String expectedMessageError,
      Class<? extends Exception> expectedType) {

    assertErrorThrown(
        expectedType,
        expectedMessageError,
        () -> converter.convertQcMaskDaosToQcDaoObjects(qcMaskInfoDaos, qcMaskSegDaos));
  }

  static Stream<Arguments> validateDaos() {
    return Stream.of(
        arguments(
            null,
            List.of(),
            BridgedQcSegmentConverter.NULL_QC_MASK_INFO_DAOS,
            NullPointerException.class),
        arguments(
            List.of(),
            null,
            BridgedQcSegmentConverter.NULL_QC_MASK_SEG_DAOS,
            NullPointerException.class),
        arguments(
            List.of(),
            List.of(new QcMaskSegDao()),
            BridgedQcSegmentConverter.EMPTY_QC_MASK_INFO_DAOS,
            IllegalArgumentException.class),
        arguments(
            List.of(new QcMaskInfoDao()),
            List.of(),
            BridgedQcSegmentConverter.EMPTY_QC_MASK_SEG_DAOS,
            IllegalArgumentException.class),
        arguments(
            List.of(new QcMaskInfoDao()),
            List.of(new QcMaskSegDao()),
            BridgedQcSegmentConverter.NULL_QC_MASK_SEG_KEY,
            NullPointerException.class));
  }

  @Test
  void testSingleQcSegment() {
    var qcDaoObject = getSingleQcDaoObject();

    List<QcSegment> qcSegments = getQcSegments(qcDaoObject);

    QcSegment qcSegment = qcSegments.get(0);

    assertTrue(qcSegment.getData().isPresent());

    Optional<QcSegment.Data> data = qcSegment.getData();

    String expectedChannelName = data.get().getChannel().getName();

    String actualChannelName =
        qcDaoObject.getStation()
            + COI_ID_STRING_DELIMITER
            + qcDaoObject.getStation()
            + COI_ID_STRING_DELIMITER
            + qcDaoObject.getChannel();

    assertEquals(expectedChannelName, actualChannelName);
  }

  @Test
  void testSingleQcSegmentVersion() {
    QcDaoObject qcDaoObject = getSingleQcDaoObject();
    var sta = qcDaoObject.getStation();
    var chan = qcDaoObject.getChannel();
    var channel = StationDefinitionIdUtility.getChannelEntityForRefStaChan(sta, sta, chan);

    Pair<Instant, Instant> startEndTimes = getTimesFromQcDaoObject(qcDaoObject);

    Mockito.when(stationDefinitionAccessor.findChannelsByNameAndTimeRange(any(), any(), any()))
        .thenReturn(List.of(channel));

    List<QcSegment> qcSegments = getQcSegments(qcDaoObject);

    QcSegment qcSegment = qcSegments.get(0);
    var parentUUID = qcSegment.getId();
    var qcSegmentVersions =
        converter.convertQcDaoObjectsToQcSegmentVersions(parentUUID, List.of(qcDaoObject));

    assertNotNull(qcSegmentVersions);
    Assertions.assertEquals(1, qcSegmentVersions.size());

    // check the nested fields of the qc segment versions
    var qcSegVersion = qcSegmentVersions.get(0);
    Assertions.assertTrue(qcSegVersion.getData().isPresent());
    var qcSegData = qcSegVersion.getData().get();

    Assertions.assertTrue(qcSegData.getCategory().isPresent());
    Assertions.assertTrue(qcSegData.getType().isPresent());
    var category = qcSegData.getCategory().get();
    var type = qcSegData.getType().get();

    assertEquals(parentUUID, qcSegVersion.getId().getParentQcSegmentId());
    assertEquals(qcDaoObject.getLoadDate(), qcSegVersion.getId().getEffectiveAt());
    assertEquals(qcDaoObject.getAuthor(), qcSegData.getCreatedBy());
    assertFalse(qcSegData.isRejected());
    assertEquals("N/A (bridged)", qcSegData.getRationale());
    assertEquals(List.of(), qcSegData.getDiscoveredOn());
    assertEquals(QcSegmentCategory.WAVEFORM, category);
    assertEquals(QcSegmentType.FLAT, type);
    assertEquals(startEndTimes.getLeft(), qcSegData.getStartTime());
    assertEquals(startEndTimes.getRight(), qcSegData.getEndTime());

    var rawChannels = qcSegData.getChannels();
    assertNotNull(rawChannels);
    assertEquals(1, rawChannels.size());
    assertEquals(channel, rawChannels.get(0));
  }

  @Test
  void testQcSegmentPartitionWhenTimeIsGreaterThanTwoHours() {
    QcDaoObject qcDaoObject = QcTestFixtures.getDefaultQcDaoObject();
    var threeHoursSample =
        qcDaoObject.getStartSample() + (long) qcDaoObject.getSampleRate() * 3 * 3600;
    qcDaoObject.setEndSample(threeHoursSample);

    var qcSegments = getQcSegments(qcDaoObject);

    assertEquals(2, qcSegments.size());

    List<QcSegmentVersion.Data> qcSegmentVersionsData =
        qcSegments.stream()
            .map(qc -> qc.getData().get().getVersionHistory().last().getData().get())
            .collect(Collectors.toList());

    assertEquals(
        QcSegmentUtility.getQcDaoStartTime(qcDaoObject),
        qcSegmentVersionsData.get(0).getStartTime());

    assertEquals(
        QcSegmentUtility.getQcDaoEndTime(qcDaoObject), qcSegmentVersionsData.get(1).getEndTime());

    assertTrue(
        qcSegmentVersionsData
            .get(0)
            .getEndTime()
            .isBefore(qcSegmentVersionsData.get(1).getStartTime()));
  }

  private QcDaoObject getSingleQcDaoObject() {
    return converter
        .convertQcMaskDaosToQcDaoObjects(List.of(QCMASK_INFO_DAO1), List.of(QCMASK_SEG_DAO1))
        .get(0);
  }

  private List<QcDaoObject> getMultipleQcDaoObjects() {
    return converter.convertQcMaskDaosToQcDaoObjects(
        List.of(QCMASK_INFO_DAO1), List.of(QCMASK_SEG_DAO1));
  }

  private List<QcSegment> getQcSegments(QcDaoObject qcDaoObject) {
    return converter.convertQcDaoObjectsToQcSegments(List.of(qcDaoObject));
  }

  private Pair<Instant, Instant> getTimesFromQcDaoObject(QcDaoObject qcDaoObject) {
    var startEpoch = qcDaoObject.getStartTime().getEpochSecond();
    var startTimeSeconds = startEpoch + qcDaoObject.getStartSample() / qcDaoObject.getSampleRate();
    var endTimeSeconds = startEpoch + qcDaoObject.getEndSample() / qcDaoObject.getSampleRate();

    var instantConverter = new NegativeNaInstantToDoubleConverter();
    var startTime = instantConverter.convertToEntityAttribute(startTimeSeconds);
    var endTime = instantConverter.convertToEntityAttribute(endTimeSeconds);
    return Pair.of(startTime, endTime);
  }

  void assertErrorThrown(
      Class<? extends Exception> expectedType, String expectedErrorMessage, Executable executable) {
    final Exception exception = assertThrows(expectedType, executable);

    assertNotNull(exception);
    assertEquals(expectedErrorMessage, exception.getMessage());
  }
}
