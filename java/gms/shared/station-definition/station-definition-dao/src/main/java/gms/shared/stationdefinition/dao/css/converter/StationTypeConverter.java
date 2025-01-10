package gms.shared.stationdefinition.dao.css.converter;

import gms.shared.stationdefinition.dao.css.enums.StaType;
import gms.shared.utilities.bridge.database.converter.EnumToStringConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter
public class StationTypeConverter extends EnumToStringConverter<StaType> {

  private static final Logger LOGGER = LoggerFactory.getLogger(StationTypeConverter.class);

  public StationTypeConverter() {
    super(StaType.class, StaType::getName);
  }

  public static void main(String[] args) {
    for (StaType type : StaType.values()) {
      if (LOGGER.isInfoEnabled()) {
        LOGGER.info(type.toString());
      }
    }
  }
}
