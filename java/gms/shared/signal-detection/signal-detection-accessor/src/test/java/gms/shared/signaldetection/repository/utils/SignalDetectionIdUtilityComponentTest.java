package gms.shared.signaldetection.repository.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.frameworks.cache.utils.CacheInfo;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.cache.CacheMode;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

@Disabled("determine usefulness versus unit tests with mocks")
class SignalDetectionIdUtilityComponentTest {

  SystemConfig systemConfig;

  @BeforeAll
  static void setIgniteHome() throws IOException {
    Path tempIgniteDirectory = Files.createTempDirectory("ignite-work");
    System.setProperty("IGNITE_HOME", tempIgniteDirectory.toString());
  }

  public static final CacheInfo ARID_SIGNAL_DETECTION_ID_CACHE =
      new CacheInfo(
          "arid-signal-detection-id-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);
  public static final CacheInfo SIGNAL_DETECTION_ID_ARID_CACHE =
      new CacheInfo(
          "signal-detection-id-arid-cache", CacheMode.PARTITIONED, CacheAtomicityMode.ATOMIC);

  public static final CacheInfo ARRIVAL_ID_SIGNAL_DETECTION_HYPOTHESIS_ID =
      new CacheInfo(
          "arrival-id-signal-detection-hypothesis-id",
          CacheMode.PARTITIONED,
          CacheAtomicityMode.ATOMIC);
  public static final CacheInfo SIGNAL_DETECTION_HYPOTHESIS_ID_ARRIVAL_ID =
      new CacheInfo(
          "signal-detection-hypothesis-id-arrival-id-cache",
          CacheMode.PARTITIONED,
          CacheAtomicityMode.ATOMIC);

  @Test
  void testExerciseCaches() {
    IgniteConnectionManager.initialize(
        systemConfig,
        List.of(
            ARID_SIGNAL_DETECTION_ID_CACHE,
            SIGNAL_DETECTION_ID_ARID_CACHE,
            ARRIVAL_ID_SIGNAL_DETECTION_HYPOTHESIS_ID,
            SIGNAL_DETECTION_HYPOTHESIS_ID_ARRIVAL_ID));
    SignalDetectionIdUtility signalDetectionIdUtility = new SignalDetectionIdUtility();

    final String stage = "stage";
    WorkflowDefinitionId stageId = WorkflowDefinitionId.from(stage);
    final long arid1 = 1L;
    final long arid2 = 2L;
    final UUID uuid1 = UUID.fromString("10000000-100-0000-1000-100000000041");
    final UUID uuid2 = UUID.fromString("10000000-100-0000-1000-100000000042");
    final AccountValue id = AccountValue.create(stageId.getName(), arid2);

    signalDetectionIdUtility.addAridForSignalDetectionUUID(arid1, uuid1);
    signalDetectionIdUtility.addAridAndStageIdForSignalDetectionHypothesisUUID(
        arid2, stageId.getName(), uuid2);

    assertEquals(uuid1, signalDetectionIdUtility.getSignalDetectionForArid(arid1));
    assertEquals(uuid1, signalDetectionIdUtility.getOrCreateSignalDetectionIdfromArid(arid1));

    assertEquals(arid1, signalDetectionIdUtility.getAridForSignalDetectionUUID(uuid1));

    assertEquals(id, signalDetectionIdUtility.getAccountArrivalIdFromSdhId(uuid2));

    assertEquals(
        uuid2,
        signalDetectionIdUtility.getSignalDetectionHypothesisIdForAridAndStageId(
            arid2, stageId.getName()));
    assertEquals(
        uuid2,
        signalDetectionIdUtility.getOrCreateSignalDetectionHypothesisIdFromAridAndStageId(
            arid2, stageId.getName()));
  }
}
