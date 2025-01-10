package gms.shared.utilities.bridge.database.converter;

import gms.shared.utilities.bridge.database.enums.ClipFlag;
import jakarta.persistence.Converter;

@Converter
public class ClipFlagConverter extends EnumToStringConverter<ClipFlag> {
  public ClipFlagConverter() {
    super(ClipFlag.class, ClipFlag::getName);
  }
}
