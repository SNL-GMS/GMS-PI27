package gms.shared.user.preferences.coi;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import java.util.List;
import java.util.Map;
import org.apache.commons.lang3.Validate;

@AutoValue
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class UserPreferences {

  public abstract String getUserId();

  public abstract String getDefaultAnalystLayoutName();

  public abstract List<WorkspaceLayout> getWorkspaceLayouts();

  public abstract List<AudibleNotification> getAudibleNotifications();

  public abstract Map<String, Object> getPreferences();

  @JsonCreator
  public static UserPreferences from(
      @JsonProperty("userId") String userId,
      @JsonProperty("defaultAnalystLayoutName") String defaultAnalystLayoutName,
      @JsonProperty("workspaceLayouts") List<WorkspaceLayout> workspaceLayouts,
      @JsonProperty("audibleNotifications") List<AudibleNotification> audibleNotifications,
      @JsonProperty("preferences") Map<String, Object> preferences) {
    Validate.isTrue(
        workspaceLayouts != null && !workspaceLayouts.isEmpty(),
        "User Preferences must contain at least 1 WorkspaceLayout");
    Validate.isTrue(
        audibleNotifications != null,
        "User Preferences may not have an empty AudibleNotifications List");
    Validate.isTrue(
        audibleNotifications.size()
            == audibleNotifications.stream()
                .map(AudibleNotification::getNotificationType)
                .distinct()
                .count(),
        "User Preferences may not have duplicate Message type entries in the AudibleNotifications"
            + " List");
    return new AutoValue_UserPreferences(
        userId, defaultAnalystLayoutName, workspaceLayouts, audibleNotifications, preferences);
  }
}
