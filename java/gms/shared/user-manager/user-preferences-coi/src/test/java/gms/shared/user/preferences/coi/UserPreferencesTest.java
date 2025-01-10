package gms.shared.user.preferences.coi;

import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

import gms.shared.frameworks.osd.coi.systemmessages.SystemMessageType;
import gms.shared.utilities.test.JsonTestUtilities;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class UserPreferencesTest {

  @Test
  void testSerialization() throws IOException {
    final var audibleNotifications =
        List.of(
            AudibleNotification.from(
                "Hey.wav", SystemMessageType.STATION_CAPABILITY_STATUS_CHANGED),
            AudibleNotification.from("Listen.wav", SystemMessageType.STATION_NEEDS_ATTENTION));
    UserPreferences preferences = buildUserPreferences(audibleNotifications);

    JsonTestUtilities.assertSerializes(preferences, UserPreferences.class);
  }

  @Test
  void testSerializationEmptyNotificationList() throws IOException {
    final List<AudibleNotification> audibleNotifications = Collections.emptyList();
    UserPreferences preferences = buildUserPreferences(audibleNotifications);
    JsonTestUtilities.assertSerializes(preferences, UserPreferences.class);
  }

  @Test
  void testNullNotificationListValidation() {
    assertThatIllegalArgumentException()
        .isThrownBy(this::buildUserPreferencesWithDuplicateMessageType);
  }

  @Test
  void testDuplicateMessageTypeValidation() {
    assertThatIllegalArgumentException()
        .isThrownBy(this::buildUserPreferencesWithNullNotificationList);
  }

  private UserPreferences buildUserPreferencesWithDuplicateMessageType() {
    return buildUserPreferences(null);
  }

  private UserPreferences buildUserPreferencesWithNullNotificationList() {
    final var audibleNotifications =
        List.of(
            AudibleNotification.from("Hey.wav", SystemMessageType.STATION_NEEDS_ATTENTION),
            AudibleNotification.from("Listen.wav", SystemMessageType.STATION_NEEDS_ATTENTION));
    return buildUserPreferences(audibleNotifications);
  }

  private UserPreferences buildUserPreferences(List<AudibleNotification> audibleNotifications) {
    return UserPreferences.from(
        "Test Id",
        "Test Layout",
        List.of(
            WorkspaceLayout.from("Test Layout", List.of(UserInterfaceMode.ANALYST), "Test Layout")),
        audibleNotifications,
        Map.of("test", "value"));
  }
}
