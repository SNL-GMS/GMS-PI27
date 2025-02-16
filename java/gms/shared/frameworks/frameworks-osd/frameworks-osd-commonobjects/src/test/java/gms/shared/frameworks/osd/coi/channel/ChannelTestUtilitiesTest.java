package gms.shared.frameworks.osd.coi.channel;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.frameworks.osd.coi.test.utils.UtilsTestFixtures;
import org.junit.jupiter.api.Test;

class ChannelTestUtilitiesTest {

  private static Channel rawWithName(String name) {
    return UtilsTestFixtures.raw.toBuilder().setName(name).build();
  }

  @Test
  void testExtractHash() {
    final Channel nameWithHash = rawWithName(Channel.COMPONENT_SEPARATOR + "hash");
    final Channel nameWithoutHash = rawWithName("name-without-hash");
    final Channel nameWithEmptyHash = rawWithName(Channel.COMPONENT_SEPARATOR);

    assertAll(
        () -> assertEquals("hash", ChannelTestUtilities.extractHash(nameWithHash)),
        () ->
            assertThrows(
                IllegalArgumentException.class,
                () -> ChannelTestUtilities.extractHash(nameWithoutHash)),
        () ->
            assertThrows(
                IllegalArgumentException.class,
                () -> ChannelTestUtilities.extractHash(nameWithEmptyHash)));
  }

  @Test
  void testExtractAttributes() {
    final String attributes =
        Channel.COMPONENT_SEPARATOR + "attributes" + Channel.COMPONENT_SEPARATOR;

    final Channel nameWithAttributes = rawWithName("name" + attributes);
    final Channel nameWithoutAttributes =
        rawWithName("name-without-attributes" + Channel.COMPONENT_SEPARATOR);
    final Channel nameWithEmptyAttributes =
        rawWithName(Channel.COMPONENT_SEPARATOR + Channel.COMPONENT_SEPARATOR);

    assertAll(
        () -> assertEquals(attributes, ChannelTestUtilities.extractAttributes(nameWithAttributes)),
        () ->
            assertThrows(
                IllegalArgumentException.class,
                () -> ChannelTestUtilities.extractAttributes(nameWithoutAttributes)),
        () ->
            assertThrows(
                IllegalArgumentException.class,
                () -> ChannelTestUtilities.extractAttributes(nameWithEmptyAttributes)));
  }
}
