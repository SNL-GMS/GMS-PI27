package gms.shared.waveform.qc.mask.controller;

import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.END_TIME;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_INFO_DAO1;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.QCMASK_SEG_DAO4;
import static gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures.START_TIME;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.google.common.collect.Range;
import com.google.common.collect.RangeSet;
import com.google.common.collect.TreeRangeSet;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.dao.css.enums.QcMaskType;
import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.mask.converter.BridgedQcSegmentConverter;
import gms.shared.waveform.qc.mask.converter.QcDaoObject;
import gms.shared.waveform.qc.mask.testfixtures.QcTestFixtures;
import gms.shared.waveform.qc.mask.util.QcSegmentUtility;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QcSegmentControllerTest {

  @Mock private StationDefinitionIdUtility stationDefinitionIdUtility;

  @Mock private StationDefinitionAccessor stationDefinitionAccessor;

  private QcSegmentController controller;
  private BridgedQcSegmentConverter converter;

  @BeforeEach
  void setup() {
    converter = new BridgedQcSegmentConverter(stationDefinitionAccessor);

    controller = new QcSegmentController(converter);
  }

  @Test
  void testNullQcSegments() {
    assertErrorThrown(
        NullPointerException.class,
        QcSegmentController.NULL_QC_SEGMENTS,
        () ->
            controller.updateQcSegmentsAndVersions(
                null, List.of(QcTestFixtures.getDefaultQcDaoObject())));
  }

  @Test
  void testNullQcDaoObjects() {
    assertErrorThrown(
        NullPointerException.class,
        QcSegmentController.NULL_QC_DAO_OBJECTS,
        () -> controller.updateQcSegmentsAndVersions(getQcSegmentsFromCache(), null));
  }

  @Test
  void testTimeOverlapTimeRangeMatch() {
    var qcDaoObject = QcTestFixtures.getDefaultQcDaoObject();
    var qcDaoObjects = List.of(qcDaoObject);
    var qcSegments = getQcSegmentsFromCache();

    List<QcSegment> actualQcSegments =
        controller.updateQcSegmentsAndVersions(qcSegments, qcDaoObjects);

    assertTrue(!actualQcSegments.isEmpty());
  }

  @Test
  void testQcDaoObjects() {
    var expectedQcDaoObject = QcTestFixtures.getDefaultQcDaoObject();

    List<QcDaoObject> actualQcDaoObjects =
        controller.getQcDaoObjects(List.of(QCMASK_INFO_DAO1), List.of(QCMASK_SEG_DAO4));

    assertEquals(expectedQcDaoObject, actualQcDaoObjects.get(0));
  }

  @Test
  void testEmptyQcSegmentsFromCacheCreateNewQcSegment() {
    var qcDaoObject = QcTestFixtures.getDefaultQcDaoObject();
    var qcDaoObjects = List.of(qcDaoObject);
    List<QcSegment> qcSegments = new ArrayList<>();

    List<QcSegment> actualQcSegments =
        controller.updateQcSegmentsAndVersions(qcSegments, qcDaoObjects);

    verifyQcSegments(actualQcSegments, qcDaoObjects);
  }

  @Test
  void testNoTimeOverlapCreateNewQcSegment() {
    var qcDaoObject = QcTestFixtures.getDefaultQcDaoObject();
    qcDaoObject.setStartTime(START_TIME.plusSeconds(10000));
    qcDaoObject.setEndTime(END_TIME.plusSeconds(10000));

    var qcDaoObjects = List.of(qcDaoObject);
    var qcSegments = getQcSegmentsFromCache();

    List<QcSegment> actualQcSegments =
        controller.updateQcSegmentsAndVersions(qcSegments, qcDaoObjects);

    verifyQcSegments(actualQcSegments, qcDaoObjects);
  }

  @Test
  void testDifferentStaChanKeysCreateNewQcSegment() {
    var qcDaoObject = QcTestFixtures.getDefaultQcDaoObject();
    qcDaoObject.setStation("AS03");
    qcDaoObject.setChannel("SHF");

    var qcDaoObjects = List.of(qcDaoObject);
    var qcSegments = getQcSegmentsFromCache();

    List<QcSegment> actualQcSegments =
        controller.updateQcSegmentsAndVersions(qcSegments, qcDaoObjects);

    verifyQcSegments(actualQcSegments, qcDaoObjects);
  }

  @Test
  void testTimeOverlapDifferentSegmentTypes() {
    // set new time range and mask type for dao object
    var qcDaoObject = QcTestFixtures.getDefaultQcDaoObject();
    qcDaoObject.setMaskType(QcMaskType.FLAT);
    qcDaoObject.setStartTime(START_TIME.plusSeconds(500));
    qcDaoObject.setEndTime(END_TIME.plusSeconds(1000));

    // process the segments and dao objects
    var qcDaoObjects = List.of(qcDaoObject);
    var qcSegments = getQcSegmentsFromCache();

    List<QcSegment> actualQcSegments =
        controller.updateQcSegmentsAndVersions(qcSegments, qcDaoObjects);

    assertEquals(1, actualQcSegments.size());
    verifyQcSegments(actualQcSegments, qcDaoObjects);
  }

  @Test
  void testTimeOverlapSameSegmentTypeEnclosedTimeRange() {
    // case 2 test for qc update of enclosed segments
    var qcDaoObject = QcTestFixtures.getDefaultQcDaoObject();
    qcDaoObject.setMaskType(QcMaskType.MULTIPLE_DATA_SPIKE);
    qcDaoObject.setStartTime(START_TIME.minusSeconds(1000));
    qcDaoObject.setEndTime(END_TIME.plusSeconds(1000));

    // process the segments and dao objects
    var qcDaoObjects = List.of(qcDaoObject);
    var qcSegments = getQcSegmentsFromCache();

    List<QcSegment> actualQcSegments =
        controller.updateQcSegmentsAndVersions(qcSegments, qcDaoObjects);

    assertEquals(1, actualQcSegments.size());

    // TODO: Need to verify the updated version history in the qc segmnts
    verifyQcSegments(actualQcSegments, qcDaoObjects);
  }

  @Test
  void testTimeOverlapCreateNewQcSegmentsFromGaps() {
    // case 4 test for qc seg create
    var qcDaoObjects = List.of(QcTestFixtures.getDefaultQcDaoObject());
    var qcSegments = getMultipleQcSegments();

    // create time ranges for qcDaoObject and qc segments
    var daoTimeRange = QcSegmentUtility.getQcDaoTimeRange(qcDaoObjects.get(0));
    var qcSegTimeRange1 = QcSegmentUtility.getQcSegmentTimeRange(qcSegments.get(0));
    var qcSegTimeRange2 = QcSegmentUtility.getQcSegmentTimeRange(qcSegments.get(1));

    // create time range set and find the gaps
    RangeSet<Instant> daoRangeSet = TreeRangeSet.create();
    daoRangeSet.add(daoTimeRange);
    daoRangeSet.remove(qcSegTimeRange1);
    daoRangeSet.remove(qcSegTimeRange2);
    List<Range<Instant>> rangeList = new ArrayList<>(daoRangeSet.asRanges());
    Range<Instant> expectedGapRange = rangeList.get(0);

    List<QcSegment> actualQcSegments =
        controller.updateQcSegmentsAndVersions(qcSegments, qcDaoObjects);

    assertEquals(1, actualQcSegments.size());
    QcSegment convertedQcSegment = actualQcSegments.get(0);
    assertTrue(convertedQcSegment.getData().isPresent());
    Range<Instant> actualGapRange = QcSegmentUtility.getQcSegmentTimeRange(convertedQcSegment);
    assertTrue(gapsEqual(expectedGapRange, actualGapRange));
  }

  /**
   * Create QcSegments from default QcDaoObject
   *
   * @return default QcSegments {@link List<QcSegment>}
   */
  private List<QcSegment> getQcSegmentsFromCache() {
    var qcDaoObject = QcTestFixtures.getDefaultQcDaoObject();

    return converter.convertQcDaoObjectsToQcSegments(List.of(qcDaoObject));
  }

  /**
   * Create multiple QcSegments with gaps
   *
   * @return list of qc segments {@link List<QcSegment>}
   */
  private List<QcSegment> getMultipleQcSegments() {
    var qcDaoObject1 = QcTestFixtures.getDefaultQcDaoObject();
    var qcDaoObject2 = QcTestFixtures.getDefaultQcDaoObject();

    // shift the first qc dao object backwar
    qcDaoObject1.setStartTime(START_TIME.minusSeconds(500));
    qcDaoObject1.setEndTime(START_TIME.plusSeconds(1000));

    // shift the scond qc dao object forward
    qcDaoObject2.setStartTime(END_TIME.minusSeconds(1000));
    qcDaoObject2.setEndTime(END_TIME.plusSeconds(500));

    return converter.convertQcDaoObjectsToQcSegments(List.of(qcDaoObject1, qcDaoObject2));
  }

  /**
   * Check if the expected and actual gap ranges match
   *
   * @param expectedGapRange
   * @param actualGapRange
   * @return match boolean
   */
  private boolean gapsEqual(Range<Instant> expectedGapRange, Range<Instant> actualGapRange) {
    return expectedGapRange.lowerEndpoint().equals(actualGapRange.lowerEndpoint())
        && expectedGapRange.upperEndpoint().equals(actualGapRange.upperEndpoint());
  }

  /**
   * Verify weather the QcSegment created by the converter is correct
   *
   * @param qcSegments input {@link List<QcSegment>}
   * @param qcDaoObjects input {@link List<QcDaoObject>}
   */
  private void verifyQcSegments(List<QcSegment> actualQcSegments, List<QcDaoObject> qcDaoObjects) {
    assertTrue(actualQcSegments.get(0).getData().isPresent());

    Optional<QcSegment.Data> data = actualQcSegments.get(0).getData();

    String actualChannelName = data.get().getChannel().getName();

    String expectedChannelName = QcSegmentUtility.createChannelName(qcDaoObjects.get(0));

    assertEquals(expectedChannelName, actualChannelName);
  }

  /**
   * Asserts an Exception is not null and if the expected message is correct
   *
   * @param expected Exception type {@link Class<? extends Exception>}
   * @param expected error message {@link String}
   * @param executable statement {@link Executable}
   */
  void assertErrorThrown(
      Class<? extends Exception> expectedType, String expectedErrorMessage, Executable executable) {
    final Exception exception = assertThrows(expectedType, executable);

    assertNotNull(exception);
    assertEquals(expectedErrorMessage, exception.getMessage());
  }
}
