package gms.shared.utilities.javautilities.objectmapper;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.msgpack.jackson.dataformat.MessagePackMapper;

public final class ObjectMappers {

  private static final JsonMapper jsonMapper = buildJsonMapper();

  private static final MessagePackMapper messagePackMapper = buildMessagePackMapper();

  private ObjectMappers() {
    // Empty constructor due to Factory class
  }

  public static ObjectReader jsonReader() {
    return jsonMapper().reader();
  }

  public static ObjectWriter jsonWriter() {
    return jsonMapper().writer();
  }

  public static JsonMapper jsonMapper() {
    return jsonMapper;
  }

  public static ObjectReader messagePackReader() {
    return messagePackMapper().reader();
  }

  public static ObjectWriter messagePackWriter() {
    return messagePackMapper().writer();
  }

  public static MessagePackMapper messagePackMapper() {
    return messagePackMapper;
  }

  public static JsonMapper buildJsonMapper() {
    return JsonMapper.builder()
        .findAndAddModules()
        .serializationInclusion(JsonInclude.Include.NON_ABSENT)
        .enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
        .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS)
        .disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
        .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        .disable(SerializationFeature.WRITE_DURATIONS_AS_TIMESTAMPS)
        .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
        .build();
  }

  public static MessagePackMapper buildMessagePackMapper() {
    return MessagePackMapper.builder()
        .findAndAddModules()
        .serializationInclusion(JsonInclude.Include.NON_ABSENT)
        .enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
        .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS)
        .disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
        .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        .disable(SerializationFeature.WRITE_DURATIONS_AS_TIMESTAMPS)
        .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
        .build();
  }
}
