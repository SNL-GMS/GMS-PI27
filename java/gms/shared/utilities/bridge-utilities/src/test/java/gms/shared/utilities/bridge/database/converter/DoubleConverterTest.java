package gms.shared.utilities.bridge.database.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DoubleConverterTest {

  private DoubleConverter converter;

  @BeforeEach
  void setup() {
    converter = new DoubleConverter();
  }

  @Test
  void testConvertToDatabaseColumn() {
    assertNull(converter.convertToDatabaseColumn(null));
  }

  @Test
  void testConvertToDatabaseColumnVal() {
    assertEquals(-1.0, converter.convertToDatabaseColumn(-1.0));
  }

  @Test
  void testConvertToEntityAttributeDefault() {
    assertEquals(-1.0, converter.convertToEntityAttribute(null));
  }

  @Test
  void testConvertToEntityAttribute() {
    assertEquals(5.0, converter.convertToEntityAttribute(5.0));
  }
}
