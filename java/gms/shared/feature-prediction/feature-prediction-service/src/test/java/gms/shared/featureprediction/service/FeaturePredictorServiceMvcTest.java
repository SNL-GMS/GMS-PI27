package gms.shared.featureprediction.service;

import static gms.shared.event.coi.EventTestFixtures.LOCATION_SOLUTION_DATA_NO_MCS;
import static org.mockito.BDDMockito.given;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.featureprediction.FeaturePrediction;
import gms.shared.event.coi.featureprediction.FeaturePredictionContainer;
import gms.shared.event.coi.featureprediction.type.FeaturePredictionType;
import gms.shared.featureprediction.framework.FeaturePredictor;
import gms.shared.featureprediction.request.PredictForLocationRequest;
import gms.shared.featureprediction.request.PredictForLocationSolutionAndChannelRequest;
import gms.shared.spring.utilities.framework.SpringTestBase;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.Location;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletResponse;

@WebMvcTest(FeaturePredictorService.class)
@Import(FeaturePredictorServiceTestConfiguration.class)
class FeaturePredictorServiceMvcTest extends SpringTestBase {

  private static final int CUSTOM_PARTIAL_RESPONSE_CODE = 209;
  private final UUID randomUuid = UUID.fromString("00000000-000-0000-0000-000000000001");

  @MockBean private FeaturePredictor featurePredictor;

  @Test
  void testPredictLocation() throws Exception {
    PredictForLocationRequest request =
        PredictForLocationRequest.from(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH),
            List.of(Location.from(100.0, 150.0, 30, 20)),
            List.of(PhaseType.P),
            "String",
            List.of());

    List<FeaturePrediction<?>> featurePredictionList = new ArrayList<>();

    var expectedFpc = FeaturePredictionContainer.create(featurePredictionList);

    given(
            featurePredictor.predict(
                request.getPredictionTypes(),
                request.getSourceLocation(),
                request.getReceiverLocations(),
                request.getPhases(),
                request.getEarthModel(),
                request.getCorrectionDefinitions()))
        .willReturn(Pair.of(expectedFpc, Boolean.FALSE));

    MockHttpServletResponse response =
        postResult("/feature//predict-for-location", request, HttpStatus.OK);

    Assertions.assertEquals(HttpStatus.OK.value(), response.getStatus());
  }

  @Test
  void testPredictLocationPartialResponse() throws Exception {
    PredictForLocationRequest request =
        PredictForLocationRequest.from(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            EventLocation.from(0.0, 0.0, 0.0, Instant.EPOCH),
            List.of(Location.from(100.0, 150.0, 30, 20)),
            List.of(PhaseType.P),
            "String",
            List.of());

    List<FeaturePrediction<?>> featurePredictionList = new ArrayList<>();

    var expectedFpc = FeaturePredictionContainer.create(featurePredictionList);

    given(
            featurePredictor.predict(
                request.getPredictionTypes(),
                request.getSourceLocation(),
                request.getReceiverLocations(),
                request.getPhases(),
                request.getEarthModel(),
                request.getCorrectionDefinitions()))
        .willReturn(Pair.of(expectedFpc, Boolean.TRUE));

    MockHttpServletResponse response =
        postResult("/feature//predict-for-location", request, CUSTOM_PARTIAL_RESPONSE_CODE);

    Assertions.assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, response.getStatus());
  }

  @Test
  void testPredictLocationSolutionAndChannel() throws Exception {

    PredictForLocationSolutionAndChannelRequest request =
        PredictForLocationSolutionAndChannelRequest.from(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            LocationSolution.builder()
                .setId(randomUuid)
                .setData(LOCATION_SOLUTION_DATA_NO_MCS)
                .build(),
            List.of(Channel.builder().setName("fakeName").autoBuild()),
            List.of(PhaseType.P),
            "String",
            List.of());

    var mockedLocationSolution = Mockito.mock(LocationSolution.class);

    given(
            featurePredictor.predict(
                request.getPredictionTypes(),
                request.getSourceLocationSolution(),
                request.getReceivingChannels(),
                request.getPhases(),
                request.getEarthModel(),
                request.getCorrectionDefinitions()))
        .willReturn(Pair.of(mockedLocationSolution, false));

    MockHttpServletResponse response =
        postResult("/feature/predict-for-location-solution-and-channel", request, HttpStatus.OK);

    Assertions.assertEquals(response.getStatus(), HttpStatus.OK.value());
  }

  @Test
  void testPredictLocationSolutionAndChannelPartialResults() throws Exception {

    PredictForLocationSolutionAndChannelRequest request =
        PredictForLocationSolutionAndChannelRequest.from(
            List.of(FeaturePredictionType.ARRIVAL_TIME_PREDICTION_TYPE),
            LocationSolution.builder()
                .setId(randomUuid)
                .setData(LOCATION_SOLUTION_DATA_NO_MCS)
                .build(),
            List.of(Channel.builder().setName("fakeName").autoBuild()),
            List.of(PhaseType.P),
            "String",
            List.of());

    var mockedLocationSolution = Mockito.mock(LocationSolution.class);

    given(
            featurePredictor.predict(
                request.getPredictionTypes(),
                request.getSourceLocationSolution(),
                request.getReceivingChannels(),
                request.getPhases(),
                request.getEarthModel(),
                request.getCorrectionDefinitions()))
        .willReturn(Pair.of(mockedLocationSolution, true));

    MockHttpServletResponse response =
        postResult(
            "/feature/predict-for-location-solution-and-channel",
            request,
            CUSTOM_PARTIAL_RESPONSE_CODE);

    Assertions.assertEquals(CUSTOM_PARTIAL_RESPONSE_CODE, response.getStatus());
  }
}
