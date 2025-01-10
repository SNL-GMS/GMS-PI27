package gms.shared.signaldetection.dao.css;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/** The AmplitudeDynParsIntDao composite key */
@Embeddable
public class AmplitudeDynParsIntKey implements Serializable {

  private long ampid;
  private String groupName;
  private String paramName;

  public AmplitudeDynParsIntKey() {
    // JPA Constructor
  }

  @Column(name = "ampid")
  public long getAmpid() {
    return ampid;
  }

  public void setAmpid(long ampid) {
    this.ampid = ampid;
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
    var hash = 3;
    hash = 53 * hash + (int) (this.ampid ^ (this.ampid >>> 32));
    hash = 53 * hash + Objects.hashCode(this.groupName);
    hash = 53 * hash + Objects.hashCode(this.paramName);
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
    final AmplitudeDynParsIntKey other = (AmplitudeDynParsIntKey) obj;
    if (this.ampid != other.ampid) {
      return false;
    }
    if (!Objects.equals(this.groupName, other.groupName)) {
      return false;
    }
    return Objects.equals(this.paramName, other.paramName);
  }
}
