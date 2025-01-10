package gms.shared.signaldetection.dao.css;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/** The ArrivalDynParsIntDao composite key */
@Embeddable
public class ArrivalDynParsIntKey implements Serializable {

  private long arid;
  private String groupName;
  private String paramName;

  public ArrivalDynParsIntKey() {
    // JPA Constructor
  }

  @Column(name = "arid")
  public long getArid() {
    return arid;
  }

  public void setArid(long arid) {
    this.arid = arid;
  }

  @Column(name = "group_name")
  public String getGroupName() {
    return groupName;
  }

  public void setGroupName(String groupName) {
    this.groupName = groupName;
  }

  @Column(name = "param_name")
  public String getParamName() {
    return paramName;
  }

  public void setParamName(String paramName) {
    this.paramName = paramName;
  }

  @Override
  public int hashCode() {
    var hash = 5;
    hash = 67 * hash + (int) (this.arid ^ (this.arid >>> 32));
    hash = 67 * hash + Objects.hashCode(this.groupName);
    hash = 67 * hash + Objects.hashCode(this.paramName);
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
    final ArrivalDynParsIntKey other = (ArrivalDynParsIntKey) obj;
    if (this.arid != other.arid) {
      return false;
    }
    if (!Objects.equals(this.groupName, other.groupName)) {
      return false;
    }
    return Objects.equals(this.paramName, other.paramName);
  }
}
