package gms.shared.waveform.bridge.repository.utils;

import static org.assertj.core.api.Assertions.assertThatNoException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CannedQcUtilityTest {

  @Test
  void testReadCannedQcData() {
    assertThatNoException().isThrownBy(() -> CannedQcUtility.readCannedQcData());
  }

  @ParameterizedTest
  @ValueSource(strings = {"MULTIPLE", "EVENT_BEAM"})
  void testReadCannedPMData(String cannedType) {
    assertThatNoException().isThrownBy(() -> CannedQcUtility.readCannedPMData(cannedType));
  }
}
