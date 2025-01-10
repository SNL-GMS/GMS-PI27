package gms.shared.waveform.bridge.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import ch.qos.logback.core.util.Duration;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.waveform.qc.coi.QcData;
import gms.shared.waveform.qc.coi.QcDataList;
import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

/** */
class QcDataGeneratorTest {

  @Test
  void testTimeShift() throws IOException {

    var baseTime = Instant.ofEpochSecond(1638316800);
    var newBaseTime = Instant.ofEpochSecond(1669852800);
    var myTime = Instant.ofEpochSecond(1640908800);
    // calculate the duration math is correct
    var actualTime = QcDataGenerator.timeShift(baseTime, newBaseTime, 100, 10, myTime);
    var dur = Duration.buildByHours(8760.0);
    assertEquals(
        dur.getMilliseconds(),
        java.time.Duration.between(baseTime, newBaseTime).toMillis(),
        "Validate duration of time shift");
    var expectedTime = Instant.ofEpochSecond(1672444800);
    expectedTime = expectedTime.plusSeconds(10);
    assertEquals(expectedTime, actualTime);

    var secondactualTime = QcDataGenerator.timeShift(baseTime, newBaseTime, 101, 10, myTime);
    assertTrue(
        secondactualTime.isAfter(actualTime), "Following sample should come after previous sample");
  }

  @Test
  void testItemComparison() throws IOException {

    var jsonString1 =
        "{\"qcMaskId\":1000000000001,\"sta\":\"ASAR.AS01\",\"chan\":\"SHZ\",\"startTime\":1546704000,\"endTime\":1546711200,\"sampRate\":20,\"nseg\":68,\"qcDefId\":5000000000555,\"lddate\":\"2022-09-08T17:43:58Z\",\"createdBy\":\"global:user3\",\"startSample\":27260,\"endSample\":27800,\"maskType\":10},";
    var jsonString2 =
        "{\"qcMaskId\":1000000000001,\"sta\":\"ASAR.AS01\",\"chan\":\"SHZ\",\"startTime\":1546704000,\"endTime\":1546711200,\"sampRate\":20,\"nseg\":68,\"qcDefId\":5000000000555,\"lddate\":\"2022-09-08T17:43:58Z\",\"createdBy\":\"global:user3\",\"startSample\":27260,\"endSample\":27800,\"maskType\":100},";
    var jsonString3 =
        "{\"qcMaskId\":1000000000001,\"sta\":\"ASAR.AS01\",\"chan\":\"SHZ\",\"startTime\":1546704000,\"endTime\":1546711200,\"sampRate\":20,\"nseg\":68,\"qcDefId\":5000000000555,\"lddate\":\"2022-09-08T17:43:58Z\",\"createdBy\":\"global:user3\",\"startSample\":27261,\"endSample\":27800,\"maskType\":10},";

    var jsonData1 = ObjectMappers.jsonMapper().readValue(jsonString1, QcData.class);
    var jsonData2 = ObjectMappers.jsonMapper().readValue(jsonString2, QcData.class);
    var jsonData3 = ObjectMappers.jsonMapper().readValue(jsonString3, QcData.class);

    var qcDataGenerator = new QcDataGenerator();
    var qcSegment1 =
        qcDataGenerator.createCannedQcSegmentWithVersions(
            jsonData1, Instant.ofEpochSecond(1546704000), 0);
    var qcSegment2 =
        qcDataGenerator.createCannedQcSegmentWithVersions(
            jsonData2, Instant.ofEpochSecond(1546704000), 0);
    var qcSegment3 =
        qcDataGenerator.createCannedQcSegmentWithVersions(
            jsonData3, Instant.ofEpochSecond(1546704000), 0);

    assertEquals(jsonData1.getStartTime(), jsonData2.getStartTime(), "startTimes should match");
    assertEquals(
        jsonData1.getStartSample(), jsonData2.getStartSample(), "startSamples should match");
    assertEquals(
        qcSegment1.getData().get().getVersionHistory().first().getData().get().getStartTime(),
        qcSegment2.getData().get().getVersionHistory().first().getData().get().getStartTime(),
        "Expected startTimes to match");
    assertEquals(jsonData2.getStartTime(), jsonData3.getStartTime(), "startTimes should match");
    assertNotEquals(
        jsonData2.getStartSample(), jsonData3.getStartSample(), "startSamples should NOT match");
    assertTrue(
        jsonData2.getStartSample() < jsonData3.getStartSample(), "startSamples 2 is before 3");

    assertNotEquals(
        qcSegment2.getData().get().getVersionHistory().first().getData().get().getStartTime(),
        qcSegment3.getData().get().getVersionHistory().first().getData().get().getStartTime(),
        "Expected startTimes to not match");

    assertTrue(
        qcSegment2
            .getData()
            .get()
            .getVersionHistory()
            .first()
            .getData()
            .get()
            .getStartTime()
            .isBefore(
                qcSegment3
                    .getData()
                    .get()
                    .getVersionHistory()
                    .first()
                    .getData()
                    .get()
                    .getStartTime()),
        "startSamples 2 is before 3");
  }

