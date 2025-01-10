package gms.shared.waveform.qc.mask.dao.converter;

import gms.shared.stationdefinition.dao.css.enums.QcMaskType;
import jakarta.persistence.AttributeConverter;

public class QcMaskTypeConverter implements AttributeConverter<QcMaskType, Long> {

  @Override
  public Long convertToDatabaseColumn(QcMaskType attribute) {
    if (attribute == null) {
      return null;
    }

    return attribute.getId();
  }

  @Override
  public QcMaskType convertToEntityAttribute(Long dbData) {
    if (dbData == null) {
      return null;
    }

    return QcMaskType.fromId(dbData);
  }
}
