package gms.shared.utilities.bridge.database.converter;

import jakarta.persistence.AttributeConverter;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoField;

public abstract class JulianDateConverter implements AttributeConverter<Instant, Integer> {

  private static final Instant MAX_DATE = Instant.parse("+1000000000-12-31T23:59:59.999999999Z");
  private static final int THOUSANDS_PLACE = 1000;

  /**
   * The maximum value of a Julian date in the database, according to the customer's definition of
   * 'end of time'
   */
  private static final int MAX_JDATE = 2286324;

  @Override
  public Integer convertToDatabaseColumn(Instant attribute) {
    if (attribute == null || getDefaultValue().equals(attribute)) {
      return getNaValue();
    } else if (attribute.equals(MAX_DATE)) {
      return MAX_JDATE;
    } else {
      var dateValue = LocalDate.ofInstant(attribute, ZoneOffset.UTC);
      return (dateValue.get(ChronoField.YEAR) * THOUSANDS_PLACE)
          + dateValue.get(ChronoField.DAY_OF_YEAR);
    }
  }

  @Override
  public Instant convertToEntityAttribute(Integer dbData) {
    if (dbData == null) {
      return null;
    } else if (dbData == getNaValue()) {
      return getDefaultValue();
    } else {
      int days = dbData % THOUSANDS_PLACE;
      int years = (dbData - days) / THOUSANDS_PLACE;

      return Instant.from(
          LocalDate.ofYearDay(years, days).atStartOfDay().toInstant(ZoneOffset.UTC));
    }
  }

  protected abstract Instant getDefaultValue();

  protected abstract int getNaValue();
}
