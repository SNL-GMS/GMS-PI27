package gms.shared.stationdefinition.dao.css;

import gms.shared.utilities.bridge.database.converter.NegativeNaJulianDateConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import org.apache.commons.lang3.Validate;

@Embeddable
public class SiteKey implements Serializable {

  @Column(name = "sta", nullable = false)
  private String stationCode;

  @Column(name = "ondate", nullable = false)
  @Convert(converter = NegativeNaJulianDateConverter.class)
  private Instant onDate;

  public SiteKey() {}

  public SiteKey(String stationCode, Instant onDate) {
    this.stationCode = Validate.notBlank(stationCode, "SiteKey must be provided a station code");
    this.onDate = Validate.notNull(onDate, "SiteKey must be provided an on date");
  }

  public SiteKey(SiteKey copy) {
    this.stationCode = copy.getStationCode();
    this.onDate = copy.getOnDate();
  }

  public String getStationCode() {
    return stationCode;
  }

  public void setStationCode(String stationCode) {
    this.stationCode = stationCode;
  }

  public Instant getOnDate() {
    return onDate;
  }

  public void setOnDate(Instant onDate) {
    this.onDate = onDate;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    var siteKey = (SiteKey) o;
    return stationCode.equals(siteKey.stationCode) && onDate.equals(siteKey.onDate);
  }

  @Override
  public int hashCode() {
    return Objects.hash(stationCode, onDate);
  }

  @Override
  public String toString() {
    var strBuf = new StringBuilder();
    strBuf.append(stationCode);
    strBuf.append(".");
    strBuf.append(onDate);
    return strBuf.toString();
  }
}
