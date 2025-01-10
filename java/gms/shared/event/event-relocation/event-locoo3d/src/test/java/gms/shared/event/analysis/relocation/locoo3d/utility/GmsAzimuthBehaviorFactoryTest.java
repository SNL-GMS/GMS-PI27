package gms.shared.event.analysis.relocation.locoo3d.utility;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.signaldetection.coi.detection.FeatureMeasurement;
import gms.shared.signaldetection.coi.values.NumericMeasurementValue;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.channel.Location;
import gov.sandia.gmp.baseobjects.globals.GeoAttributes;
import gov.sandia.gmp.baseobjects.observation.Observation;
import gov.sandia.gmp.util.globals.Globals;
import java.time.Instant;
import java.util.EnumMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GmsAzimuthBehaviorFactoryTest {

  @Mock private Observation observation;

  private final EnumMap<GeoAttributes, Double> predictions;
  private final FeatureMeasurement azimuthFm;
  private final EventLocation newEventLocation;
  private final Location stationLocation;

  GmsAzimuthBehaviorFactoryTest() {

    predictions = new EnumMap<>(GeoAttributes.class);

    azimuthFm = SignalDetectionTestFixtures.RECEIVER_TO_SOURCE_AZIMUTH_FEATURE_MEASUREMENT;
    newEventLocation = EventLocation.from(0, 0, 0, Instant.now());
    stationLocation = Location.from(0, 0, 0, 0);
  }

  @BeforeEach
  void setup() {
    when(observation.getPredictions()).thenReturn(predictions);
    when(observation.getAzimuth()).thenReturn(UtilityFixtures.OBS_AZIMUTH);
    when(observation.getDelaz()).thenReturn(UtilityFixtures.OBS_DELAZ);
  }

  @Test
  void testMissingAzimuth() {

    var locationBehaviors =
        GmsAzimuthBehaviorFactory.create(azimuthFm, observation, newEventLocation, stationLocation);
    assertTrue(locationBehaviors.isEmpty());
  }

  @Test
  void testInvalidRadiansAzimuth() {

    predictions.put(GeoAttributes.AZIMUTH, Globals.NA_VALUE);
    predictions.put(GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY, Globals.NA_VALUE);

    var locationBehaviors =
        GmsAzimuthBehaviorFactory.create(azimuthFm, observation, newEventLocation, stationLocation);
    assertTrue(locationBehaviors.isEmpty());
  }

  @Test
  void testRadiansAzimuth() {

    when(observation.getPhase()).thenReturn(UtilityFixtures.OBS_PHASE);

    predictions.put(GeoAttributes.AZIMUTH, 1.0);
    predictions.put(GeoAttributes.AZIMUTH_MODEL_UNCERTAINTY, 1.1);

    var locationBehaviors =
        GmsAzimuthBehaviorFactory.create(azimuthFm, observation, newEventLocation, stationLocation);
    assertEquals(1, locationBehaviors.size());
    assertEquals(
        Math.toDegrees(1.0),
        ((NumericMeasurementValue)
                locationBehaviors
                    .iterator()
                    .next()
                    .getPrediction()
                    .get()
                    .getPredictionValue()
                    .getPredictedValue())
            .getMeasuredValue()
            .getValue());
  }
}