  @Test
  void testItemSerializationAndGeneration() throws IOException {

    var jsonFile = new File("src/test/resources/QcDataItem.json");

    var jsonData = ObjectMappers.jsonMapper().readValue(jsonFile, QcData.class);
    var qcDataGenerator = new QcDataGenerator();
    var qcSegment =
        qcDataGenerator.createCannedQcSegmentWithVersions(
            jsonData, Instant.ofEpochSecond(1577836800), 0);
    assertTrue(qcSegment.getData().isPresent());
    assertEquals(1, qcSegment.getData().get().getVersionHistory().size(), "One version");
    assertEquals(
        "aTestUser",
        qcSegment.getData().get().getVersionHistory().first().getData().get().getCreatedBy());
  }

  @Test
  void testListSerializationAndGeneration() throws IOException {

    var jsonFile = new File("src/test/resources/QcDataSet.json");

    var shiftInstant = Instant.ofEpochSecond(1577836800);
    var beforeShiftInstant = shiftInstant.minusNanos(1);
    var jsonData = ObjectMappers.jsonMapper().readValue(jsonFile, QcDataList.class);
    var qcDataGenerator = new QcDataGenerator();
    var qcDataList =
        jsonData.getQcList().stream()
            .map(
                data ->
                    qcDataGenerator.createCannedQcSegmentWithVersions(
                        data, Instant.ofEpochSecond(1577836800), 0))
            .collect(Collectors.toList());

    qcDataList.forEach(
        qc -> {
          assertTrue(
              beforeShiftInstant.isBefore(
                  qc.getData().get().getVersionHistory().first().getData().get().getStartTime()),
              "Times should occur after adjusted Instant. "
                  + "expected:["
                  + beforeShiftInstant
                  + "] found: ["
                  + qc.getData().get().getVersionHistory().first().getData().get().getStartTime()
                  + "]");
        });
    assertEquals(7257, qcDataList.size(), "Invalid number of items in list");
  }

  @Test
  void testListGenerationVersions() throws IOException {

    var jsonFile = new File("src/test/resources/QcDataSet.json");

    var shiftInstant = Instant.ofEpochSecond(1577836800);
    var beforeShiftInstant = shiftInstant.minusNanos(1);
    var jsonData = ObjectMappers.jsonMapper().readValue(jsonFile, QcDataList.class);
    var qcDataGenerator = new QcDataGenerator();
    var qcDataList =
        jsonData.getQcList().stream()
            .map(
                data ->
                    qcDataGenerator.createCannedQcSegmentWithVersions(
                        data, Instant.ofEpochSecond(1577836800), 0))
            .collect(Collectors.toList());

    qcDataList.forEach(
        qc -> {
          assertTrue(
              beforeShiftInstant.isBefore(
                  qc.getData().get().getVersionHistory().first().getData().get().getStartTime()),
              "Times should occur after adjusted Instant. "
                  + "expected:["
                  + beforeShiftInstant
                  + "] found: ["
                  + qc.getData().get().getVersionHistory().first().getData().get().getStartTime()
                  + "]");
        });
    assertEquals(7257, qcDataList.size(), "Invalid number of items in list");
    qcDataList.forEach(
        qc -> {
          assertEquals(
              1,
              qc.getData().get().getVersionHistory().size(),
              "All data should only have 1 version");
        });
  }

