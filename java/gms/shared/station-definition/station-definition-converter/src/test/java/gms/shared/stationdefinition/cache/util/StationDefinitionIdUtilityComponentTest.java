package gms.shared.stationdefinition.cache.util;

import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.CHANNEL_RECORD_ID_WFID_CACHE;
import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.RECORD_ID_WFID_CHANNEL_CACHE;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Disabled("determine usefulness")
class StationDefinitionIdUtilityComponentTest {
  private static final Logger LOGGER =
      LoggerFactory.getLogger(StationDefinitionIdUtilityComponentTest.class);

  static SystemConfig systemConfig;

  @BeforeAll
  static void setIgniteHome() throws IOException {
    Path tempIgniteDirectory = Files.createTempDirectory("ignite-work");
    System.setProperty("IGNITE_HOME", tempIgniteDirectory.toString());

    try {
      IgniteConnectionManager.initialize(
          systemConfig, List.of(RECORD_ID_WFID_CHANNEL_CACHE, CHANNEL_RECORD_ID_WFID_CACHE));
    } catch (IllegalStateException e) {
      LOGGER.info("IgniteCache already initialized.");
    }
  }

  @Test
  void testIgniteCaches() {

    StationDefinitionIdUtility idUtility = new StationDefinitionIdUtility(systemConfig);

    long wfid = 3141;
    long recordId = 2718;
    TagName tagName = TagName.ARID;
    DerivedChannelIdComponents testIdComponents =
        DerivedChannelIdComponents.builder()
            .setWfid(wfid)
            .setAssociatedRecordInfo(tagName, recordId)
            .build();

    Channel expectedChannel =
        Channel.createVersionReference(CHANNEL.getName(), CHANNEL.getEffectiveAt().orElseThrow());

    Channel testChannel = CHANNEL;

    Channel nullChannel = idUtility.getDerivedChannelForWfidRecordId(tagName, recordId, wfid);
    assertNull(nullChannel);

    DerivedChannelIdComponents nullIdComponents =
        idUtility.getDerivedChannelIdForChannel(testChannel);
    assertNull(nullIdComponents);

    idUtility.storeDerivedChannelMapping(testIdComponents, testChannel);
    Channel channel = idUtility.getDerivedChannelForWfidRecordId(tagName, recordId, wfid);
    assertEquals(expectedChannel, channel);
    DerivedChannelIdComponents idComponents =
        idUtility.getDerivedChannelIdForChannel(expectedChannel);
    assertEquals(testIdComponents, idComponents);

    IgniteConnectionManager.close();
  }
}
