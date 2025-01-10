package gms.shared.frameworks.osd.dao.channel;

import gms.shared.frameworks.osd.coi.channel.Orientation;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class OrientationDao implements Serializable {

  @Column(name = "horizontal_angle_deg", nullable = false)
  private Double horizontalAngleDeg;

  @Column(name = "vertical_angle_deg", nullable = false)
  private Double verticalAngleDeg;

  public OrientationDao() {}

  public OrientationDao(Orientation orientation) {
    this.horizontalAngleDeg = orientation.getHorizontalAngleDeg();
    this.verticalAngleDeg = orientation.getVerticalAngleDeg();
  }

  public Orientation toCoi() {
    return Orientation.from(this.horizontalAngleDeg, this.verticalAngleDeg);
  }

  public double getHorizontalAngleDeg() {
    return horizontalAngleDeg;
  }

  public void setHorizontalAngleDeg(double horizontalAngleDeg) {
    this.horizontalAngleDeg = horizontalAngleDeg;
  }

  public double getVerticalAngleDeg() {
    return verticalAngleDeg;
  }

  public void setVerticalAngleDeg(double verticalAngleDeg) {
    this.verticalAngleDeg = verticalAngleDeg;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null) {
      return false;
    }
    if (this.getClass() != o.getClass()) {
      return false;
    }
    OrientationDao that = (OrientationDao) o;
    return Double.compare(that.horizontalAngleDeg, horizontalAngleDeg) == 0
        && Double.compare(that.verticalAngleDeg, verticalAngleDeg) == 0;
  }

  @Override
  public int hashCode() {
    return Objects.hash(horizontalAngleDeg, verticalAngleDeg);
  }

  @Override
  public String toString() {
    return "OrientationDao{"
        + "horizontalAngleDeg="
        + horizontalAngleDeg
        + ", verticalAngleDeg="
        + verticalAngleDeg
        + '}';
  }
}
