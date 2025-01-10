package gms.shared.stationdefinition.coi.qc;

import static gms.shared.stationdefinition.coi.qc.QcSegmentCategory.ANALYST_DEFINED;
import static gms.shared.stationdefinition.coi.qc.QcSegmentCategory.DATA_AUTHENTICATION;
import static gms.shared.stationdefinition.coi.qc.QcSegmentCategory.LONG_TERM;
import static gms.shared.stationdefinition.coi.qc.QcSegmentCategory.STATION_SOH;
import static gms.shared.stationdefinition.coi.qc.QcSegmentCategory.UNPROCESSED;
import static gms.shared.stationdefinition.coi.qc.QcSegmentCategory.WAVEFORM;
import static gms.shared.stationdefinition.coi.qc.QcSegmentType.AGGREGATE;
import static gms.shared.stationdefinition.coi.qc.QcSegmentType.CALIBRATION;
import static gms.shared.stationdefinition.coi.qc.QcSegmentType.FLAT;
import static gms.shared.stationdefinition.coi.qc.QcSegmentType.GAP;
import static gms.shared.stationdefinition.coi.qc.QcSegmentType.NOISY;
import static gms.shared.stationdefinition.coi.qc.QcSegmentType.SENSOR_PROBLEM;
import static gms.shared.stationdefinition.coi.qc.QcSegmentType.SPIKE;
import static gms.shared.stationdefinition.coi.qc.QcSegmentType.STATION_PROBLEM;
import static gms.shared.stationdefinition.coi.qc.QcSegmentType.STATION_SECURITY;
import static gms.shared.stationdefinition.coi.qc.QcSegmentType.TIMING;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class QcSegmentCategoryTest {

  @Test
  void testAllowedTypes() {

    var allowedTypeMap =
        new EnumMap<QcSegmentCategory, List<QcSegmentType>>(
            Map.of(
                ANALYST_DEFINED,
                List.of(
                    AGGREGATE,
                    CALIBRATION,
                    FLAT,
                    GAP,
                    NOISY,
                    SENSOR_PROBLEM,
                    SPIKE,
                    STATION_PROBLEM,
                    STATION_SECURITY,
                    TIMING),
                DATA_AUTHENTICATION,
                List.of(),
                LONG_TERM,
                List.of(),
                STATION_SOH,
                List.of(
                    CALIBRATION, NOISY, SENSOR_PROBLEM, STATION_PROBLEM, STATION_SECURITY, TIMING),
                UNPROCESSED,
                List.of(),
                WAVEFORM,
                List.of(AGGREGATE, FLAT, GAP, NOISY, SPIKE)));

    allowedTypeMap.forEach(
        (category, types) -> Assertions.assertEquals(types, category.getAllowableTypes()));
  }

  @Test
  void testEmptyTypeAllowed() {
    Arrays.stream(QcSegmentCategory.values())
        .forEach(
            category -> {
              // if other categories are changed to allow an empty type, add them to
              // this first check.
              if (category == ANALYST_DEFINED || category.getAllowableTypes().isEmpty()) {
                Assertions.assertTrue(category.allowEmptyType());
              } else {
                Assertions.assertFalse(category.allowEmptyType());
              }
            });
  }
}
