package gms.shared.featureprediction.request;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class PredictForLocationRequestTest {

  @Test
  void testObjectSerialization() {

    PredictForLocationRequest request =
        PredictForLocationRequest.from(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH),
            List.of(Location.from(100.0, 150.0, 30, 20)),
            List.of(PhaseType.P),
            "Iaspei",
            List.of());

    JsonTestUtilities.assertSerializes(request, PredictForLocationRequest.class);
  }
}
