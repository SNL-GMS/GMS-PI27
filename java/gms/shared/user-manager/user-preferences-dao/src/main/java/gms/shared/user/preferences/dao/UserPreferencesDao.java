package gms.shared.user.preferences.dao;

import com.fasterxml.jackson.databind.JsonNode;
import gms.shared.user.preferences.coi.AudibleNotification;
import gms.shared.user.preferences.coi.UserPreferences;
import gms.shared.user.preferences.coi.WorkspaceLayout;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.hibernate.annotations.Type;

@Entity
@Table(name = "user_profile")
public class UserPreferencesDao {

  @Id
  @Column(name = "id")
  private String userId;

  @Column(name = "default_analyst_layout_name")
  private String defaultAnalystLayoutName;

  @OneToMany(mappedBy = "userPreferences", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<WorkspaceLayoutDao> workspaceLayouts;

  @OneToMany(mappedBy = "userPreferences", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<AudibleNotificationDao> audibleNotifications;

  @Type(JsonType.class)
  @Column(name = "preferences", columnDefinition = "jsonb")
  private JsonNode preferences;

  protected UserPreferencesDao() {
    // no arg JPA constructor
  }

  public UserPreferencesDao(UserPreferences userPreferences) {
    this.userId = userPreferences.getUserId();
    this.defaultAnalystLayoutName = userPreferences.getDefaultAnalystLayoutName();
    this.workspaceLayouts =
        userPreferences.getWorkspaceLayouts().stream()
            .map(WorkspaceLayoutDao::new)
            .map(
                (WorkspaceLayoutDao wlDao) -> {
                  wlDao.setUserPreferences(UserPreferencesDao.this);
                  return wlDao;
                })
            .toList();
    this.audibleNotifications =
        userPreferences.getAudibleNotifications().stream()
            .map(AudibleNotificationDao::new)
            .map(
                (AudibleNotificationDao anDao) -> {
                  anDao.setUserPreferences(UserPreferencesDao.this);
                  return anDao;
                })
            .toList();
    this.preferences = ObjectMappers.jsonMapper().valueToTree(userPreferences.getPreferences());
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public String getDefaultAnalystLayoutName() {
    return defaultAnalystLayoutName;
  }

  public void setDefaultAnalystLayoutName(String defaultAnalystLayoutName) {
    this.defaultAnalystLayoutName = defaultAnalystLayoutName;
  }

  public List<WorkspaceLayoutDao> getWorkspaceLayouts() {
    return workspaceLayouts;
  }

  public void setWorkspaceLayouts(List<WorkspaceLayoutDao> workspaceLayouts) {
    this.workspaceLayouts = workspaceLayouts;
  }

  public List<AudibleNotificationDao> getAudibleNotifications() {
    return audibleNotifications;
  }

  public void setAudibleNotifications(List<AudibleNotificationDao> audibleNotifications) {
    this.audibleNotifications = audibleNotifications;
  }

  public JsonNode getPreferences() {
    return preferences;
  }

  public void setPreferences(JsonNode preferences) {
    this.preferences = preferences;
  }

  public UserPreferences toCoi() {
    final List<WorkspaceLayout> workspaceLayoutCois =
        workspaceLayouts.stream().map(WorkspaceLayoutDao::toCoi).toList();
    final List<AudibleNotification> audibleNotificationCois =
        audibleNotifications.stream().map(AudibleNotificationDao::toCoi).toList();

    var mapper = ObjectMappers.jsonMapper();
    var mapType =
        mapper.getTypeFactory().constructMapType(HashMap.class, String.class, Object.class);
    Map<String, Object> coiPreferences = mapper.convertValue(preferences, mapType);
    return UserPreferences.from(
        userId,
        defaultAnalystLayoutName,
        workspaceLayoutCois,
        audibleNotificationCois,
        coiPreferences);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    UserPreferencesDao that = (UserPreferencesDao) o;
    return userId.equals(that.userId)
        && defaultAnalystLayoutName.equals(that.defaultAnalystLayoutName)
        && workspaceLayouts.equals(that.workspaceLayouts)
        && Objects.equals(preferences, that.preferences);
  }

  @Override
  public int hashCode() {
    return Objects.hash(userId, defaultAnalystLayoutName, workspaceLayouts, preferences);
  }
}
