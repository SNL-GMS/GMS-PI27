package gms.shared.utilities.test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.json.JsonMapper;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;

/** Helpful methods for testing. */
public final class JsonTestUtilities {

  private static final JsonMapper jsonMapper = ObjectMappers.jsonMapper();

  private static final String NULL_OBJECT_STRING =
      "Cannot test serialization with null object instance";

  private static final String NULL_TYPE_STRING = "Cannot test serialization with null type";

  private static final String NULL_EMPTY_STRING = "serialized string should not be null or empty";

  private static final String DESERIALIZED_EQUAL_STRING =
      "deserialized object should equal original object";

  private JsonTestUtilities() {
    // prevent instantiation
  }

  /**
   * Tests whether an object can be serialized and deserialized with the GMS JsonMapper.
   *
   * @param <T> the type of the object
   * @param object an instance of the object
   * @param type the type of the object
   */
  public static <T> void assertSerializes(T object, Class<T> type) {
    assertNotNull(object, NULL_OBJECT_STRING);
    assertNotNull(type, NULL_TYPE_STRING);

    var serialized = assertDoesNotThrow(() -> jsonMapper.writeValueAsString(object));
    assertThat(serialized).as(NULL_EMPTY_STRING).isNotNull().isNotEmpty();
    var deserialized = assertDoesNotThrow(() -> jsonMapper.readValue(serialized, type));
    assertThat(deserialized).as(DESERIALIZED_EQUAL_STRING).isEqualTo(object);
  }

  /**
   * Tests whether an object can be serialized and deserialized with the GMS JsonMapper.
   *
   * @param object an instance of the object
   * @param type the type of the object
   * @param <T> the type of the object
   */
  public static <T> void assertSerializes(T object, JavaType type) {
    assertNotNull(object, NULL_OBJECT_STRING);
    assertNotNull(type, NULL_TYPE_STRING);

    var serialized = assertDoesNotThrow(() -> jsonMapper.writeValueAsString(object));
    assertThat(serialized).as(NULL_EMPTY_STRING).isNotNull().isNotEmpty();

    var deserialized = assertDoesNotThrow(() -> jsonMapper.readValue(serialized, type));
    assertThat(deserialized).as(DESERIALIZED_EQUAL_STRING).isEqualTo(object);
  }

  /**
   * Tests whether an object can be serialized and deserialized with the GMS JsonMapper.
   *
   * @param object an instance of the object
   * @param typeReference the type reference of the object
   * @param <T> the type of the object
   */
  public static <T> void assertSerializes(T object, TypeReference<T> typeReference) {
    assertNotNull(object, NULL_OBJECT_STRING);
    assertNotNull(typeReference, NULL_TYPE_STRING);

    var serialized = assertDoesNotThrow(() -> jsonMapper.writeValueAsString(object));
    assertThat(serialized).as(NULL_EMPTY_STRING).isNotNull().isNotEmpty();

    var deserialized = assertDoesNotThrow(() -> jsonMapper.readValue(serialized, typeReference));
    assertThat(deserialized).as(DESERIALIZED_EQUAL_STRING).isEqualTo(object);
  }
}
