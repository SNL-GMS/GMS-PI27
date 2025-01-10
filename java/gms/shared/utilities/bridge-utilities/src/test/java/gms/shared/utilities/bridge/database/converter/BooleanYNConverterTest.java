package gms.shared.utilities.bridge.database.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BooleanYNConverterTest {

  private BooleanYNConverter converter;

  @BeforeEach
  void setup() {
    converter = new BooleanYNConverter();
  }

  @Test
  void testConvertToDatabaseColumn() {
    assertNull(converter.convertToDatabaseColumn(null));
  }

  @Test
  void testConvertToDatabaseColumnVal() {
    assertEquals("y", converter.convertToDatabaseColumn(Boolean.TRUE));
  }

  @Test
  void testConvertToDatabaseColumnVal2() {
    assertEquals("n", converter.convertToDatabaseColumn(Boolean.FALSE));
  }

  @Test
  void testConvertToEntityAttributeNull() {
    assertNull(converter.convertToEntityAttribute(null));
  }

  @Test
  void testConvertToEntityAttributeDefault() {
    assertTrue(converter.convertToEntityAttribute("y"));
  }

  @Test
  void testConvertToEntityAttribute() {
    assertFalse(converter.convertToEntityAttribute("n"));
  }

  @Test
  void testConvertToEntityAttributeException() {
    assertThrows(IllegalArgumentException.class, () -> converter.convertToEntityAttribute("yn"));
  }
}
