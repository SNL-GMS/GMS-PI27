package gms.shared.user.preferences.dao;

import gms.shared.frameworks.osd.coi.systemmessages.SystemMessageType;
import gms.shared.user.preferences.coi.AudibleNotification;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "audible_notification")
public class AudibleNotificationDao {

  @Id
  @Column(name = "id", nullable = false)
  private UUID id;

  @Enumerated
  @Column(name = "notification_type", nullable = false)
  private SystemMessageType notificationType;

  @Column(name = "file_name", nullable = false)
  private String fileName;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_profile_id", referencedColumnName = "id")
  private UserPreferencesDao userPreferences;

  public AudibleNotificationDao() {}

  public AudibleNotificationDao(AudibleNotification audibleNotification) {
    this.id = UUID.randomUUID();
    this.fileName = audibleNotification.getFileName();
    this.notificationType = audibleNotification.getNotificationType();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public SystemMessageType getNotificationType() {
    return notificationType;
  }

  public void setNotificationType(SystemMessageType notificationType) {
    this.notificationType = notificationType;
  }

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public UserPreferencesDao getUserPreferences() {
    return userPreferences;
  }

  public void setUserPreferences(UserPreferencesDao userPreferences) {
    this.userPreferences = userPreferences;
  }

  public static AudibleNotification toCoi(AudibleNotificationDao audibleNotificationDao) {
    return AudibleNotification.from(
        audibleNotificationDao.getFileName(), audibleNotificationDao.getNotificationType());
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    if (this == o) {
      return true;
    }
    AudibleNotificationDao that = (AudibleNotificationDao) o;
    return id == that.id
        && Objects.equals(fileName, that.fileName)
        && Objects.equals(notificationType, that.notificationType);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, fileName, notificationType);
  }
}
