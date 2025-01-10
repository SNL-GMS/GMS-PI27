package gms.shared.stationdefinition.dao.css;

import gms.shared.utilities.bridge.database.converter.NegativeNaJulianDateConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;

@Entity
@Table(name = "sensor")
public class SensorDao {

  private SensorKey sensorKey;
  private InstrumentDao instrument;
  private long channelId;
  private Instant jDate;
  private double calibrationRatio;
  private double calibrationPeriod;
  private double tShift;
  private String snapshotIndicator;
  private Instant loadDate;

  public SensorDao() {
    // JPA constructor
  }

  @EmbeddedId
  public SensorKey getSensorKey() {
    return sensorKey;
  }

  public void setSensorKey(SensorKey sensorKey) {
    this.sensorKey = sensorKey;
  }

  @ManyToOne
  @JoinColumn(name = "inid", referencedColumnName = "inid")
  public InstrumentDao getInstrument() {
    return instrument;
  }

  public void setInstrument(InstrumentDao instrument) {
    this.instrument = instrument;
  }

  @Column(name = "chanid")
  public long getChannelId() {
    return channelId;
  }

  public void setChannelId(long channelId) {
    this.channelId = channelId;
  }

  @Column(name = "jdate")
  @Convert(converter = NegativeNaJulianDateConverter.class)
  public Instant getjDate() {
    return jDate;
  }

  public void setjDate(Instant jDate) {
    this.jDate = jDate;
  }

  @Column(name = "calratio")
  public double getCalibrationRatio() {
    return calibrationRatio;
  }

  public void setCalibrationRatio(double calibrationRatio) {
    this.calibrationRatio = calibrationRatio;
  }

  @Column(name = "calper")
  public double getCalibrationPeriod() {
    return calibrationPeriod;
  }

  public void setCalibrationPeriod(double calibrationPeriod) {
    this.calibrationPeriod = calibrationPeriod;
  }

  @Column(name = "tshift")
  public double gettShift() {
    return tShift;
  }

  public void settShift(double tShift) {
    this.tShift = tShift;
  }

  @Column(name = "instant")
  public String getSnapshotIndicator() {
    return snapshotIndicator;
  }

  public void setSnapshotIndicator(String snapshotIndicator) {
    this.snapshotIndicator = snapshotIndicator;
  }

  @Column(name = "lddate")
  public Instant getLoadDate() {
    return loadDate;
  }

  public void setLoadDate(Instant loadDate) {
    this.loadDate = loadDate;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    SensorDao that = (SensorDao) o;
    long thisInstId = 0;
    if (instrument != null) {
      thisInstId = instrument.getInstrumentId();
    }
    long thatInstId = 0;
    if (that.instrument != null) {
      thatInstId = that.instrument.getInstrumentId();
    }

    return sensorKey.equals(that.sensorKey)
        && thisInstId == thatInstId
        && channelId == that.channelId
        && jDate.equals(that.jDate)
        && Double.compare(calibrationRatio, that.calibrationRatio) == 0
        && Double.compare(calibrationPeriod, that.calibrationPeriod) == 0
        && Double.compare(tShift, that.tShift) == 0
        && snapshotIndicator.equals(that.snapshotIndicator)
        && loadDate.equals(that.loadDate);
  }

  @Override
  public int hashCode() {
    Long instId = null;
    if (instrument != null) {
      instId = instrument.getInstrumentId();
    }
    return Objects.hash(
        sensorKey,
        instId,
        channelId,
        jDate,
        calibrationRatio,
        calibrationPeriod,
        tShift,
        snapshotIndicator,
        loadDate);
  }

  @Transient
  public int getVersionAttributeHash() {
    return Objects.hash(
        this.getSensorKey().getStation(), this.getSensorKey().getChannel(), this.gettShift());
  }

  @Transient
  public int getVersionTimeHash() {
    return Objects.hash(
        this.getSensorKey().getStation(),
        this.getSensorKey().getChannel(),
        this.getSensorKey().getTime(),
        this.getSensorKey().getEndTime());
  }

  @Transient
  public Optional<Double> getSampleRate() {
    Double sampleRate = null;
    if (instrument != null) {
      sampleRate = instrument.getSampleRate();
    }
    return Optional.ofNullable(sampleRate);
  }
}
