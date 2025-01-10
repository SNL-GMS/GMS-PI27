package gms.shared.waveform.bridge.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.processingmask.coi.PMDataList;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.qc.coi.QcDataList;
import java.io.File;
import java.io.IOException;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class PmDataGeneratorTest {

  @Test
  void testItemSerializationAndGeneration() throws IOException {

    var pmJsonFile = new File("src/test/resources/pmdatalist.json");

    var qcJsonFile = new File("src/test/resources/QcDataSet.json");

    var qcJsonData = ObjectMappers.jsonMapper().readValue(qcJsonFile, QcDataList.class);
    var pmJsonData = ObjectMappers.jsonMapper().readValue(pmJsonFile, PMDataList.class);

    var processingMaskList =
        new PmDataGenerator()
            .createProcessingMasks(
                pmJsonData.getPmList(), qcJsonData.getQcList(), Instant.ofEpochSecond(1546704000));
    assertNotNull(processingMaskList);
    assertEquals(4, processingMaskList.size(), "Expected version count");

    JsonTestUtilities.assertSerializes(processingMaskList.get(0), ProcessingMask.class);
  }
}
