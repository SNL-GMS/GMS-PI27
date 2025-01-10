package gms.shared.stationdefinition.coi.qc;

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

import com.google.common.collect.ImmutableList;
import java.util.List;

public enum QcSegmentCategory {
  ANALYST_DEFINED(
      true,
      new QcSegmentType[] {
        AGGREGATE,
        CALIBRATION,
        FLAT,
        GAP,
        NOISY,
        SENSOR_PROBLEM,
        SPIKE,
        STATION_PROBLEM,
        STATION_SECURITY,
        TIMING
      }),
  DATA_AUTHENTICATION,
  LONG_TERM,
  STATION_SOH(
      new QcSegmentType[] {
        CALIBRATION, NOISY, SENSOR_PROBLEM, STATION_PROBLEM, STATION_SECURITY, TIMING
      }),
  UNPROCESSED,
  WAVEFORM(new QcSegmentType[] {AGGREGATE, FLAT, GAP, NOISY, SPIKE});

  private final List<QcSegmentType> allowableTypes;

  private boolean allowEmptyType = false;

  public List<QcSegmentType> getAllowableTypes() {
    return allowableTypes;
  }

  public boolean allowEmptyType() {
    return allowEmptyType;
  }

  QcSegmentCategory(QcSegmentType[] allowableTypes) {
    this.allowableTypes = ImmutableList.copyOf(allowableTypes);
  }

  QcSegmentCategory(boolean allowEmptyType, QcSegmentType[] allowableTypes) {
    this.allowEmptyType = allowEmptyType;
    this.allowableTypes = ImmutableList.copyOf(allowableTypes);
  }

  QcSegmentCategory() {
    this.allowEmptyType = true;
    this.allowableTypes = List.of();
  }
}
