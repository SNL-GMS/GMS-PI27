package gms.shared.stationdefinition.coi.qc;

import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.testfixture.ProcessingMaskTestFixtures;
import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ProcessingMaskDefinitionTest {

  @Test
  void testSerialization() {

    var processingMaskDefinition =
        new ProcessingMaskDefinition(
            Duration.ofMinutes(8),
            ProcessingOperation.ROTATION,
            Set.of(
                QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.NOISY),
                QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED)),
            ProcessingMaskTestFixtures.TAPER_DEFINITION);

    JsonTestUtilities.assertSerializes(processingMaskDefinition, ProcessingMaskDefinition.class);
  }
}
