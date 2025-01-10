package gms.shared.signalenhancement.api;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.signalenhancement.testfixtures.RotationTemplateTestFixtures;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Collections;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class RotationTemplateRequestTest {

  private static final List<PhaseType> phasesList = List.of(PhaseType.I);
  private static final List<Station> stationList = List.of(RotationTemplateTestFixtures.STATION);

  @Test
  void testSerialization() {

    var request = new RotationTemplateRequest(stationList, phasesList);

    JsonTestUtilities.assertSerializes(request, RotationTemplateRequest.class);
  }

  @ParameterizedTest
  @MethodSource("getRotationTemplateRequestArguments")
  void testInvalidEntries(
      List<Station> stations,
      List<PhaseType> phases,
      Class<? extends Throwable> expectedException) {

    if (expectedException != null) {
      assertThrows(expectedException, () -> new RotationTemplateRequest(stations, phases));
    } else {
      assertDoesNotThrow(() -> new RotationTemplateRequest(stations, phases));
    }
  }

  static Stream<Arguments> getRotationTemplateRequestArguments() {

    return Stream.of(
        arguments(stationList, phasesList, null),
        arguments(Collections.emptyList(), phasesList, IllegalArgumentException.class),
        arguments(stationList, Collections.emptyList(), IllegalArgumentException.class),
        arguments(null, phasesList, NullPointerException.class),
        arguments(stationList, null, NullPointerException.class));
  }
}
