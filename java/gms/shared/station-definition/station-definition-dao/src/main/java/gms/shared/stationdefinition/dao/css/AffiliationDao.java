package gms.shared.stationdefinition.dao.css;

import gms.shared.utilities.bridge.database.converter.PositiveNaInstantToDoubleConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "affiliation")
public class AffiliationDao {

  private NetworkStationTimeKey networkStationTimeKey;
  private Instant endTime;
  private Instant loadDate;

  public AffiliationDao() {
    // JPA constructor
  }

  @EmbeddedId
  public NetworkStationTimeKey getNetworkStationTimeKey() {
    return networkStationTimeKey;
  }

  public void setNetworkStationTimeKey(NetworkStationTimeKey networkStationTimeKey) {
    this.networkStationTimeKey = networkStationTimeKey;
  }

  @Column(name = "endtime")
  @Convert(converter = PositiveNaInstantToDoubleConverter.class)
  public Instant getEndTime() {
    return endTime;
  }

  public void setEndTime(Instant endTime) {
    this.endTime = endTime;
  }

  @Column(name = "lddate")
  public Instant getLoadDate() {
    return loadDate;
  }

  public void setLoadDate(Instant ldDate) {
    this.loadDate = ldDate;
  }
}
