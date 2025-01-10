package gms.shared.waveform.qc.mask.dao;

import gms.shared.stationdefinition.dao.css.enums.QcMaskType;
import gms.shared.waveform.qc.mask.dao.converter.QcMaskTypeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "qcmaskseg")
public class QcMaskSegDao {

  private QcMaskIdStartSampleKey qcMaskSegKey;
  private long endSample;
  private QcMaskType maskType;
  private String author;
  private Instant loadDate;

  public QcMaskSegDao() {}

  /**
   * Create a deep copy of the given {@link QcMaskSegDao}
   *
   * @param qcMaskSegDaoCopy QcMaskInfoDao to copy
   */
  public QcMaskSegDao(QcMaskSegDao qcMaskSegDaoCopy) {
    Objects.requireNonNull(qcMaskSegDaoCopy);
    Objects.requireNonNull(qcMaskSegDaoCopy.getQcMaskSegKey());

    this.endSample = qcMaskSegDaoCopy.endSample;
    this.maskType = qcMaskSegDaoCopy.maskType;
    this.author = qcMaskSegDaoCopy.author;
    this.loadDate = qcMaskSegDaoCopy.loadDate;
    this.qcMaskSegKey = new QcMaskIdStartSampleKey();

    QcMaskIdStartSampleKey qcMaskSegOldKey = qcMaskSegDaoCopy.getQcMaskSegKey();

    this.qcMaskSegKey.setQcMaskId(qcMaskSegOldKey.getQcMaskId());
    this.qcMaskSegKey.setStartSample(qcMaskSegOldKey.getStartSample());
  }

  @EmbeddedId
  public QcMaskIdStartSampleKey getQcMaskSegKey() {
    return qcMaskSegKey;
  }

  public void setQcMaskSegKey(QcMaskIdStartSampleKey qcMaskSegKey) {
    this.qcMaskSegKey = qcMaskSegKey;
  }

  @Column(name = "endsample", nullable = false)
  public long getEndSample() {
    return endSample;
  }

  public void setEndSample(long endSample) {
    this.endSample = endSample;
  }

  @Column(name = "masktype", nullable = false)
  @Convert(converter = QcMaskTypeConverter.class)
  public QcMaskType getMaskType() {
    return maskType;
  }

  public void setMaskType(QcMaskType maskType) {
    this.maskType = maskType;
  }

  @Column(name = "auth")
  public String getAuthor() {
    return author;
  }

  public void setAuthor(String author) {
    this.author = author;
  }

  @Column(name = "lddate")
  public Instant getLoadDate() {
    return loadDate;
  }

  public void setLoadDate(Instant loadDate) {
    this.loadDate = loadDate;
  }

  @Override
  public String toString() {
    return "QcMaskSegDao{"
        + "qcMaskSegKey="
        + qcMaskSegKey
        + ", endSample="
        + endSample
        + ", maskType="
        + maskType
        + ", author="
        + author
        + ", loadDate="
        + loadDate
        + '}';
  }
}
