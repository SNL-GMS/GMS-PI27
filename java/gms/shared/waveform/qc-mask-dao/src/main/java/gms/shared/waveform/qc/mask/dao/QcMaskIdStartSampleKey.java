package gms.shared.waveform.qc.mask.dao;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import org.apache.commons.lang3.Validate;

@Embeddable
public class QcMaskIdStartSampleKey implements Serializable {

  private long qcMaskId;
  private long startSample;

  public QcMaskIdStartSampleKey() {}

  /**
   * Create a QcMaskIdStartSampleKey {@link QcMaskIdStartSampleKey}
   *
   * @param qcMaskId long qcMaskId
   * @param startSample long startSample
   * @return {@link QcMaskIdStartSampleKey}
   */
  public QcMaskIdStartSampleKey(long qcMaskId, long startSample) {
    Validate.notNaN(qcMaskId, "QcMaskIdStartSampleKey must be provided a qcMaskId");
    Validate.notNaN(startSample, "QcMaskIdStartSampleKey must be provided a startSample");

    this.qcMaskId = qcMaskId;
    this.startSample = startSample;
  }

  @Column(name = "qcmaskid", nullable = false)
  public long getQcMaskId() {
    return qcMaskId;
  }

  public void setQcMaskId(long qcMaskId) {
    this.qcMaskId = qcMaskId;
  }

  @Column(name = "startsample", nullable = false)
  public long getStartSample() {
    return startSample;
  }

  public void setStartSample(long startSample) {
    this.startSample = startSample;
  }

  @Override
  public int hashCode() {
    return Objects.hash(qcMaskId, startSample);
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) {
      return true;
    }
    if (obj == null) {
      return false;
    }
    if (getClass() != obj.getClass()) {
      return false;
    }
    final QcMaskIdStartSampleKey other = (QcMaskIdStartSampleKey) obj;
    if (this.qcMaskId != other.qcMaskId) {
      return false;
    }
    return this.startSample == other.startSample;
  }
}
