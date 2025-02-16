package gms.shared.frameworks.osd.dao.stationreference;

import gms.shared.frameworks.osd.coi.stationreference.ReferenceDigitizerMembership;
import gms.shared.frameworks.osd.coi.stationreference.StatusType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "reference_digitizer_membership")
public class ReferenceDigitizerMembershipDao {

  @Id
  @Column(unique = true)
  private UUID id;

  @Column(name = "comment")
  private String comment;

  @Column(name = "actual_time")
  private Instant actualTime;

  @Column(name = "system_time")
  private Instant systemTime;

  @Column(name = "digitizer_id")
  private UUID digitizerId;

  @Column(name = "channel_id")
  private UUID channelId;

  @Column(name = "status")
  private StatusType status;

  /** Default constructor for JPA. */
  public ReferenceDigitizerMembershipDao() {}

  /**
   * Create a DAO from the given COI.
   *
   * @param membership The ReferenceDigitizerMembership object.
   */
  public ReferenceDigitizerMembershipDao(ReferenceDigitizerMembership membership) {
    Objects.requireNonNull(membership);

    this.id = membership.getId();
    this.comment = membership.getComment();
    this.actualTime = membership.getActualChangeTime();
    this.systemTime = membership.getSystemChangeTime();
    this.digitizerId = membership.getDigitizerId();
    this.channelId = membership.getChannelId();
    this.status = membership.getStatus();
  }

  /**
   * Create a COI from this DAO.
   *
   * @return A ReferenceDigitizerMembership object.
   */
  public ReferenceDigitizerMembership toCoi() {
    return ReferenceDigitizerMembership.from(
        getId(),
        getComment(),
        getActualTime(),
        getSystemTime(),
        getDigitizerId(),
        getChannelId(),
        status);
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getComment() {
    return comment;
  }

  public void setComment(String comment) {
    this.comment = comment;
  }

  public Instant getActualTime() {
    return actualTime;
  }

  public void setActualTime(Instant actualTime) {
    this.actualTime = actualTime;
  }

  public Instant getSystemTime() {
    return systemTime;
  }

  public void setSystemTime(Instant systemTime) {
    this.systemTime = systemTime;
  }

  public UUID getDigitizerId() {
    return digitizerId;
  }

  public void setDigitizerId(UUID digitizerId) {
    this.digitizerId = digitizerId;
  }

  public UUID getChannelId() {
    return channelId;
  }

  public void setChannelId(UUID channelId) {
    this.channelId = channelId;
  }

  public StatusType getStatus() {
    return status;
  }

  public void setStatus(StatusType status) {
    this.status = status;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }

    ReferenceDigitizerMembershipDao that = (ReferenceDigitizerMembershipDao) o;

    if (id != null ? !id.equals(that.id) : (that.id != null)) {
      return false;
    }
    if (comment != null ? !comment.equals(that.comment) : (that.comment != null)) {
      return false;
    }
    if (actualTime != null ? !actualTime.equals(that.actualTime) : (that.actualTime != null)) {
      return false;
    }
    if (systemTime != null ? !systemTime.equals(that.systemTime) : (that.systemTime != null)) {
      return false;
    }
    if (digitizerId != null ? !digitizerId.equals(that.digitizerId) : (that.digitizerId != null)) {
      return false;
    }
    if (channelId != null ? !channelId.equals(that.channelId) : (that.channelId != null)) {
      return false;
    }
    return status == that.status;
  }

  @Override
  public int hashCode() {
    int result = (id != null ? id.hashCode() : 0);
    result = 31 * result + (comment != null ? comment.hashCode() : 0);
    result = 31 * result + (actualTime != null ? actualTime.hashCode() : 0);
    result = 31 * result + (systemTime != null ? systemTime.hashCode() : 0);
    result = 31 * result + (digitizerId != null ? digitizerId.hashCode() : 0);
    result = 31 * result + (channelId != null ? channelId.hashCode() : 0);
    result = 31 * result + (status != null ? status.hashCode() : 0);
    return result;
  }

  @Override
  public String toString() {
    return "ReferenceDigitizerMembershipDao{"
        + ", id="
        + id
        + ", comment='"
        + comment
        + '\''
        + ", actualTime="
        + actualTime
        + ", systemTime="
        + systemTime
        + ", digitizerId="
        + digitizerId
        + ", channelId="
        + channelId
        + ", status="
        + status
        + '}';
  }
}
