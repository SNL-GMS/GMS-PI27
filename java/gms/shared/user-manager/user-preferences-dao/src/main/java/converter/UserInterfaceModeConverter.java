package converter;

import gms.shared.user.preferences.coi.UserInterfaceMode;
import jakarta.persistence.Converter;

@Converter
public class UserInterfaceModeConverter extends EnumToStringConverter<UserInterfaceMode> {
  public UserInterfaceModeConverter() {
    super(UserInterfaceMode.class);
  }
}
