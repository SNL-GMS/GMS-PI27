package gms.shared.waveform.bridge.repository.utils;

import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.cache.utils.IgniteTestUtility;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

@Tag("component")
class BridgedProcessingMaskCacheTest {

  private static BridgedProcessingMaskCache bridgedProcessingMaskCache;
  private static final UUID ID = UUID.fromString("10000000-100-0000-1000-100000000001");
  private static final UUID BAD_ID = UUID.fromString("90000000-900-0000-9000-900000000009");

  @TempDir static Path tempIgnitePath;

  @BeforeAll
  static void setup() {
    IgniteTestUtility.initializeLocally(
        tempIgnitePath, BridgedProcessingMaskCache.BRIDGED_PROCESSING_MASK_CACHE);
    bridgedProcessingMaskCache = new BridgedProcessingMaskCache();
  }

  @AfterAll
  static void cleanup() {
    IgniteConnectionManager.close();
  }

  @Test
  void testNullCollectionOfMasks() {
    Assertions.assertThrows(
        NullPointerException.class, () -> bridgedProcessingMaskCache.cache(null));
  }

  @Test
  void testNullFindById() {
    Assertions.assertThrows(
        NullPointerException.class, () -> bridgedProcessingMaskCache.findById(null));
  }

  @Test
  void testCache() {
    var masks = new ArrayList<ProcessingMask>();
    var mask = ProcessingMask.createEntityReference(ID);
    masks.add(mask);

    bridgedProcessingMaskCache.cache(masks);

    Assertions.assertEquals(Optional.of(mask), bridgedProcessingMaskCache.findById(ID));
    Assertions.assertEquals(Optional.empty(), bridgedProcessingMaskCache.findById(BAD_ID));
  }
}
