package gms.shared.utilities.bridge.database.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PositiveNaJulianDateConverterTest {

  private PositiveNaJulianDateConverter converter;

  @BeforeEach
  void setup() {
    converter = new PositiveNaJulianDateConverter();
  }

  @Test
  void testConvertToDatabaseColumnDefault() {
    assertEquals(2286324, converter.convertToDatabaseColumn(null));
  }

  @Test
  void testConvertToDatabaseColumnDefaultMin() {
    assertEquals(2286324, converter.convertToDatabaseColumn(Instant.MAX));
  }

  @Test
  void testConvertToDatabaseColumn() {
    assertEquals(
        1970001, converter.convertToDatabaseColumn(Instant.EPOCH.truncatedTo(ChronoUnit.DAYS)));
  }

  @Test
  void testConvertToEntityAttributeNull() {
    assertNull(converter.convertToEntityAttribute(null));
  }

  @Test
  void testConvertToEntityAttributeDefault() {
    assertEquals(Instant.MAX, converter.convertToEntityAttribute(2286324));
  }

  @Test
  void testConvertToEntityAttribute() {
    assertEquals(
        LocalDate.ofYearDay(2005, 65).atStartOfDay(ZoneOffset.UTC).toInstant(),
        converter.convertToEntityAttribute(2005065));
  }
}
