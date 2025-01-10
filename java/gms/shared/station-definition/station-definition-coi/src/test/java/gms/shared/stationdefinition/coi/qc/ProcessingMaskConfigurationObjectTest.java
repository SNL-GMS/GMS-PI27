package gms.shared.stationdefinition.coi.qc;

import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.testfixture.ProcessingMaskTestFixtures;
import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ProcessingMaskConfigurationObjectTest {

  @Test
  void testSerialization() {
    var processingMaskConfigurationObject =
        new ProcessingMaskConfigurationObject(
            Duration.ofMinutes(8),
            Set.of(
                QcSegmentCategoryAndType.create(QcSegmentCategory.WAVEFORM, QcSegmentType.NOISY),
                QcSegmentCategoryAndType.create(QcSegmentCategory.ANALYST_DEFINED)),
            Optional.of(ProcessingMaskTestFixtures.TAPER_DEFINITION));

    JsonTestUtilities.assertSerializes(
        processingMaskConfigurationObject, ProcessingMaskConfigurationObject.class);
  }
}
