package gms.shared.featureprediction.plugin.correction.ellipticity;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.google.common.primitives.ImmutableDoubleArray;
import gms.shared.common.coi.types.EventLocation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.featureprediction.FeaturePredictionComponentType;
import gms.shared.featureprediction.plugin.api.lookuptable.DziewonskiGilbertEllipticityCorrectionLookupTablePlugin;
import gms.shared.featureprediction.utilities.math.GeoMath;
import gms.shared.stationdefinition.coi.channel.Location;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.commons.lang3.tuple.Triple;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DziewonskiGilbertEllipticityCorrectorTest {

  private static final String EARTH_MODEL = "MyAmazinglyAccurateEarthModel";

  private static final String PLUGIN_NAME = "MyBeautifulPlugin";

  @Mock private DziewonskiGilbertEllipticityCorrectorConfiguration mockConfiguration;

  private DziewonskiGilbertEllipticityCorrector dziewonskiGilbertEllipticityCorrector;

  @Mock private DziewonskiGilbertEllipticityCorrectionLookupTablePlugin mockLookupTable;

  @Mock private DziewonskiGilbertEllipticityCorrectorDefinition mockDefinition;

  @BeforeEach
  void init() {
    when(mockDefinition.getCorrectionModelPluginNameByModelNameMap())
        .thenReturn(Map.of(EARTH_MODEL, PLUGIN_NAME));
    when(mockConfiguration.getCurrentDziewonskiGilbertEllipticityCorrectorDefinition())
        .thenReturn(mockDefinition);

    var lookupTableMap = Map.of(PLUGIN_NAME, mockLookupTable);

    dziewonskiGilbertEllipticityCorrector =
        new DziewonskiGilbertEllipticityCorrector(mockConfiguration, lookupTableMap);
  }

  @Test
  void testCorrect() {
    // This table will return (3, 3, 3) when the distance is 3 and the depth is 3.
    when(mockLookupTable.getDepthsKmForData(PhaseType.P))
        .thenReturn(ImmutableDoubleArray.of(1, 2, 3, 4, 5, 6));
    when(mockLookupTable.getDistancesDegForData(PhaseType.P))
        .thenReturn(ImmutableDoubleArray.of(1, 2, 3, 4, 5, 6));
    when(mockLookupTable.getValues(PhaseType.P))
        .thenReturn(
            Triple.of(
                List.of(
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)),
                List.of(
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0)),
                List.of(
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0),
                    List.of(1.0, 2.0, 3.0, 4.0, 5.0, 6.0))));

    when(mockLookupTable.getAvailablePhaseTypes()).thenReturn(Set.of(PhaseType.P));

    // Great circle distance between source and receiver is 3 degrees.
    var sourceLocation = EventLocation.from(10, 10, 3, Instant.EPOCH);
    var receiverLocation = Location.from(13, 10, 3, 3);

    var result =
        dziewonskiGilbertEllipticityCorrector.correct(
            EARTH_MODEL, sourceLocation, receiverLocation, PhaseType.P);

    double colatitude =
        GeoMath.toColatitudeDeg(GeoMath.normalizeLatitude(sourceLocation.getLatitudeDegrees()));

    double azimuth =
        GeoMath.azimuth(
            sourceLocation.getLatitudeDegrees(),
            sourceLocation.getLongitudeDegrees(),
            receiverLocation.getLatitudeDegrees(),
            receiverLocation.getLongitudeDegrees());

    var expectedRawCorrection = travelTimeEllipticityCorrection(colatitude, azimuth, 3, 3, 3);

    Assertions.assertTrue(result.isPresent());
    var component = result.get();
    Assertions.assertEquals(
        FeaturePredictionComponentType.ELLIPTICITY_CORRECTION,
        component.getFeaturePredictionComponent());

    var duration = component.getValue().getValue();
    var seconds = (double) duration.toNanos() / 1_000_000_000;
    Assertions.assertEquals(expectedRawCorrection, seconds, 10e-9);
  }

  @Test
  void testInvalidPhase() {

    when(mockLookupTable.getAvailablePhaseTypes()).thenReturn(Set.of(PhaseType.P));

    var sourceLocation = EventLocation.from(10, 10, 3, Instant.EPOCH);
    var receiverLocation = Location.from(13, 10, 3, 3);

    var result =
        dziewonskiGilbertEllipticityCorrector.correct(
            EARTH_MODEL, sourceLocation, receiverLocation, PhaseType.Lg);

    Assertions.assertTrue(result.isEmpty());
  }

  @Test
  void testInvalidModel() {

    var sourceLocation = EventLocation.from(10, 10, 3, Instant.EPOCH);
    var receiverLocation = Location.from(13, 10, 3, 3);

    var result =
        dziewonskiGilbertEllipticityCorrector.correct(
            "MyAmazinglyAbsentEarthModel", sourceLocation, receiverLocation, PhaseType.Lg);

    Assertions.assertTrue(result.isEmpty());
  }

  @Test
  void testInitialize() {
    dziewonskiGilbertEllipticityCorrector.initialize();

    verify(mockLookupTable).initialize();
  }

  // Copying this intentionally. The output should match what the one in
  // DziewonskiGilbertEllipticityCorrector.
  private static double travelTimeEllipticityCorrection(
      double colatitudeDegrees, double azimuthDegrees, double tau0, double tau1, double tau2) {
    double colatitudeRadians = Math.toRadians(colatitudeDegrees);
    double azimuthRadians = Math.toRadians(azimuthDegrees);

    double sqrt3over2 = Math.sqrt(0.75);
    double sinColat = Math.sin(colatitudeRadians);

    return 0.25 * (1.0 + 3.0 * Math.cos(2.0 * colatitudeRadians)) * tau0
        + sqrt3over2 * Math.sin(2.0 * colatitudeRadians) * Math.cos(azimuthRadians) * tau1
        + sqrt3over2 * sinColat * sinColat * Math.cos(2.0 * azimuthRadians) * tau2;
  }
}
