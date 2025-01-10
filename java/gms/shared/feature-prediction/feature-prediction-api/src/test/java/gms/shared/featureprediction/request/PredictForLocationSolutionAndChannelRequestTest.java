package gms.shared.featureprediction.request;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PredictForLocationSolutionAndChannelRequestTest {

  @Test
  void testObjectSerialization() {

    PredictForLocationSolutionAndChannelRequest request =
        PredictForLocationSolutionAndChannelRequest.from(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            LocationSolution.builder()
                .setId(UUID.fromString("10000000-100-0000-1000-100000000034"))
                .setData(EventTestFixtures.LOCATION_SOLUTION_DATA_NO_MCS)
                .build(),
            List.of(Channel.builder().setName("TestChannel").build()),
            List.of(PhaseType.P),
            "Iaspei",
            List.of());

    JsonTestUtilities.assertSerializes(request, PredictForLocationSolutionAndChannelRequest.class);
  }
}
