package gms.shared.stationdefinition.dao.css.enums;

import com.google.common.collect.ImmutableMap;

/** QcMask type for QcMaskSeg records */
public enum QcMaskType {
  UNPROCESSED(0L),
  MISSING(10L),
  FLAT(20L),
  NOISY(30L),
  BAD_SINGLE_POINT(40L),
  MULTIPLE_DATA_SPIKE(50L),
  SINGLE_DATA_SPIKE(60L),
  TOS_SPIKE(70L),
  AGGREGATE(100L),
  CHANNEL(200L),
  ANALYST_DELETED(300L),
  ANALYST(400L),
  CALIBRATION(500L);

  private static final ImmutableMap<Long, QcMaskType> QC_MASK_TYPE_BY_ID;
  private final long id;

  QcMaskType(long id) {
    this.id = id;
  }

  static {
    ImmutableMap.Builder<Long, QcMaskType> builder = ImmutableMap.builder();
    for (QcMaskType type : values()) {
      builder.put(type.getId(), type);
    }

    QC_MASK_TYPE_BY_ID = builder.build();
  }

  public long getId() {
    return id;
  }

  public static QcMaskType fromId(Long id) {
    return QC_MASK_TYPE_BY_ID.get(id);
  }
}
