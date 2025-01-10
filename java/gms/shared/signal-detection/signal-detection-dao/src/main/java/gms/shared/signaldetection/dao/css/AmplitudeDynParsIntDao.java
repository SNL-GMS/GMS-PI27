package gms.shared.signaldetection.dao.css;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

/** The AmplitudeDynParsInt table DAO object */
@Entity
@Table(name = "amplitude_dyn_pars_int")
public class AmplitudeDynParsIntDao {

  private AmplitudeDynParsIntKey amplitudeDynParsIntKey;
  private long iValue;
  private Instant ldDate;

  public AmplitudeDynParsIntDao() {
    // JPA constructor
  }

  @EmbeddedId
  public AmplitudeDynParsIntKey getAmplitudeDynParsIntKey() {
    return amplitudeDynParsIntKey;
  }

  public void setAmplitudeDynParsIntKey(AmplitudeDynParsIntKey amplitudeDynParsIntKey) {
    this.amplitudeDynParsIntKey = amplitudeDynParsIntKey;
  }

  @Column(name = "i_value")
  public long getIvalue() {
    return iValue;
  }

  public void setIvalue(long iValue) {
    this.iValue = iValue;
  }

  @Column(name = "lddate")
  public Instant getLdDate() {
    return ldDate;
  }

  public void setLdDate(Instant ldDate) {
    this.ldDate = ldDate;
  }
}