  @Test
  void testValidateMaskTypeCoverage() throws IOException {

    var jsonFile = new File("src/test/resources/QcDataSet.json");

    var jsonData = ObjectMappers.jsonMapper().readValue(jsonFile, QcDataList.class);

    var qcDataGenerator = new QcDataGenerator();
    var maskTypes =
        jsonData.getQcList().stream()
            .map(qc -> qc.getMaskType())
            .distinct()
            .collect(Collectors.toList());
    assertEquals(
        qcDataGenerator.buildData().size(), maskTypes.size(), "All masktypes should be covered");
  }

  @Test
  void testVersionCreation() throws IOException {

    var jsonFile = new File("src/test/resources/QcDataItem.json");

    var jsonData = ObjectMappers.jsonMapper().readValue(jsonFile, QcData.class);
    var qcDataGenerator = new QcDataGenerator();

    var qcSegment = qcDataGenerator.createVersions(jsonData, Instant.ofEpochSecond(1577836800), -1);
    assertEquals(1, qcSegment.size());

    qcSegment = qcDataGenerator.createVersions(jsonData, Instant.ofEpochSecond(1577836800), 0);
    assertEquals(1, qcSegment.size());
    qcSegment = qcDataGenerator.createVersions(jsonData, Instant.ofEpochSecond(1577836800), 1);
    assertEquals(2, qcSegment.size());
  }

  @Test
  void testListGenerationVersionsOneItemDatabase() throws IOException {

    var jsonFile = new File("src/test/resources/QcDataItem.json");

    var jsonData = ObjectMappers.jsonMapper().readValue(jsonFile, QcData.class);
    var qcDataGenerator = new QcDataGenerator();
    var qcSegment =
        qcDataGenerator.createCannedQcSegmentWithVersions(
            jsonData, Instant.ofEpochSecond(1577836800), 1);
    assertTrue(qcSegment.getData().isPresent());
    assertEquals(
        2, qcSegment.getData().get().getVersionHistory().size(), "Two version histories expected");
    var first = qcSegment.getData().get().getVersionHistory().first();
    var second = qcSegment.getData().get().getVersionHistory().last();
    assertNotEquals(first, second);
    assertNotEquals(first.getId(), second.getId(), "Version History ids should be different");
    assertTrue(
        first.getData().get().getStartTime().isBefore(second.getData().get().getStartTime()),
        "Version History ids should be different");
  }

  @Test
  void testListGenerationVersionsOneItemManual() throws IOException {

    var jsonFile = new File("src/test/resources/QcDataItemManual.json");

    var jsonData = ObjectMappers.jsonMapper().readValue(jsonFile, QcData.class);
    var qcDataGenerator = new QcDataGenerator();
    var qcSegment =
        qcDataGenerator.createCannedQcSegmentWithVersions(
            jsonData, Instant.ofEpochSecond(1577836800), 1);
    assertTrue(qcSegment.getData().isPresent());
    assertEquals(
        2, qcSegment.getData().get().getVersionHistory().size(), "Two version histories expected");
    var first = qcSegment.getData().get().getVersionHistory().first();
    var second = qcSegment.getData().get().getVersionHistory().last();
    assertNotEquals(first, second);
    assertNotEquals(first.getId(), second.getId(), "Version History ids should be different");
    assertTrue(
        first.getData().get().getStartTime().isBefore(second.getData().get().getStartTime()),
        "Version History ids should be different");
  }

  @Test
  void testInvalidInput() throws IOException {

    var jsonFile = new File("src/test/resources/QcDataItem.json");

    var jsonData = ObjectMappers.jsonMapper().readValue(jsonFile, QcData.class);
    jsonData.setSampRate(0);
    var qcDataGenerator = new QcDataGenerator();
    var originTime = Instant.ofEpochSecond(1577836800);
    assertThrows(
        IllegalArgumentException.class,
        () -> qcDataGenerator.createCannedQcSegmentWithVersions(jsonData, originTime, 1));
  }
}
