package gms.shared.waveform.bridge.repository.utils;

import com.fasterxml.jackson.databind.ObjectReader;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.waveform.processingmask.coi.PMDataList;
import gms.shared.waveform.qc.coi.QcDataList;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

/**
 * A Utility class for loading canned QC and Processing Mask(PM) data from files kept in the
 * resources directory.
 */
public final class CannedQcUtility {

  private static final String CANNED_QC_DATA_FILE = "QcDataSet.json";
  private static final Map<String, String> pmFileByCannedType =
      Map.of(
          "MULTIPLE", "pmdatalist.json",
          "EVENT_BEAM", "event_beam_pmdatalist.json");

  private static final ObjectReader jsonReader = ObjectMappers.jsonReader();

  private CannedQcUtility() {
    // Private constructor for utility class
  }

  /**
   * Reads Canned QcData from an internal json file.
   *
   * @return A List of canned QcData
   * @throws IOException IOException when there are issues reading the file from resources and
   *     parsing the JSON into the expected object.
   */
  public static QcDataList readCannedQcData() throws IOException {
    try (InputStream qcJsonFile =
        Thread.currentThread().getContextClassLoader().getResourceAsStream(CANNED_QC_DATA_FILE)) {
      return jsonReader.readValue(qcJsonFile, QcDataList.class);
    }
  }

  /**
   * Reads Canned PM from internal json files. Selects the appropriate file based on the cannedType.
   *
   * @param cannedType Defines the type of canned data available to read. Currently allows MULTIPLE
   *     and EVENT_BEAM
   * @return A List of canned Processing Mask Data
   * @throws IOException when there are issues reading the file from resources and parsing the JSON
   *     into the expected object.
   */
  public static PMDataList readCannedPMData(String cannedType) throws IOException {
    try (InputStream pmJsonFile =
        Thread.currentThread()
            .getContextClassLoader()
            .getResourceAsStream(pmFileByCannedType.get(cannedType))) {

      return jsonReader.readValue(pmJsonFile, PMDataList.class);
    }
  }
}
