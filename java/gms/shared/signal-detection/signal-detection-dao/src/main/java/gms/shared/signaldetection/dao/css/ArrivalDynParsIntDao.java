package gms.shared.signaldetection.dao.css;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

/** The ArrivalDynParsInt table DAO object */
@Entity
@Table(name = "arrival_dyn_pars_int")
public class ArrivalDynParsIntDao {

  private ArrivalDynParsIntKey arrivalDynParsIntKey;
  private long iValue;
  private Instant ldDate;

  public ArrivalDynParsIntDao() {
    // JPA constructor
  }

  @EmbeddedId
  public ArrivalDynParsIntKey getArrivalDynParsIntKey() {
    return arrivalDynParsIntKey;
  }

  public void setArrivalDynParsIntKey(ArrivalDynParsIntKey arrivalDynParsIntKey) {
    this.arrivalDynParsIntKey = arrivalDynParsIntKey;
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
