package gms.shared.event.api;

import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PredictFeaturesForLocationSolutionRequestTest {

  @Test
  void testSerialization() {

    var eventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            UUID.fromString("10000000-100-0000-1000-100000000011"),
            EventTestFixtures.HYPOTHESIS_UUID,
            EventTestFixtures.LOCATION_UUID,
            3.3,
            Instant.EPOCH,
            MagnitudeType.MB,
            DoubleValue.from(3.3, Optional.empty(), Units.COUNT),
            List.of());
    assertTrue(eventHypothesis.getData().isPresent());
    assertTrue(eventHypothesis.getData().get().getLocationSolutions().size() > 0);
    var locationSolution = eventHypothesis.getData().get().getLocationSolutions().iterator().next();
    var request =
        PredictFeaturesForLocationSolutionRequest.from(
            locationSolution, List.of(UtilsTestFixtures.CHANNEL), List.of(PhaseType.P));
    JsonTestUtilities.assertSerializes(request, PredictFeaturesForLocationSolutionRequest.class);
  }
}
