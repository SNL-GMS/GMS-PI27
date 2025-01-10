package gms.shared.waveform.qc.mask.converter;

import gms.shared.waveform.qc.coi.QcSegment;
import gms.shared.waveform.qc.coi.QcSegmentVersion;
import gms.shared.waveform.qc.mask.dao.QcMaskInfoDao;
import gms.shared.waveform.qc.mask.dao.QcMaskSegDao;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface QcSegmentConverter {

  /**
   * Convert lists of QcMaskInfoDao and QcMaskSegDaos to a list of QcDaoObjects this makes it easier
   * to make conversions to QcSegment and QcSegmentVersion COIs
   *
   * @param qcMaskInfoDaos list of {@link QcMaskInfoDao}s
   * @param qcMaskSegDaos list of {@link QcMaskSegDao}
   * @return list of QcDaoObjects
   */
  List<QcDaoObject> convertQcMaskDaosToQcDaoObjects(
      Collection<QcMaskInfoDao> qcMaskInfoDaos, Collection<QcMaskSegDao> qcMaskSegDaos);

  /**
   * Convert list of {@link QcDaoObject}s to {@link QcSegment}s
   *
   * @param qcDaoObjects list of {@link QcDaoObject}s
   * @return list of {@link QcSegment}s
   */
  List<QcSegment> convertQcDaoObjectsToQcSegments(Collection<QcDaoObject> qcDaoObjects);

  /**
   * Convert !cSegment parent id and list of {@link QcDaoObject}s to {@link QcSegmentVersion}s
   *
   * @param qcSegmentId QcSegment parent UUID
   * @param qcDaoObjects list of {@link QcDaoObject}s
   * @return list of {@link QcSegment}s
   */
  List<QcSegmentVersion> convertQcDaoObjectsToQcSegmentVersions(
      UUID qcSegmentId, Collection<QcDaoObject> qcDaoObjects);
}
