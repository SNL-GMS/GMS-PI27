package gms.shared.waveform.qc.mask.converter;

import gms.shared.stationdefinition.dao.css.enums.QcMaskType;
import java.time.Instant;
import java.util.Objects;

public class QcDaoObject {

  private long qcMaskId;
  private String station;
  private String channel;
  private Instant startTime;
  private Instant endTime;
  private double sampleRate;
  private long endSample;
  private long startSample;
  private QcMaskType maskType;
  private String author;
  private Instant loadDate;

  public QcDaoObject() {}

  /**
   * Create a deep copy of the given {@link QcDaoObject}
   *
   * @param qcDaoObjectCopy QcDaoObject to copy
   */
  public QcDaoObject(QcDaoObject qcDaoObjectCopy) {
    Objects.requireNonNull(qcDaoObjectCopy);

    this.qcMaskId = qcDaoObjectCopy.qcMaskId;
    this.station = qcDaoObjectCopy.station;
    this.channel = qcDaoObjectCopy.channel;
    this.startTime = qcDaoObjectCopy.startTime;
    this.endTime = qcDaoObjectCopy.endTime;
    this.sampleRate = qcDaoObjectCopy.sampleRate;
    this.endSample = qcDaoObjectCopy.endSample;
    this.startSample = qcDaoObjectCopy.startSample;
    this.maskType = qcDaoObjectCopy.maskType;
    this.author = qcDaoObjectCopy.author;
    this.loadDate = qcDaoObjectCopy.loadDate;
  }

  public long getQcMaskId() {
    return qcMaskId;
  }

  public void setQcMaskId(long qcMaskId) {
    this.qcMaskId = qcMaskId;
  }

  public String getStation() {
    return station;
  }

  public void setStation(String station) {
    this.station = station;
  }

  public String getChannel() {
    return channel;
  }

  public void setChannel(String channel) {
    this.channel = channel;
  }

  public Instant getStartTime() {
    return startTime;
  }

  public void setStartTime(Instant startTime) {
    this.startTime = startTime;
  }

  public Instant getEndTime() {
    return endTime;
  }

  public void setEndTime(Instant endTime) {
    this.endTime = endTime;
  }

  public double getSampleRate() {
    return sampleRate;
  }

  public void setSampleRate(double sampleRate) {
    this.sampleRate = sampleRate;
  }

  public long getStartSample() {
    return startSample;
  }

  public void setStartSample(long startSample) {
    this.startSample = startSample;
  }

  public long getEndSample() {
    return endSample;
  }

  public void setEndSample(long endSample) {
    this.endSample = endSample;
  }

  public QcMaskType getMaskType() {
    return maskType;
  }

  public void setMaskType(QcMaskType maskType) {
    this.maskType = maskType;
  }

  public String getAuthor() {
    return author;
  }

  public void setAuthor(String author) {
    this.author = author;
  }

  public Instant getLoadDate() {
    return loadDate;
  }

  public void setLoadDate(Instant loadDate) {
    this.loadDate = loadDate;
  }

  @Override
  public int hashCode() {
    var hash = 7;
    hash = 29 * hash + (int) (this.qcMaskId ^ (this.qcMaskId >>> 32));
    hash = 29 * hash + Objects.hashCode(this.station);
    hash = 29 * hash + Objects.hashCode(this.channel);
    hash = 29 * hash + Objects.hashCode(this.startTime);
    hash = 29 * hash + Objects.hashCode(this.endTime);
    hash =
        29 * hash
            + (int)
                (Double.doubleToLongBits(this.sampleRate)
                    ^ (Double.doubleToLongBits(this.sampleRate) >>> 32));
    hash = 29 * hash + (int) (this.endSample ^ (this.endSample >>> 32));
    hash = 29 * hash + (int) (this.startSample ^ (this.startSample >>> 32));
    hash = 29 * hash + (int) (this.maskType.getId() ^ (this.maskType.getId() >>> 32));
    hash = 29 * hash + Objects.hashCode(this.author);
    hash = 29 * hash + Objects.hashCode(this.loadDate);
    return hash;
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
    final QcDaoObject other = (QcDaoObject) obj;
    if (this.qcMaskId != other.qcMaskId) {
      return false;
    }
    if (Double.doubleToLongBits(this.sampleRate) != Double.doubleToLongBits(other.sampleRate)) {
      return false;
    }
    if (this.endSample != other.endSample) {
      return false;
    }
    if (this.startSample != other.startSample) {
      return false;
    }
    if (this.maskType != other.maskType) {
      return false;
    }
    if (!Objects.equals(this.station, other.station)) {
      return false;
    }
    if (!Objects.equals(this.channel, other.channel)) {
      return false;
    }
    if (!Objects.equals(this.author, other.author)) {
      return false;
    }
    if (!Objects.equals(this.startTime, other.startTime)) {
      return false;
    }
    if (!Objects.equals(this.endTime, other.endTime)) {
      return false;
    }
    return Objects.equals(this.loadDate, other.loadDate);
  }
}
