package gms.shared.stationdefinition.dao.css;

import gms.shared.stationdefinition.dao.css.converter.BandConverter;
import gms.shared.stationdefinition.dao.css.converter.DigitalConverter;
import gms.shared.stationdefinition.dao.css.enums.Band;
import gms.shared.stationdefinition.dao.css.enums.Digital;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "instrument")
public class InstrumentDao {

  private long instrumentId;
  private String instrumentName;
  private Band band;
  private Digital digital;
  private double sampleRate;
  private double nominalCalibrationFactor;
  private double nominalCalibrationPeriod;
  private String directory;
  private String dataFile;
  private String responseType;
  private Instant loadDate;

  public InstrumentDao() {
    // JPA constructor
  }

  @Id
  @Column(name = "inid")
  public long getInstrumentId() {
    return instrumentId;
  }

  public void setInstrumentId(long instrumentId) {
    this.instrumentId = instrumentId;
  }

  @Column(name = "insname")
  public String getInstrumentName() {
    return instrumentName;
  }

  public void setInstrumentName(String instrumentName) {
    this.instrumentName = instrumentName;
  }

  @Column(name = "band")
  @Convert(converter = BandConverter.class)
  public Band getBand() {
    return band;
  }

  public void setBand(Band band) {
    this.band = band;
  }

  @Column(name = "digital")
  @Convert(converter = DigitalConverter.class)
  public Digital getDigital() {
    return digital;
  }

  public void setDigital(Digital digital) {
    this.digital = digital;
  }

  @Column(name = "samprate", nullable = false)
  public double getSampleRate() {
    return sampleRate;
  }

  public void setSampleRate(double sampleRate) {
    this.sampleRate = sampleRate;
  }

  @Column(name = "ncalib", nullable = false)
  public double getNominalCalibrationFactor() {
    return nominalCalibrationFactor;
  }

  public void setNominalCalibrationFactor(double nominalCalibrationFactor) {
    this.nominalCalibrationFactor = nominalCalibrationFactor;
  }

  @Column(name = "ncalper", nullable = false)
  public double getNominalCalibrationPeriod() {
    return nominalCalibrationPeriod;
  }

  public void setNominalCalibrationPeriod(double nominalCalibrationPeriod) {
    this.nominalCalibrationPeriod = nominalCalibrationPeriod;
  }

  @Column(name = "dir", nullable = false)
  public String getDirectory() {
    return directory;
  }

  public void setDirectory(String directory) {
    this.directory = directory;
  }

  @Column(name = "dfile", nullable = false)
  public String getDataFile() {
    return dataFile;
  }

  public void setDataFile(String dataFile) {
    this.dataFile = dataFile;
  }

  @Column(name = "rsptype", nullable = false)
  public String getResponseType() {
    return responseType;
  }

  public void setResponseType(String responseType) {
    this.responseType = responseType;
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
    InstrumentDao that = (InstrumentDao) o;
    return instrumentId == that.instrumentId
        && instrumentName.equals(that.instrumentName)
        && band == that.band
        && digital == that.digital
        && Double.compare(sampleRate, that.sampleRate) == 0
        && Double.compare(nominalCalibrationFactor, that.nominalCalibrationFactor) == 0
        && Double.compare(nominalCalibrationPeriod, that.nominalCalibrationPeriod) == 0
        && directory.equals(that.directory)
        && dataFile.equals(that.dataFile)
        && responseType.equals(that.responseType)
        && loadDate.equals(that.loadDate);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        instrumentId,
        instrumentName,
        band,
        digital,
        sampleRate,
        nominalCalibrationFactor,
        nominalCalibrationPeriod,
        directory,
        dataFile,
        responseType,
        loadDate);
  }
}
