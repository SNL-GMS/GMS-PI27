package gms.shared.stationdefinition.coi.facets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.json.JsonMapper;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class FacetingDefinitionTest {

  private static final Logger LOGGER = LoggerFactory.getLogger(FacetingDefinitionTest.class);

  private static final JsonMapper mapper = ObjectMappers.jsonMapper();
  public static String STATION_GROUP_TYPE = "StationGroup";
  public static String STATION_TYPE = "Station";
  public static String STATIONS_KEY = "stations";
  public static String CHANNEL_GROUP_TYPE = "ChannelGroup";
  public static String CHANNEL_GROUPS_KEY = "channelGroups";
  public static String CHANNEL_TYPE = "Channel";
  public static String CHANNELS_KEY = "channels";

  @Test
  void testFacetingDefinitionContains() {

    final var childFacetingDefinition =
        getFacetingDefinition("childFacetingDefinition", true, new HashMap<>());
    final var facetingDefinition =
        getFacetingDefinition(
            "parentFacetingDefinition", true, Map.of("bob", childFacetingDefinition));

    assertFalse(facetingDefinition.containsFacetingDefinitionName(null));
    assertFalse(facetingDefinition.containsFacetingDefinitionName("NotAValidAttribute"));
    assertTrue(facetingDefinition.containsFacetingDefinitionName("bob"));
    assertEquals(
        facetingDefinition.getFacetingDefinitionByName("bob").get(), childFacetingDefinition);
  }

  @Test
  void testFacetingDefinitionGet() {

    final var childFacetingDefinition =
        getFacetingDefinition("childFacetingDefinition", true, new HashMap<>());
    final var facetingDefinition =
        getFacetingDefinition(
            "parentFacetingDefinition", true, Map.of("bob", childFacetingDefinition));

    assertEquals(Optional.empty(), facetingDefinition.getFacetingDefinitionByName(null));
    assertEquals(
        Optional.empty(), facetingDefinition.getFacetingDefinitionByName("NotAValidAttribute"));
    assertEquals(
        Optional.of(childFacetingDefinition),
        facetingDefinition.getFacetingDefinitionByName("bob"));
  }

  @Test
  void testFacetingDefinitionCreateNoAttributesSerializeToAndFrom() throws JsonProcessingException {
    final var facetingDefinition =
        getFacetingDefinition("testFacetingDefinition", true, new HashMap<>());

    final String json = mapper.writeValueAsString(facetingDefinition);
    LOGGER.info("json serialized faceting definition: {}", json);

    final var deserialized = mapper.readValue(json, FacetingDefinition.class);
    assertEquals(facetingDefinition, deserialized);
    assertEquals(facetingDefinition, deserialized);
  }

  @Test
  void testFacetingDefinitionCreateOneSubFacetingDefinitionSerializeToAndFrom()
      throws JsonProcessingException {

    final var childFacetingDefinition =
        getFacetingDefinition("childFacetingDefinition", true, new HashMap<>());
    final var facetingDefinition =
        getFacetingDefinition(
            "parentFacetingDefinition", true, Map.of("bob", childFacetingDefinition));

    final String json = mapper.writeValueAsString(facetingDefinition);
    LOGGER.info("json serialized faceting definition: {}", json);

    final var deserialized = mapper.readValue(json, FacetingDefinition.class);
    assertEquals(facetingDefinition, deserialized);
    assertEquals(
        facetingDefinition.getFacetingDefinitionByName("bob").get(), childFacetingDefinition);
  }

  @Test
  void testFacetingDefinitionCreateEmptyFacetingDefinitionMap() {
    final var facetingDefinition = getEmptyFacetingDefinition("parentFacetingDefinition", false);

    assertEquals(Optional.empty(), facetingDefinition.getFacetingDefinitionByName("bob"));
  }

  @Test
  void testChannelGroupUnpopulatedWithFacetingDefinition() {
    var facetingDef =
        FacetingDefinition.builder()
            .setClassType(CHANNEL_GROUP_TYPE)
            .setPopulated(false)
            .addFacetingDefinitions(
                CHANNELS_KEY,
                FacetingDefinition.builder().setClassType(CHANNEL_TYPE).setPopulated(true).build());
    assertThrows(IllegalStateException.class, () -> facetingDef.build());
  }

  @Test
  void testStationUnpopulatedWithFacetingDefinition() {
    var facetingDef =
        FacetingDefinition.builder()
            .setClassType(STATION_TYPE)
            .setPopulated(false)
            .addFacetingDefinitions(
                CHANNEL_GROUPS_KEY,
                FacetingDefinition.builder()
                    .setClassType(CHANNEL_GROUP_TYPE)
                    .setPopulated(true)
                    .build());
    assertThrows(IllegalStateException.class, () -> facetingDef.build());
  }

  @Test
  void testStationGroupUnpopulatedWithFacetingDefinition() {
    var facetingDef =
        FacetingDefinition.builder()
            .setClassType(STATION_GROUP_TYPE)
            .setPopulated(false)
            .addFacetingDefinitions(
                STATIONS_KEY,
                FacetingDefinition.builder().setClassType(STATION_TYPE).setPopulated(true).build());
    assertThrows(IllegalStateException.class, () -> facetingDef.build());
  }

  @Test
  void testFacetingDefinitionCreateWithNestedFacetingDefinitionsSerializeToAndFrom()
      throws JsonProcessingException {

    final var grandchildFacetingDefinition =
        getFacetingDefinition("grandchildFacetingDefinition", true, new HashMap<>());
    final var childFacetingDefinition =
        getFacetingDefinition(
            "childFacetingDefinition", true, Map.of("biff", grandchildFacetingDefinition));
    final var facetingDefinition =
        getFacetingDefinition(
            "parentFacetingDefinition", true, Map.of("bob", childFacetingDefinition));

    final var jsonStr = mapper.writeValueAsString(facetingDefinition);
    LOGGER.info("json serialized faceting definition: {}", jsonStr);

    final var deserialized = mapper.readValue(jsonStr, FacetingDefinition.class);
    assertEquals(facetingDefinition, deserialized);
  }

  protected FacetingDefinition getFacetingDefinition(
      String classType, boolean isPopulated, Map<String, FacetingDefinition> facetedDefinitionMap) {
    return FacetingDefinition.builder()
        .setClassType(classType)
        .setPopulated(isPopulated)
        .setFacetingDefinitions(facetedDefinitionMap)
        .build();
  }

  protected FacetingDefinition getEmptyFacetingDefinition(String classType, boolean isPopulated) {
    return FacetingDefinition.builder().setClassType(classType).setPopulated(isPopulated).build();
  }
}
