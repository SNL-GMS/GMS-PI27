package gms.shared.processingmask.utility;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.qc.QcSegmentCategory;
import gms.shared.stationdefinition.coi.qc.QcSegmentType;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.coi.QcSegmentVersionId;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.waveform.testfixture.ProcessingMaskTestFixtures;
import gms.shared.waveform.testfixture.QcSegmentTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class WaveformMaskingUtilityTest {

  private static final UUID ID_1 = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b871");
  private static final UUID ID_2 = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b872");
  private static final UUID ID_3 = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b873");
  private static final UUID ID_4 = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b874");

  @Test
  void testNullQcSegmentVersions() {
    var exMessage =
        assertThrows(
            NullPointerException.class,
            () -> WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(null, null),
            "Expected Exception to occur from bad input");
    assertEquals("QcSegmentVersions must not be null", exMessage.getMessage());
  }

  @Test
  void testNullProcessingMaskDefinition() {
    Collection<QcSegmentVersion> emptyList = List.of();
    var exMessage =
        assertThrows(
            NullPointerException.class,
            () ->
                WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(emptyList, null),
            "Expected Exception to occur from bad input");

    assertEquals("ProcessingMaskDefinition must not be null", exMessage.getMessage());
  }

  @Test
  void testEmptyQcSegmentVersions() {
    var pmList =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            List.of(), ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT);

    assertEquals(
        List.of(), pmList, "Expected empty list returned when no QcSegmentVersions provided");
  }

  @Test
  void testSingleQcSegmentVersionNoCategory() {

    var qcId =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(ID_1)
            .build();

    var qcData =
        QcSegmentVersion.Data.instanceBuilder()
            .setChannels(List.of(QcSegmentTestFixtures.CHANNEL_ONE))
            .setDiscoveredOn(List.of(QcSegmentTestFixtures.CHANNEL_SEGMENT))
            .setCreatedBy("Beethoven")
            .setRationale("A sublime interpretation of the human condition")
            .setStartTime(Instant.MIN)
            .setEndTime(Instant.MIN.plusSeconds(2))
            .setRejected(false)
            .build();

    System.out.println(qcData.getCategory());

    var qsvNoCategory = QcSegmentVersion.instanceBuilder().setId(qcId).setData(qcData).build();

    var qsvList = List.of(qsvNoCategory);

    var exMessage =
        assertThrows(
            IllegalStateException.class,
            () ->
                WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
                    qsvList, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT_FLAT),
            "Expected Exception to occur from input without data");

    assertEquals(WaveformMaskingUtility.QC_CATEGORY_MISSING_MSG, exMessage.getMessage());
  }

  @Test
  void testSingleQcSegmentVersionMismatchedType() {
    var qcVersions = List.of(QcSegmentTestFixtures.QCSEG_VERSION_ONE);
    var pmList =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            qcVersions, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT);

    assertEquals(List.of(), pmList, "Expected empty list (Type NOISY/FLAT)");
  }

  @Test
  void testSingleQcSegmentVersionMismatchedCategory() {
    var qcVersions = List.of(QcSegmentTestFixtures.QCSEG_VERSION_ONE);
    var pmList =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            qcVersions, ProcessingMaskTestFixtures.PROC_MASK_DEF_ANALYST);

    assertEquals(List.of(), pmList, "Expected empty list (Category WAVEFORM/ANALYST_DEFINED)");
  }

  @Test
  void testIdOnlyQsv() {
    final var QCSEG_ID =
        QcSegmentVersionId.instanceBuilder()
            .setEffectiveAt(Instant.MIN)
            .setParentQcSegmentId(UUID.fromString(QcSegmentTestFixtures.UUID_STRING))
            .build();

    final var QCSEG_ID_ONLY = QcSegmentVersion.instanceBuilder().setId(QCSEG_ID).build();

    var qcVersions = List.of(QCSEG_ID_ONLY);

    var exMessage =
        assertThrows(
            IllegalStateException.class,
            () ->
                WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
                    qcVersions, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT_FLAT),
            "Expected Exception to occur from input without data");

    assertEquals(WaveformMaskingUtility.QC_DATA_MISSING_MSG, exMessage.getMessage());
  }

  @Test
  void testMultipleChannelsPresent() {
    var channel = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST1.BHZ");
    var channel2 = ChannelSegmentTestFixtures.getTestChannel("TEST.TEST2.BHZ");

    var qcVersions =
        List.of(
            QcSegmentTestFixtures.getQcSegmentVersion(1, 1, channel, ID_1),
            QcSegmentTestFixtures.getQcSegmentVersion(1, 2, channel2, ID_2));

    var exMessage =
        assertThrows(
            IllegalArgumentException.class,
            () ->
                WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
                    qcVersions, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT_FLAT),
            "Expected Exception to occur from bad input");

    assertEquals("Channel Count Mismatch [Expected]: 1 [Found]:2", exMessage.getMessage());
  }

  @Test
  void testSingleQcSegmentVersion() {
    var pmData =
        ProcessingMask.Data.instanceBuilder()
            .setEffectiveAt(Instant.now())
            .setStartTime(Instant.MIN)
            .setEndTime(Instant.MIN.plusSeconds(1))
            .setProcessingOperation(ProcessingOperation.ROTATION)
            .setAppliedToRawChannel(QcSegmentTestFixtures.CHANNEL_ONE)
            .setMaskedQcSegmentVersions(List.of(QcSegmentTestFixtures.QCSEG_VERSION_ONE));

    var uuid = UUID.fromString(QcSegmentTestFixtures.UUID_STRING);

    var expected = ProcessingMask.instanceBuilder().setId(uuid).setData(pmData.build()).build();

    var expectedList = List.of(expected);

    var qcVersions = List.of(QcSegmentTestFixtures.QCSEG_VERSION_ONE);
    var pmList =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            qcVersions, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT_FLAT);

    assertEquals(expectedList.size(), pmList.size(), "Expected lists to be the same size");

    var pm = pmList.stream().findFirst().get();

    var expectedData = expected.getData().get();
    var actualData = pm.getData().get();

    testProcessingMaskData(expectedData, actualData);
  }

  @Test
  void testVersionBeforeDurationThreshold() {
    var qcVersions =
        List.of(
            QcSegmentTestFixtures.getQcSegmentVersion(1, 0, ID_1),
            QcSegmentTestFixtures.getQcSegmentVersion(1, 1, ID_2));
    var pmList =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            qcVersions, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT_FLAT);

    assertEquals(1, pmList.size(), "Expected both segments to have the same mask");
  }

  @Test
  void testVersionAtDurationThreshold() {
    var qcVersions =
        List.of(
            QcSegmentTestFixtures.getQcSegmentVersion(1, 0, ID_1),
            QcSegmentTestFixtures.getQcSegmentVersion(1, 2, ID_2));
    var pmList =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            qcVersions, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT_FLAT);
    assertEquals(1, pmList.size(), "Expected the segments to be in the same mask");
  }

  @Test
  void testVersionAfterDurationThreshold() {
    var qcVersions =
        List.of(
            QcSegmentTestFixtures.getQcSegmentVersion(1, 0, ID_1),
            QcSegmentTestFixtures.getQcSegmentVersion(1, 3, ID_2));
    var pmList =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            qcVersions, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT_FLAT);

    assertEquals(2, pmList.size(), "Expected the segments to be in different masks");
  }

  @Test
  void testMultipleVersions() {
    var qcVersions =
        List.of(
            QcSegmentTestFixtures.getQcSegmentVersion(1, 0, ID_1),
            QcSegmentTestFixtures.getQcSegmentVersion(1, 1, ID_2),
            QcSegmentTestFixtures.getQcSegmentVersion(1, 2, ID_3),
            QcSegmentTestFixtures.getQcSegmentVersion(1, 3, ID_4));
    var pmList =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            qcVersions, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT_FLAT);

    assertEquals(1, pmList.size(), "Expected the segments to be in the same mask");
  }

  @Test
  void testTimeSorting() {
    var seg1 = QcSegmentTestFixtures.getQcSegmentVersion(1, 1, ID_1);
    var seg2 = QcSegmentTestFixtures.getQcSegmentVersion(1, 2, ID_2);
    var seg3 = QcSegmentTestFixtures.getQcSegmentVersion(1, 3, ID_3);
    var seg4 = QcSegmentTestFixtures.getQcSegmentVersion(1, 4, ID_4);

    var sortedList = List.of(seg1, seg2, seg3, seg4);
    var nonSortedList = List.of(seg4, seg1, seg2, seg3);

    var pmListSorted =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            sortedList, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT_FLAT);
    var pmListNonSorted =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            nonSortedList, ProcessingMaskTestFixtures.PROC_MASK_DEF_ROT_FLAT);

    assertEquals(
        pmListSorted.size(), pmListNonSorted.size(), "Expected the two lists to be the same size");
    assertEquals(1, pmListSorted.size(), "Expected the lists to be size 1");

    var pmSorted = pmListSorted.stream().findFirst().get();
    var pmNonSorted = pmListNonSorted.stream().findFirst().get();

    var dataSorted = pmSorted.getData().get();
    var dataNonSorted = pmNonSorted.getData().get();

    testProcessingMaskData(dataSorted, dataNonSorted);
  }

  @Test
  void testQcSegmentTypeNotPresent() {
    QcSegmentCategory category = QcSegmentCategory.ANALYST_DEFINED;
    QcSegmentType type = QcSegmentType.FLAT;

    var seg1 = QcSegmentTestFixtures.getQcSegmentVersion(1, 1, category, type, ID_1);
    var seg2 = QcSegmentTestFixtures.getQcSegmentVersion(1, 2, category, type, ID_2);

    var segNullType1 = QcSegmentTestFixtures.getQcSegmentVersion(1, 1, category, null, ID_1);
    var segNullType2 = QcSegmentTestFixtures.getQcSegmentVersion(1, 2, category, null, ID_2);

    var typeList = List.of(seg1, seg2);
    var typeNullList = List.of(segNullType1, segNullType2);

    var pmList =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            typeList, ProcessingMaskTestFixtures.PROC_MASK_DEF_ANALYST);
    var pmListNullType =
        WaveformMaskingUtility.createProcessingMasksFromQcSegmentVersions(
            typeNullList, ProcessingMaskTestFixtures.PROC_MASK_DEF_ANALYST);

    assertEquals(
        pmList.size(), pmListNullType.size(), "Expected the two lists to be the same size");
    assertEquals(1, pmList.size(), "Expected the lists to be size 1");

    var pm = pmList.stream().findFirst().get();
    var pmNullType = pmListNullType.stream().findFirst().get();

    var data = pm.getData().get();
    var dataNT = pmNullType.getData().get();

    var maskedQsv = data.getMaskedQcSegmentVersions().stream().findFirst().get().getData().get();
    var maskedQsvNT =
        dataNT.getMaskedQcSegmentVersions().stream().findFirst().get().getData().get();

    assertEquals(
        maskedQsv.getCategory(),
        maskedQsvNT.getCategory(),
        "Expected the categories to be the same");
    assertEquals(
        maskedQsv.getChannels(), maskedQsvNT.getChannels(), "Expected the channels to be the same");
    assertEquals(
        maskedQsv.getStartTime(),
        maskedQsvNT.getStartTime(),
        "Expected the start times to be the same");
    assertEquals(
        maskedQsv.getEndTime(), maskedQsvNT.getEndTime(), "Expected the end times to be the same");
  }

  private void testProcessingMaskData(ProcessingMask.Data dataSetA, ProcessingMask.Data dataSetB) {
    Duration thresholdDuration = Duration.ofSeconds(30);
    Duration delta = Duration.between(dataSetA.getEffectiveAt(), dataSetB.getEffectiveAt()).abs();

    assertTrue(
        delta.getSeconds() < thresholdDuration.getSeconds(),
        " EffectiveAt to be within " + thresholdDuration.getSeconds() + " seconds");

    assertEquals(
        dataSetA.getAppliedToRawChannel(),
        dataSetB.getAppliedToRawChannel(),
        "Expected AppliedToRawChannels to be the same");
    assertEquals(dataSetA.getEndTime(), dataSetB.getEndTime(), "Expected EndTime to be the same");
    assertEquals(
        dataSetA.getMaskedQcSegmentVersions(),
        dataSetB.getMaskedQcSegmentVersions(),
        "Expected MaskedQcSegmentVersions to be the same");
    assertEquals(
        dataSetA.getProcessingOperation(),
        dataSetB.getProcessingOperation(),
        "Expected ProcessingOperation to be the same");
    assertEquals(
        dataSetA.getStartTime(), dataSetB.getStartTime(), "Expected StartTime to be the same");
  }
}
