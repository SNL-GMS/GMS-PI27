package gms.shared.utilities.bridge.database.converter;

import gms.shared.utilities.bridge.database.enums.IdTag;
import jakarta.persistence.Converter;

@Converter
public class IdTagConverter extends EnumToStringConverter<IdTag> {
  public IdTagConverter() {
    super(IdTag.class, IdTag::getName);
  }
}
